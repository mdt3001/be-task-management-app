export const MemberStatusEnum = {
    INVITED: "INVITED",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    LEFT: "LEFT",
} as const;

export type MemberStatusEnumType = typeof MemberStatusEnum[keyof typeof MemberStatusEnum];
