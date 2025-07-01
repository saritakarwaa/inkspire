import { useEffect, useRef, useState } from "react";

export function useWebSocket(roomId:string,WS_BACkEND:string){
    const [socket,setSocket]=useState<WebSocket | null>(null)
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const connect=()=>{
        const ws=new WebSocket(`${WS_BACkEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NjE3ZGNlYi1lMjA5LTQ4YzAtYTkzZS1kZjc1OWExNWFkNTIiLCJpYXQiOjE3NTEzNDkzMTN9.8786Ux6YW7dl5Iz4WvDY01Lfrld3iOphCYPQqiHNpVs`)

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
            reconnectTimeout.current = setTimeout(connect, 2000); // Retry after 2s
        };

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            ws.close(); // Force close on error
        };
    }
    useEffect(() => {
        connect(); // Initial connection

        return () => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
        socket?.close();
        };
    }, [roomId]);

  return socket;

}