import mongoose, { Document, Schema } from "mongoose";
import { PermissionsEnumType, RolesEnumType, RolesEnum, PermissionsEnum } from "../enums/role.enum";
import { RolePermissions } from "../utils/role-pemission";

export interface Role {
    name: RolesEnumType;
    permissions: Array<PermissionsEnumType>;   
}

export interface RoleDocument extends Document, Role { };

const roleSchema = new Schema<RoleDocument>(
    {
        name: { type: String, enum: Object.values(RolesEnum), required: true, unique: true },
        permissions: {
            type: [String], enum: Object.values(PermissionsEnum), required: true,
            default: function (this: RoleDocument) {
                return RolePermissions[this.name];
         },
        },
    },
    {
        timestamps: true,
    }   
);

const RoleModel = mongoose.model<RoleDocument>("Role", roleSchema);
export default RoleModel;
