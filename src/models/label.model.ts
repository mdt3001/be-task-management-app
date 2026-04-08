import mongoose, { Document, Schema } from "mongoose";

export interface Label {
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    color: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LabelDocument extends Document, Label { };

const labelSchema = new Schema<LabelDocument>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        name: { type: String, required: true, trim: true },
        color: { type: String, required: true, default: "#6366F1", trim: true },
        description: { type: String, required: false, default: "", trim: true },
    },
    {
        timestamps: true,
    }
);

labelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

const LabelModel = mongoose.model<LabelDocument>("Label", labelSchema);
export default LabelModel;
