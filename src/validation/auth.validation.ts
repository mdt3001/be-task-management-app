import { z } from "zod";

export const emailSchema = z.object({
    email: z.string().trim().email("Invalid email address").min(1).max(255),
});

export const passwordSchema = z.object({
    password: z.string().trim().min(6).max(100),
});

export const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: emailSchema.shape.email,
    password: passwordSchema.shape.password,
});
