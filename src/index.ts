import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";

const app = express();
const BASE_PATH = config.BASE_PATH;

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

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Welcome to the API" });
});

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});
