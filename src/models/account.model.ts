import mongoose from "mongoose";
import { ProviderEnum, ProviderType } from "../enums/account-provider.enum";

export interface Account {
    provider: ProviderType;
    providerId: string;
    userId: mongoose.Types.ObjectId;
    refreshToken: string | null;
    tokenExpiry: Date | null;
    createdAt: Date;
};

const accountSchema = new mongoose.Schema<Account>(
    {
        provider: { type: String, required: true, enum: Object.values(ProviderEnum) },
        providerId: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        refreshToken: { type: String, default: null },
        tokenExpiry: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
    }, 
    {
        timestamps: true,
        toJSON: {
            transform: function (_doc, ret) {
            const { refreshToken, ...safe } = ret;
            return safe;
    },
        },
    }
)

const AccountModel = mongoose.model<Account>("Account", accountSchema);
export default AccountModel;
