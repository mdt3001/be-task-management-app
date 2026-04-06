import mongoose from "mongoose";

export interface Project {
    name: string;
    description: string;
    emoji: string;
    workspace: mongoose.Types.ObjectId;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedAt: Date;
};

export interface ProjectDocument extends mongoose.Document, Project { };

const projectSchema = new mongoose.Schema<ProjectDocument>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true, required: false },
        emoji: { type: String, default: "📁", required: false },
        workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    {
        timestamps: true,
    }
);

const ProjectModel = mongoose.model<ProjectDocument>("Project", projectSchema);
export default ProjectModel;
