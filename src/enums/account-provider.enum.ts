export const ProviderEnum = {
    GOOGLE: "google",
    GITHUB: "github",
    FACEBOOK: "facebook",
    EMAIL: "email",
} as const;

export type ProviderType = typeof ProviderEnum[keyof typeof ProviderEnum];
