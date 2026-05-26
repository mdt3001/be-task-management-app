import mongoose from "mongoose";
import AttachmentModel from "../models/attachment.model";
import TaskModel from "../models/task.model";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary.service";
import { getMemberRoleInWorkspace } from "./workspace.service";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/appError";
import { RolesEnum } from "../enums/role.enum";

const isTaskCreator = (userId: string, createdBy: mongoose.Types.ObjectId) => 
    createdBy.toString() === userId;

const isWorkspaceAdminOrOwner = (roleName: string) =>
    roleName === RolesEnum.ADMIN || roleName === RolesEnum.OWNER;

export const uploadAttachmentsService = async (
    userId: string,
    taskId: string,
    workspaceId: string,
    files: Express.Multer.File[]
) => {
    // Validate task exists and belongs to workspace
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFoundException("Task not found");
    }

    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }

    // Check permission - only task creator can upload
    if (!isTaskCreator(userId, task.createdBy)) {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        if (!isWorkspaceAdminOrOwner(role)) {
            throw new ForbiddenException("Only the task creator or workspace admin can upload attachments");
        }
    }

    if (!files || files.length === 0) {
        throw new BadRequestException("No files provided");
    }

    if (files.length > 5) {
        throw new BadRequestException("Maximum 5 files can be uploaded at once");
    }

    const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, `attachments/${workspaceId}/${taskId}`)
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Create attachment documents
    const attachmentDocs = files.map((file, index) => ({
        taskId: new mongoose.Types.ObjectId(taskId),
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        uploaderId: new mongoose.Types.ObjectId(userId),
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: uploadResults[index].public_id,
        url: uploadResults[index].secure_url,
    }));

    const attachments = await AttachmentModel.insertMany(attachmentDocs);

    // Update task attachmentCount
    await TaskModel.findByIdAndUpdate(
        taskId,
        { $inc: { attachmentCount: attachments.length } },
        { new: true }
    );

    return {
        attachments: attachments.map((att) => ({
            _id: att._id,
            fileName: att.fileName,
            mimeType: att.mimeType,
            size: att.size,
            url: att.url,
            uploadedAt: att.createdAt,
        })),
    };
};

export const getAttachmentsByTaskIdService = async (
    userId: string,
    taskId: string,
    workspaceId: string
) => {
    // Validate task exists and belongs to workspace
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFoundException("Task not found");
    }

    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }

    // Check workspace membership
    await getMemberRoleInWorkspace(userId, workspaceId);

    const attachments = await AttachmentModel.find({
        taskId,
        deletedAt: null,
    })
        .sort({ createdAt: -1 })
        .lean();

    return {
        attachments: attachments.map((att) => ({
            _id: att._id,
            fileName: att.fileName,
            mimeType: att.mimeType,
            size: att.size,
            url: att.url,
            uploaderId: att.uploaderId,
            uploadedAt: att.createdAt,
        })),
    };
};

export const softDeleteAttachmentService = async (
    userId: string,
    attachmentId: string,
    workspaceId: string
) => {
    const attachment = await AttachmentModel.findById(attachmentId);

    if (!attachment) {
        throw new NotFoundException("Attachment not found");
    }

    if (attachment.workspaceId.toString() !== workspaceId) {
        throw new BadRequestException("Attachment does not belong to this workspace");
    }

    // Check permission - only uploader or task creator can delete
    const task = await TaskModel.findById(attachment.taskId);
    if (!task) {
        throw new NotFoundException("Task not found");
    }

    const isUploader = attachment.uploaderId.toString() === userId;
    const isCreator = isTaskCreator(userId, task.createdBy);

    if (!isUploader && !isCreator) {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        if (!isWorkspaceAdminOrOwner(role)) {
            throw new ForbiddenException("You do not have permission to delete this attachment");
        }
    }

    // Soft delete
    attachment.deletedAt = new Date();
    await attachment.save();

    // Update task attachmentCount
    await TaskModel.findByIdAndUpdate(
        attachment.taskId,
        { $inc: { attachmentCount: -1 } },
        { new: true }
    );

    return { message: "Attachment deleted successfully" };
};

export const deleteAttachmentsForTaskService = async (taskId: string) => {
    // Get all attachments for the task
    const attachments = await AttachmentModel.find({
        taskId,
        deletedAt: null,
    });

    if (attachments.length === 0) {
        return;
    }

    // Delete files from Cloudinary
    const deletePromises = attachments.map((att) =>
        deleteFromCloudinary(att.storageKey).catch((error) => {
            console.error(`Failed to delete ${att.storageKey} from Cloudinary:`, error);
        })
    );

    await Promise.all(deletePromises);

    // Soft delete all attachments
    await AttachmentModel.updateMany(
        { taskId, deletedAt: null },
        { deletedAt: new Date() }
    );
};

export const getAttachmentByIdService = async (
    userId: string,
    attachmentId: string,
    workspaceId: string
) => {
    const attachment = await AttachmentModel.findById(attachmentId);

    if (!attachment) {
        throw new NotFoundException("Attachment not found");
    }

    if (attachment.workspaceId.toString() !== workspaceId) {
        throw new BadRequestException("Attachment does not belong to this workspace");
    }

    if (attachment.deletedAt) {
        throw new NotFoundException("Attachment has been deleted");
    }

    // Check workspace membership
    await getMemberRoleInWorkspace(userId, workspaceId);

    return {
        attachment: {
            _id: attachment._id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            url: attachment.url,
            uploaderId: attachment.uploaderId,
            uploadedAt: attachment.createdAt,
        },
    };
};
