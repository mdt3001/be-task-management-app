import { Request, Response, NextFunction } from "express";
import { HTTPSTATUS } from "../config/http.config";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
    }
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
};
