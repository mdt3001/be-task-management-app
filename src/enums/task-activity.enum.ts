export const TaskActivityActionEnum = {
    CREATED: "CREATED",
    UPDATED: "UPDATED",
    STATUS_CHANGED: "STATUS_CHANGED",
    ASSIGNED: "ASSIGNED",
    COMMENTED: "COMMENTED",
    DELETED: "DELETED",
} as const;

export type TaskActivityActionEnumType = typeof TaskActivityActionEnum[keyof typeof TaskActivityActionEnum];
