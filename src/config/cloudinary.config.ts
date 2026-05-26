import { v2 as cloudinary } from "cloudinary";
import { config } from "./app.config";

const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: config.CLOUDINARY_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_SECRET_KEY,
    });
    console.log("Connected to Cloudinary");
}

export default connectCloudinary;