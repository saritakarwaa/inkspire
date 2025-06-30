"use client"
import {Canvas} from "@/components/Canvas"
import { WS_BACKEND } from "@/config"
import {useEffect, useState} from "react"
export function RoomCanvas({roomId}:{roomId:string}){
     const [socket,setSocket]=useState<WebSocket | null>(null)

    useEffect(()=>{
        const ws=new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MGJmNDQ1ZS1jNzgzLTQ5YWYtODc0Ni02MTY0YjA2NzJjY2QiLCJpYXQiOjE3NTEwMzY3NTR9.lRoCQQDeC4l4kVLdQkUjpPmJ-chWDY3E_ilIHW8Cehc`)
        ws.onopen=()=>{
            setSocket(ws)
            const data=JSON.stringify({
                type:"join_room",
                roomId
            })
            console.log(data)
            ws.send(data)
        }
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
