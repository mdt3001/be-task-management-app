import mongoose from "mongoose";
import "dotenv/config";
import { config } from "./app.config";


const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to Mongo DB");
    } catch (error) {
        console.log("Error connecting to Mongo database");
        console.error(error);
        process.exit(1);
    }
};

export default connectDB;
