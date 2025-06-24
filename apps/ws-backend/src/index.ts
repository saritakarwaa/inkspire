import {WebSocketServer} from "ws";
import jwt from "jsonwebtoken"
import { JWTSECRET } from "./config";
const wss=new WebSocketServer({port:8080})

wss.on('connection',function connection(ws,request){
    const url=request.url
    if(!url) return
    const queryParams=new URLSearchParams(url.split('?')[1])
    const token=queryParams.get('token') || ""
    const decoded=jwt.verify(token,JWTSECRET)
    if(!decoded || !(decoded as JWTPayload).userId){
        ws.close();
        return;
    }
    ws.on('message',function message(data){
        ws.send('pong')
    })
})