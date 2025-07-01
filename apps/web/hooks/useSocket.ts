import { use, useEffect, useState } from "react"
import { WS_URL } from "../app/room/config"


export function useSocket(){
    const [loading,setLoading]=useState(true)
    const [socket,setSocket]=useState<WebSocket>()

    useEffect(()=>{
        const ws=new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NjE3ZGNlYi1lMjA5LTQ4YzAtYTkzZS1kZjc1OWExNWFkNTIiLCJpYXQiOjE3NTEzNDkzMTN9.8786Ux6YW7dl5Iz4WvDY01Lfrld3iOphCYPQqiHNpVs`)
        ws.onopen=()=>{
            setLoading(false)
            setSocket(ws)
        }
    },[])

    return {socket,loading}
}