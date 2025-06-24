import express from "express"
import jwt from "jsonwebtoken"
import { JWTSECRET } from "./config"
import { middleware } from "./middleware"

const app=express()

app.post("/signup",(req,res)=>{
    res.json({userId:"123"})
})

app.post("/signin",(req,res)=>{
    const userId=1;
    const token=jwt.sign({
        userId
    },JWTSECRET);
    res.json({token})
})

app.post("/room",middleware,(req,res)=>{

    //db call
    res.json({roomId:123})
})

app.listen(3001)