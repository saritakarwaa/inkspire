
import * as zod from 'zod';

export const CreateUserSchema=zod.object({
    username:zod.string(),
    password:zod.string(),
    name:zod.string()
})

export const SignInSchema=zod.object({
    username:zod.string(),
    password:zod.string(),
})

export const CreateRoomSchema=zod.object({
    name:zod.string().min(1)
})