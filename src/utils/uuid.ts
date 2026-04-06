import { randomBytes } from "crypto";

export const generateInviteCode = () => {
    return randomBytes(9).toString("base64url");
};

export const generateTaskCode = () => {
    return randomBytes(6).toString("base64url");
};
