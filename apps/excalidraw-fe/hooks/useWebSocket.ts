import { useEffect, useRef, useState } from "react";

export function useWebSocket(roomId:string,WS_BACkEND:string){
    const [socket,setSocket]=useState<WebSocket | null>(null)
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const isMounted=useRef(false)
   
    const connect=(token:string | null)=>{
        const ws=new WebSocket(`${WS_BACkEND}?token=${token}`)

        ws.onopen=()=>{
            console.log("ws connected")
            ws.send(
                JSON.stringify({
                type: "join_room",
                roomId,
                })
            );
            setSocket(ws);
        }

        ws.onclose = () => {
            console.warn("[WS] Disconnected, attempting reconnect...");
            setSocket(null);
            if (isMounted.current) {
                reconnectTimeout.current = setTimeout(() => connect(token), 2000);
            }
        };

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            ws.close(); // Force close on error
        };
    }
     useEffect(() => {
        isMounted.current=true
        if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) connect(token);
        }

        return () => {
            isMounted.current=false
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            socket?.close();
        };
    }, [roomId]);

  return socket;
}