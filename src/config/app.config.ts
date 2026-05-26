import { getEnv } from "../utils/get-env";

const appConfig = () => ({
    NODE_ENV: getEnv("NODE_ENV", "development"),
    PORT: getEnv("PORT", "8000"),
    BASE_PATH: getEnv("BASE_PATH", "/api"),
    MONGO_URI: getEnv("MONGO_URI", ""),

    SESSION_SECRET: getEnv("SESSION_SECRET", "default_secret"),
    SESSION_EXPIRES_IN: getEnv("SESSION_EXPIRES_IN", "1d"),

    GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID", ""),
    GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET", ""),
    GOOGLE_CALLBACK_URL: getEnv("GOOGLE_CALLBACK_URL", "http://localhost:8000/api/auth/google/callback"),

    FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
    FRONTEND_GOOGLE_CALLBACK_URL: getEnv("FRONTEND_GOOGLE_CALLBACK_URL", "http://localhost:5173/auth/google/callback"),

    CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY", ""),
    CLOUDINARY_SECRET_KEY: getEnv("CLOUDINARY_SECRET_KEY", ""),
    CLOUDINARY_NAME: getEnv("CLOUDINARY_NAME", ""),
});

export const config =appConfig();
