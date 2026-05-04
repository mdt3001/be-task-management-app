import { PermissionsEnumType } from "../enums/role.enum";
import { RolePermissions } from "./role-permission";

export const roleGuard = (
    role: keyof typeof RolePermissions,
    requiredPermissions: PermissionsEnumType[]
) => {
    const userPermissions = RolePermissions[role];

    const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
    if (!hasPermission) {
        throw new Error("Forbidden: You don't have the required permissions to perform this action.");
    }
};
