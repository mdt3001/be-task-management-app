import { Router } from "express";
import { config } from "../config/app.config";
import passport from "passport";
import { googleLoginCallback, login, logout, register, getCurrentUser } from "../controllers/auth.controller";

const failUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;
const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/users/me", getCurrentUser);

authRoutes.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoutes.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: failUrl }),
    googleLoginCallback
);

export default authRoutes;
