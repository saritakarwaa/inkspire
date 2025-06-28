import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Game } from "@/draw/Game";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";

export type Tool="circle" | "rect" |"pencil"
export function Canvas({roomId,socket}:{roomId:string,socket:WebSocket}){
    const canvasRef=useRef<HTMLCanvasElement>(null)
    const [selectedTool,setSelectedTool]=useState<Tool>("circle")
    const [game,setGame]=useState<Game>()

    useEffect(()=>{
        game?.setTool(selectedTool)
    },[selectedTool,game])
    useEffect(()=>{
        if (canvasRef.current){
            const g=new Game(canvasRef.current,roomId,socket)
            setGame(g)
            return()=>{
                g.destroy()
            }
        };
    },[canvasRef])

    return <div style={{
        height:"100vh",
        overflow:"hidden"
    }}> 
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </div>
}  

function Topbar({selectedTool,setSelectedTool}:{selectedTool:Tool,setSelectedTool:(s:Tool)=>void}){
    return <div style={{
            position:"fixed",
            top:10,
            left:10
        }}>
        <div className="flex gap-4">
            <IconButton activated={selectedTool==="pencil"} icon={<Pencil/>} onClick={()=>{setSelectedTool("pencil")}}></IconButton>
            <IconButton activated={selectedTool==="rect"}  icon={<RectangleHorizontalIcon/>} onClick={()=>{setSelectedTool("rect")}}></IconButton>
            <IconButton activated={selectedTool==="circle"}  icon={<Circle/>} onClick={()=>{setSelectedTool("circle")}}></IconButton>
        </div>
    </div>
}