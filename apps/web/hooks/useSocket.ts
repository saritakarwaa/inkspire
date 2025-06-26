import { use, useEffect, useState } from "react"
import { WS_URL } from "../app/room/config"


export function useSocket(){
    const [loading,setLoading]=useState(true)
    const [socket,setSocket]=useState<WebSocket>()

    useEffect(()=>{
        const ws=new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNjNmOTc1NC1iZjIxLTRlZmItODU1Ni1hNzE0ZTFlYzliYjMiLCJpYXQiOjE3NTA5MTk4MjV9.Lb2JQFEOtIgjb6hY-AS5vHeQeQi-AeqTYbvG4FxmSDw`)
        ws.onopen=()=>{
            setLoading(false)
            setSocket(ws)
        }
    },[])

    return {socket,loading}
}