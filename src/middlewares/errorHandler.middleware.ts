import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/appError";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path} - ${error.message}`);

    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Bad Request",
            errorCode: "Invalid JSON payload",
        });
    }

    if (error instanceof ZodError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Validation Error",
            errorCode: "VALIDATION_ERROR",
            issues: error.issues,
        });
    }

    if(error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode || "UNKNOWN_ERROR",
        });
    }
    
    const statusCode = (error as any).statusCode || HTTPSTATUS.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
        message: statusCode === HTTPSTATUS.INTERNAL_SERVER_ERROR
            ? "Internal Server Error"
            : error.message,
        errorCode: (error as any).errorCode || "UNKNOWN_ERROR",
    });
};
