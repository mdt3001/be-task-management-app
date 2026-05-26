import session from "express-session";
import MongoStore from "connect-mongo";
import { config } from "./app.config";

export const sessionMiddleware = session({
    name: "session",
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store:
        config.NODE_ENV === "production"
            ? MongoStore.create({
                  mongoUrl: config.MONGO_URI,
                  collectionName: "sessions",
              })
            : undefined,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: config.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
    },
});
