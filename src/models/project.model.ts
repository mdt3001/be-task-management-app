import mongoose from "mongoose";
import { ProjectStatusEnum, ProjectStatusEnumType } from "../enums/project.enum";

export interface Project {
    name: string;
    key: string;
    description: string;
    emoji: string;
    workspace: mongoose.Types.ObjectId;
    status: ProjectStatusEnumType;
    archivedAt?: Date | null;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedAt: Date;
};

export interface ProjectDocument extends mongoose.Document, Project { };

const projectSchema = new mongoose.Schema<ProjectDocument>(
    {
        name: { type: String, required: true, trim: true },
        key: { type: String, required: true, trim: true, uppercase: true },
        description: { type: String, default: "", trim: true, required: false },
        emoji: { type: String, default: "📁", required: false },
        workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
        status: { type: String, enum: Object.values(ProjectStatusEnum), default: ProjectStatusEnum.ACTIVE },
        archivedAt: { type: Date, default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    {
        timestamps: true,
    }
);

projectSchema.index({ workspace: 1, key: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1, updatedAt: -1 });

const ProjectModel = mongoose.model<ProjectDocument>("Project", projectSchema);
export default ProjectModel;
