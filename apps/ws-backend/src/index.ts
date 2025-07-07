import {WebSocketServer} from "ws";
import jwt from "jsonwebtoken"
import { JWTSECRET } from "@repo/backend-common/config";
import { WebSocket } from "ws";
import {prismaClient} from "@repo/db/client"
import http from 'http'

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});
const wss = new WebSocketServer({ server }); 
const port = Number(process.env.PORT) || 8080;
server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});

wss.on('headers', (headers) => {
  headers.push('Access-Control-Allow-Origin: https://inkspire-gamma.vercel.app');
  headers.push('Access-Control-Allow-Credentials: true');
});

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
        console.error("Token verification failed:", e);
        return null;
    }
}

function broadcast(roomId:string | number,payload:unknown){
    const roomKey=String(roomId)
    const message=JSON.stringify(payload)
    users.forEach((user)=>{
        const {ws}=user
        //skip users not in this room
        if(!user.rooms.includes(roomKey)) return
        if(ws.readyState!==WebSocket.OPEN){
            const idx=users.indexOf(user)
            if(idx!=-1) users.splice(idx,1)
            return
        }
        ws.send(message) 
    })
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
    
    ws.on('message',async function message(data){ 
        let parsedData: any;
        try {
            parsedData = JSON.parse(typeof data === "string" ? data : data.toString());
        } catch (e) {
            console.error("Invalid JSON message:", e);
            return;
        }
       if(parsedData.type==="join_room"){
        const user=users.find(x=>x.ws===ws) //find the user in the global users array
        user?.rooms.push(String(parsedData.roomId)) //push roomId to rooms array of that user
       } 
       if(parsedData.type==="leave_room"){
            const user=users.find(x=>x.ws===ws)   
            if(!user) return;
            user.rooms=user?.rooms.filter(x=>x!==String(parsedData.roomId)) //remove roomId
        }
       if(parsedData.type==="chat"){ //type:"chat",message:"hi there",roomId:"123"
            const roomId=Number(parsedData.roomId)
            const message=parsedData.message
            if (!message || isNaN(roomId)) {
                console.error("Invalid message or roomId:", parsedData);
                return;
            }
            const room = await prismaClient.room.findUnique({ where: { id: roomId } });
            if (!room) {
                console.error("Room does not exist:", roomId);
                return;
            }
            const user = await prismaClient.user.findUnique({ where: { id: userId } });
            if (!user) {
                console.error("User does not exist:", userId);
                return;
            }

            try{
                await prismaClient.chat.create({
                data:{
                    roomId,message,userId
                }
                })
                console.log("Chat saved:", message);

                users.forEach(user=>{
                    if(user.rooms.includes(parsedData.roomId)){
                        user.ws.send(JSON.stringify({
                            type:"chat",
                            message,
                            roomId
                        }))
                    }
                })
            }
            catch (e) {
                console.error("Failed to save chat:", e);
            }
        }
        if(parsedData.type==="shape_add"){
            const {roomId,shape}=parsedData
            await prismaClient.chat.create({
                data:{
                    roomId:Number(roomId),
                    userId,
                    message:JSON.stringify({shape}),
                    shapeId:shape.id
                }
            })
            broadcast(roomId,{
                type:"shape_add",
                shape,
            })
        }
        if(parsedData.type==="shape_undo"){
            const {roomId,shapeId}=parsedData
            await prismaClient.chat.updateMany({
                where:{roomId:Number(roomId),shapeId},
                data:{deleted:true}
            })
            broadcast(roomId,{type:"shape_undo",shapeId})
        }
        if (parsedData.type === "shape_redo") {
            const { roomId, shapeId } = parsedData;

            await prismaClient.chat.updateMany({
                where: { roomId: Number(roomId), shapeId },
                data: { deleted: false },
            });
            const shapeChat = await prismaClient.chat.findFirst({
                where: {
                    roomId: Number(roomId),
                    shapeId
                },
                orderBy: { id: "desc" }
            });

            let shape;
            if (shapeChat?.message) {
            try {
                shape = JSON.parse(shapeChat.message)?.shape;
            } catch (e) {
                console.error("Failed to parse shape for redo:", e);
            }
            } else {
            console.warn("No shape message found for redo:", shapeId);
            }

            broadcast(roomId, { type: "shape_redo", shapeId,shape });
        }
        if (parsedData.type === "shape_move") {
            const { roomId, shapeId, newPosition } = parsedData;
            broadcast(roomId, {
                type: "shape_move",
                shapeId,
                newPosition
            });
        }
    })
})
//we allow the user to receive and send messages to multiple rooms instead of restricting to single room
//State manangement on backend
// -the http backend we created was stateless
// the websocker server is stateful. some in memory variable you have to maintain for every user 
// the information that a user is connected to chat-room-1 should not be stored in database but rather in memory
//can use redux or maintain a global variable(const rooms=[]) or use singleton