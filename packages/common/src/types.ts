
import * as z from 'zod';

export const CreateUserSchema=z.object({
    username:z.string().min(3, { message: "Username must be at least 3 characters long" })
        .max(30, { message: "Username must be at most 30 characters long" })
        .regex(/^[a-zA-Z0-9_.]+$/, {
        message: "Username can only contain letters, numbers, underscores, or periods",
        }),
    password:z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one digit" })
        .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
    name:z.string()
        .min(1, { message: "Name is required" })
        .max(50, { message: "Name must be less than 50 characters" }),
})

export const SignInSchema=z.object({
    username:z.string().min(3, { message: "Username is required and must be at least 3 characters" }),
    password:z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

export const CreateRoomSchema=z.object({
    name:z.string() .min(1, { message: "Room name cannot be empty" })
        .max(50, { message: "Room name must be less than 50 characters" }),
})