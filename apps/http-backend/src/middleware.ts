import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config";

export function middleware(req:Request,res:Response,next:NextFunction){
    const token=req.headers["authorization"] ?? "";

    const decoded=jwt.verify(token,JWTSECRET);

    if(decoded){
        //@ts-ignore
        req.userId=decoded.userId;
        next()
    }
    else{
        res.status(403).json({message:"Unauthorized"})
    }
}  