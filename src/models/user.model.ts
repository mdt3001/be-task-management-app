import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface UserSchema {
    name: string;
    email: string;
    password?: string;
    avatar: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    currentWorkspace: mongoose.Types.ObjectId | null;
}

export interface UserDocument extends Document, UserSchema {
    comparePassword(value: string): Promise<boolean>;
    omitPassword(): Omit<UserSchema, "password">;
}

const userSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6, select: false },
        avatar: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        currentWorkspace: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
    },
    { timestamps: true }
);  

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (this.password) {
            this.password = await hashValue(this.password);
        }
    }
    next();
});

userSchema.methods.omitPassword = function (): Omit<UserSchema, "password"> {
    const user = this.toObject();
    delete user.password;
    return user;
};

userSchema.methods.comparePassword = async function (value: string): Promise<boolean> {
    if (!this.password) return false;
    return await compareValue(value, this.password);
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
