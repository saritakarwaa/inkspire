"use client"

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
    messages,id
}:{messages:{message:string}[]; id:string}){
    const {socket,loading}=useSocket()
    const [chats,setChats]=useState(messages)
    const [currMsg,setCurrMsg]=useState("")
    useEffect(()=>{
        if(socket && !loading){
            (JSON.stringify({
                type:"join_room",
                roomId:id
            }))
            socket.onmessage=(event)=>{
                const parsedData=JSON.parse(event.data)
                if(parsedData.type==="chat"){
                    setChats(c=>[...c,{message:parsedData.message}])
                }
                
            }
        }
        return()=>{
            alert("closing")
            socket?.close()
        }
    },[socket,loading,id])

    return (
        <div>
            {chats.map((m,idx)=> <div key={idx}>{m.message}</div>)}
            <input type="text" value={currMsg} onChange={e=>{
                setCurrMsg(e.target.value)
            }}/>
            <button onClick={()=>{
                if (socket?.readyState === WebSocket.OPEN) {
                    socket?.send(JSON.stringify({
                    type:"chat",
                    roomId:id,
                    message:currMsg
                    }))
                    setCurrMsg("")
                }
                else{
                    console.warn("Websocket is not open.")
                }
                
            }}>Send message</button>
        </div>
    )
}