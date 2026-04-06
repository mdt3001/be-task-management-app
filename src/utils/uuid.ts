import { randomBytes } from "crypto";

export const generateInviteCode = () => {
    return randomBytes(9).toString("base64url");
};
