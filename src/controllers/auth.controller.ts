import { config } from "../config/app.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { NextFunction, Request, Response } from "express";
import { registerSchema } from "../validation/auth.validation"
import { HTTPSTATUS } from "../config/http.config";
import { registerService } from "../services/auth.service";
import passport from "passport";

export const googleLoginCallback = asyncHandler(
    async (req: Request, res: Response) => { 
        const currentWorkspace = req.user?.currentWorkspace;
        if (!currentWorkspace) {
            return res.redirect(`${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`);
        }

        return res.redirect(`${config.FRONTEND_ORIGIN}/workspace/${currentWorkspace}`);
    }
);

export const register = asyncHandler(
    async (req: Request, res: Response) => { 
        const validationResult = registerSchema.safeParse({ ...req.body });
         if (!validationResult.success) {
             return res.status(HTTPSTATUS.BAD_REQUEST).json({
                 message: "Invalid registration payload",
                 errors: validationResult.error.issues,
             });
         }
        await registerService(validationResult.data);
        
        return res.status(HTTPSTATUS.CREATED).json({
            message: "User registered successfully",
        });
    }
);

export const login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("local", async (err: any, user: any, info: any) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: info?.message || "Invalid email or password",
                });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.json({
                    message: "Login successful",
                    user,
                });
            });
         })(req, res, next);
    }
);

export const logout = asyncHandler(
    async (req: Request, res: Response) => {
        return new Promise<void>((resolve, reject) => {
            req.logout((err) => {
                if (err) {
                    return reject(err);
                }
            
                if (req.session) {
                    req.session.destroy((err) => {
                        if (err) {
                            return reject(err);
                        }
                        res.json({
                            message: "Logout successful",
                        });
                        resolve();
                    });
                } else {
                    res.json({
                        message: "Logout successful",
                    });
                    resolve();
                }
            });
        });
    }
);
