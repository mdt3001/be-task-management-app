import mongoose from "mongoose";
import { config } from "./app.config";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URL);
        console.log("Connected to Mongo DB");
    } catch (error) {
        console.log("Error connecting to Mongo database");
        process.exit(1);
    }
};

export default connectDB;
