import "dotenv/config";
import connectDB from "../config/database.config";
import RoleModel from '../models/role.model';
import mongoose from "mongoose";
import { RolePermissions } from "../utils/role-permission";
    
const seedRoles = async () => { 
    console.log("Seeding roles...");

    try {
        await connectDB();

        const session = await mongoose.startSession();
        session.startTransaction();
        
        console.log("Clearing existing roles...");
        await RoleModel.deleteMany({}).session(session);

        for (const roleName in RolePermissions) {
            const role = roleName as keyof typeof RolePermissions;
            const permissions = RolePermissions[role];

            const existingRole = await RoleModel.findOne({ name: role }).session(session);
            if (!existingRole) {
                const newRole = new RoleModel({
                    name: role,
                    permissions: permissions,
                });
                await newRole.save({ session });
                console.log(`Created role: ${role}`);
            } else {
                console.log(`Role already exists: ${role}`);
            }
        }
        
        await session.commitTransaction();
        console.log("Role seeding completed successfully.");
        
    } catch (error) {
        console.error("Error occurred while seeding roles:", error);
    }
};

seedRoles().catch((error) => {
    console.error("Error occurred while running the seeder:", error);
    process.exit(1);
});
