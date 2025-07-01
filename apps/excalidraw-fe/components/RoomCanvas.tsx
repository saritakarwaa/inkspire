"use client"
import {Canvas} from "@/components/Canvas"
import { WS_BACKEND } from "@/config"
import { useWebSocket } from "@/hooks/useWebSocket"

export function RoomCanvas({roomId}:{roomId:string}){
     const socket=useWebSocket(roomId,WS_BACKEND)
    if(!socket){
        return <div>Connecting to server...</div>
    }

    return (
        <div>
            <Canvas roomId={roomId} socket={socket}/>
        </div>
    ) 
}
