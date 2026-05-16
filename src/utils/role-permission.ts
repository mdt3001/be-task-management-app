import { PermissionsEnum, PermissionsEnumType, RolesEnumType } from "../enums/role.enum";

export const RolePermissions: Record<RolesEnumType, Array<PermissionsEnumType>> = {
    OWNER: [
        PermissionsEnum.CREATE_WORKSPACE,
        PermissionsEnum.DELETE_WORKSPACE,
        PermissionsEnum.EDIT_WORKSPACE,
        PermissionsEnum.MANAGE_WORKSPACE_SETTINGS,

        PermissionsEnum.ADD_MEMBER,
        PermissionsEnum.REMOVE_MEMBER,
        PermissionsEnum.CHANGE_MEMBER_ROLE,

        PermissionsEnum.CREATE_PROJECT,
        PermissionsEnum.EDIT_PROJECT,
        PermissionsEnum.DELETE_PROJECT,

        PermissionsEnum.CREATE_TASK,
        PermissionsEnum.EDIT_TASK,
        PermissionsEnum.DELETE_TASK,

        PermissionsEnum.VIEW_ONLY,
    ],
    ADMIN: [
        PermissionsEnum.ADD_MEMBER,
        PermissionsEnum.CREATE_PROJECT,
        PermissionsEnum.EDIT_PROJECT,
        PermissionsEnum.DELETE_PROJECT,
        PermissionsEnum.CREATE_TASK,
        PermissionsEnum.EDIT_TASK,
        PermissionsEnum.DELETE_TASK,
        PermissionsEnum.MANAGE_WORKSPACE_SETTINGS,
        PermissionsEnum.VIEW_ONLY,
    ],
    MEMBER: [
        PermissionsEnum.VIEW_ONLY,
        PermissionsEnum.CREATE_TASK,
        PermissionsEnum.EDIT_TASK,
    ]
};
