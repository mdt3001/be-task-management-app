import { config } from "../config/app.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { registerSchema } from "../validation/auth.validation"
import { HTTPSTATUS } from "../config/http.config";
import { registerService } from "../services/auth.service";

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
