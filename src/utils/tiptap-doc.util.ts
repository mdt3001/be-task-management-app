export type TiptapDocument = {
    type: "doc";
    content: unknown[];
};

export const EMPTY_TIPTAP_DOC: TiptapDocument = {
    type: "doc",
    content: [{ type: "paragraph" }],
};

export const isTiptapDocument = (value: unknown): value is TiptapDocument =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as TiptapDocument).type === "doc" &&
    Array.isArray((value as TiptapDocument).content);

export const normalizeDescription = (value: unknown): TiptapDocument => {
    if (isTiptapDocument(value)) {
        return value;
    }

    if (typeof value === "string") {
        if (!value.trim()) {
            return EMPTY_TIPTAP_DOC;
        }
        try {
            const parsed: unknown = JSON.parse(value);
            if (isTiptapDocument(parsed)) {
                return parsed;
            }
        } catch {
            // plain text legacy
        }
        return {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: value }],
                },
            ],
        };
    }

    return EMPTY_TIPTAP_DOC;
};

export const serializeDescription = (value: unknown): TiptapDocument =>
    normalizeDescription(value);
