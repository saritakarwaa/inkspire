import { initDraw } from "@/draw";
import { useEffect, useRef } from "react";

function waitForSocketToOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve();
    } else {
      socket.addEventListener("open", () => resolve(), { once: true });
    }
  });
}

export function Canvas({roomId,socket}:{roomId:string,socket:WebSocket}){
    const canvasRef=useRef<HTMLCanvasElement>(null)
    useEffect(()=>{
        if (!canvasRef.current) return;
         const setup = async () => {
            await waitForSocketToOpen(socket);
            initDraw(canvasRef.current!, roomId, socket);
        };

        setup();
    },[canvasRef,roomId,socket])

    return <div>
        <canvas ref={canvasRef} width={2000} height={1000}></canvas>
    </div>
}