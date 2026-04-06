export const ProviderEnum = {
    GOOGLE: "google",
    GITHUB: "github",
    FACEBOOK: "facebook",
    EMAIL: "email",
};

export type ProviderType = typeof ProviderEnum[keyof typeof ProviderEnum];
