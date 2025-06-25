import express from "express"
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config"
import { middleware } from "./middleware"
import {CreateUserSchema,SignInSchema,CreateRoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"

const app=express()

app.post("/signup",(req,res)=>{
    const data=CreateUserSchema.safeParse(req.body)
    if(!data.success){
        res.json({message:"Incorrect inputs"});
        return;
    }
    res.json({userId:"123"})
})

app.post("/signin",(req,res)=>{
    const data=SignInSchema.safeParse(req.body)
    if(!data.success){
        res.json({message:"Incorrect inputs"});
        return;
    }
    const userId=1;
    const token=jwt.sign({
        userId
    },JWTSECRET);
    res.json({token})
})

app.post("/room",middleware,(req,res)=>{

    const data=CreateRoomSchema.safeParse(req.body)
    if(!data.success){
        res.json({message:"Incorrect inputs"});
        return;
    }
    //db call
    res.json({roomId:123})
})

app.listen(3001)