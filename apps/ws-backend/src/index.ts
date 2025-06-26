import {WebSocketServer} from "ws";
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config";
import type { WebSocket } from "ws";
const wss=new WebSocketServer({port:8080})

//ugly state management using a global variable
interface User{
    ws:WebSocket
    rooms:string[]
    userId:string
}
const users:User[]=[]


function checkUser(token:string):string | null{
    try{
         const decoded=jwt.verify(token,JWTSECRET)
        if(typeof decoded=="string") return null;
        if(!decoded || !decoded.userId){
            return null;
        }
        return decoded.userId;
    }
    catch(e) {
        return null;
    }
}

wss.on('connection',function connection(ws,request){
    const url=request.url
    if(!url) return
    const queryParams=new URLSearchParams(url.split('?')[1])
    const token=queryParams.get('token') || ""
   
    const userId=checkUser(token)
    if(!userId) {
        ws.close();
        return;
    }
    users.push({
        ws,userId,rooms:[]
    })
    
    ws.on('message',function message(data){ 
       const parsedData=JSON.parse(data as unknown as string)
       if(parsedData.type==="join_room"){
        const user=users.find(x=>x.ws===ws) //find the user in the global users array
        user?.rooms.push(parsedData.roomId) //push roomId to rooms array of that user
       } 
       if(parsedData.type==="leave_room"){
        const user=users.find(x=>x.ws===ws)   
        if(!user) return;
        user.rooms=user?.rooms.filter(x=>x===parsedData.room) //remove roomId
       }
       if(parsedData.type==="chat"){ //type:"chat",message:"hi there",roomId:"123"
        const roomId=parsedData.roomId
        const message=parsedData.message
        users.forEach(user=>{
            if(user.rooms.includes(roomId)){
                user.ws.send(JSON.stringify({
                    type:"chat",
                    message:message,
                    roomId
                }))
            }
        })
       }
    })
})
//we allow the user to receive and send messages to multiple rooms instead of restricting to single room

//State manangement on backend
// -the http backend we created was stateless
// the websocker server is stateful. some in memory variable you have to maintain for every user 
// the information that a user is connected to chat-room-1 should not be stored in database but rather in memory
//can use redux or maintain a global variable(const rooms=[]) or use singleton