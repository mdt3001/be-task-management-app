import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config/app.config";
import connectDB from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException, UnauthorizedException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";
import { setupSwagger } from "./config/swagger.config";
import passport from "./config/passport.config";
import authRoutes from "./routes/auth.route";
import MongoStore from "connect-mongo";
import workspaceRoutes from "./routes/workspace.route";
import { isAuthenticated } from "./middlewares/isAuthenticated.middleware";
import memberRoutes from "./routes/member.route";
const app = express();
const BASE_PATH = config.BASE_PATH;

setupSwagger(app);

app.use(express.json());

app.use(
  session({
    name: "session",
    secret: config.SESSION_SECRET,
    resave: false,
      saveUninitialized: false,
      store: config.NODE_ENV === "production"
        ? (MongoStore.create({
            mongoUrl: config.MONGO_URI,
            collectionName: "sessions"
        }))
        : undefined,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: config.FRONTEND_ORIGIN,
        credentials: true,
    })
);

app.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException("This is a bad request example", ErrorCodeEnum.VALIDATION_ERROR);
}));

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/workspaces`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/members`, isAuthenticated, memberRoutes);

app.use(errorHandler);


app.listen(config.PORT, async() => {
    console.log(`Server is running on port ${config.PORT}`);
    await connectDB();
});
