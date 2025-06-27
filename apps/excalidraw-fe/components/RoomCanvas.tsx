"use client"
import {Canvas} from "@/components/Canvas"
import { WS_BACKEND } from "@/config"
import { initDraw } from "@/draw"
import {useRef,useEffect, useState} from "react"
export function RoomCanvas({roomId}:{roomId:string}){
     const [socket,setSocket]=useState<WebSocket | null>(null)

    useEffect(()=>{
        const ws=new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MGJmNDQ1ZS1jNzgzLTQ5YWYtODc0Ni02MTY0YjA2NzJjY2QiLCJpYXQiOjE3NTEwMzY3NTR9.lRoCQQDeC4l4kVLdQkUjpPmJ-chWDY3E_ilIHW8Cehc`)
        ws.onopen=()=>{
            ws.send(JSON.stringify({
                type:"join_room",
                roomId
            }))
            setSocket(ws)
        }
        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.warn("WebSocket closed");
        };

    },[])
    if(!socket){
        return <div>Connecting to server...</div>
    }

    return (
        <div>
            <Canvas roomId={roomId} socket={socket}/>
        </div>
    )
    
}
