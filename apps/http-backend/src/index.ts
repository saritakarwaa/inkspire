import express from "express"
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config"
import { middleware } from "./middleware.js"
import {CreateUserSchema,SignInSchema,CreateRoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"

const app=express()

app.use(express.json())
app.post("/signup",async (req,res)=>{
    const parsedData=CreateUserSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({message:"Incorrect inputs"});
        return;
    }     
    const { username, name, password } = parsedData.data;
    
    try{
        const existing=await prismaClient.user.findUnique({where:{email:username}})
        if(existing) res.status(400).json({message:'Email already exists'})
        const user=await prismaClient.user.create( {data: { name, email:username, password }})
        res.json({userId:user.id})
    }
    catch(e){
        console.error(e);
        res.status(411).json({message:"error"})
    }  
})

app.post("/signin",async (req,res)=>{
    const parsedData=SignInSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({message:"Incorrect inputs"});
        return;
    }
    const {username,password}=parsedData.data;
    const user=await prismaClient.user.findFirst({
        where:{email:username,password:password}
    })
    if(!user){
        res.status(403).json({message:"Not authorized"})
        return
    }
    const token=jwt.sign({
        userId:user?.id
    },JWTSECRET);
    res.json({token})
})

app.post("/room",middleware,async(req,res)=>{

    const parsedData=CreateRoomSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({message:"Incorrect inputs"});
        return;
    }
    //@ts-ignore
    const userId=req.userId
   try{
        const {name}=parsedData.data
        const room=await prismaClient.room.create({
            data:{
                slug:name,
                adminId:userId
            }
        })
         res.json({roomId:room.id})
    }    
   catch(e){
        console.error(e)
        res.status(411).json({message:"room already exists with this code"})
   }
})

app.listen(3001)