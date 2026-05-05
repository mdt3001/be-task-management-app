import { randomBytes } from "crypto";
import ProjectModel from "../models/project.model";

const randomSuffix = (len: number) =>
    randomBytes(len).toString("base64url").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, len);

const deriveBaseKey = (name: string): string => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    let key =
        words.length > 0
            ? words
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
            : "";
    if (key.length < 2) {
        key = name.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    }
    if (key.length < 2) {
        key = "PR";
    }
    return key.slice(0, 6);
};

export const generateUniqueProjectKey = async (workspaceId: string, name: string): Promise<string> => {
    const base = deriveBaseKey(name);
    for (let attempt = 0; attempt < 24; attempt++) {
        const candidate =
            attempt === 0 ? base : `${base.slice(0, Math.max(2, 6 - 3))}${randomSuffix(3)}`.slice(0, 10);
        const exists = await ProjectModel.exists({ workspace: workspaceId, key: candidate });
        if (!exists) {
            return candidate;
        }
    }
    return `${base.slice(0, 3)}${randomSuffix(6)}`.slice(0, 10);
};
