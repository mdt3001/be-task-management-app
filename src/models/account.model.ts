import mongoose from "mongoose";
import { ProviderEnum, ProviderType } from "../enums/account-provider.enum";

export interface Account {
    provider: ProviderType;
    providerId: string;
    userId: mongoose.Types.ObjectId;
    refreshToken: string | null;
    tokenExpiry: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export interface AccountDocument extends mongoose.Document, Account {}

const accountSchema = new mongoose.Schema<AccountDocument>(
    {
        provider: { type: String, required: true, enum: Object.values(ProviderEnum) },
        providerId: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        refreshToken: { type: String, default: null, select: false },
        tokenExpiry: { type: Date, default: null },
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

accountSchema.index({ provider: 1, providerId: 1 }, { unique: true });
accountSchema.index({ userId: 1 });

const AccountModel = mongoose.model<AccountDocument>("Account", accountSchema);
export default AccountModel;
