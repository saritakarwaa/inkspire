import express from "express"
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config"
import { middleware,AuthenticatedRequest } from "./middleware.js"
import {CreateUserSchema,SignInSchema,CreateRoomSchema} from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import cors from "cors";
const app=express()


const allowedOrigins = ["http://localhost:3000", "https://inkspire-gamma.vercel.app"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use(express.json())
const PORT=process.env.PORT || 5000

app.post("/signup",async (req,res)=>{
    const parsedData=CreateUserSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({message:"Incorrect inputs"});
        return;
    }     
    const { username, name, password } = parsedData.data;
    
    try{
        const existing=await prismaClient.user.findUnique({where:{email:username}})
        if(existing) {
            res.status(400).json({message:'Email already exists'})
            return
        }
        const user=await prismaClient.user.create( {data: { name, email:username, password }})
        res.json({userId:user.id})
    }
    catch(e){
        console.error(e);
        res.status(411).json({message:"error"})
    }  
})

app.post("/signin",async (req,res)=>{
    if (!JWTSECRET) {
        throw new Error("JWTSECRET is not defined");
    }
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
    console.log("Incoming body:", req.body);
    const { userId } = req as AuthenticatedRequest;
    const parsedData=CreateRoomSchema.safeParse(req.body)
    console.log("Zod errors:", parsedData);
    if(!parsedData.success){
        console.log("BODY:", req.body);
        res.json({message:"Incorrect inputs"});
        return;
    }
   try{
        const room=await prismaClient.room.create({
            data:{
                slug:parsedData.data.name,
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

app.get("/chats/:roomId",async(req,res)=>{
    console.log("Incoming roomId:", req.params.roomId)
     const roomId=Number(req.params.roomId)
    if (isNaN(roomId)) {
     res.status(400).json({ message: "Invalid room ID" });
    }
    try{
        const messages=await prismaClient.chat.findMany({
            where: { roomId, deleted: false },  
            orderBy: { id: "asc" },
        });
        res.json({messages})
    }
    catch(e){
        console.log(e)
        res.json({messages:[]})
    }
})

app.get("/room/:slug",async(req,res)=>{
     const slug=req.params.slug
   try{
    const room= await prismaClient.room.findUnique({
        where:{
            slug
        },
    })
    if (!room) {
        console.log("room not found")
         res.status(404).json({ message: "Room is not found" });
         return
    }
    res.json({room})
   }
    catch (e) {
        console.error("Error fetching room:", e);
         res.status(500).json({ message: "Internal server error" });
    }
})


app.listen(PORT, () => console.log(`HTTP backend running on port ${PORT}`));