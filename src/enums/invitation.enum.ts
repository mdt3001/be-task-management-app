export const InvitationStatusEnum = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
} as const;

export type InvitationStatusEnumType = typeof InvitationStatusEnum[keyof typeof InvitationStatusEnum];
