import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDB from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException, UnauthorizedException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";
import swaggerUi, { setup } from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import path from "path";

const app = express();
const BASE_PATH = config.BASE_PATH;

// Load and parse the OpenAPI specification
const filePath = path.join(__dirname, "docs", "openapi-skeleton.yaml");
const file = fs.readFileSync(filePath, "utf8");
const swaggerDocument = YAML.parse(file);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

app.use(
    session({
        name: "session",
        keys: [config.SESSION_SECRET],
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: config.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
    })
)

app.use(
    cors({
        origin: config.FRONTEND_ORIGIN,
        credentials: true,
    })
);

app.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException("This is a bad request example", ErrorCodeEnum.VALIDATION_ERROR);
}));

app.use(errorHandler);

app.listen(config.PORT, async() => {
    console.log(`Server is running on port ${config.PORT}`);
    await connectDB();
});
