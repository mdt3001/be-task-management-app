export const ProjectStatusEnum = {
    ACTIVE: "ACTIVE",
    ARCHIVED: "ARCHIVED",
} as const;

export type ProjectStatusEnumType = typeof ProjectStatusEnum[keyof typeof ProjectStatusEnum];
