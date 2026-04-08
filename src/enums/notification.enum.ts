export const NotificationTypeEnum = {
    TASK_ASSIGNED: "TASK_ASSIGNED",
    TASK_DUE: "TASK_DUE",
    COMMENT_MENTION: "COMMENT_MENTION",
    WORKSPACE_INVITE: "WORKSPACE_INVITE",
} as const;

export type NotificationTypeEnumType = typeof NotificationTypeEnum[keyof typeof NotificationTypeEnum];
