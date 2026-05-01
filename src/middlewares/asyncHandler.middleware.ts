import { NextFunction, Request, Response } from "express";

type AsyncControllerType = (req: Request, res: Response, next: NextFunction) => Promise<void|Response>;

export const asyncHandler = (controller: AsyncControllerType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(controller(req, res, next)).catch(next);
    };
};
