import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Game } from "@/draw/Game";
import { Circle, Pencil, RectangleHorizontalIcon, Redo, Undo, Undo2 } from "lucide-react";

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
    },[roomId])

    return <div style={{
        height:"100vh",
        overflow:"hidden"
    }}> 
        <canvas style={{ backgroundColor: "black" }} ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} undo={()=>game?.undo()} redo={()=>game?.redo()} />
    </div>
}  

function Topbar({selectedTool,setSelectedTool,undo,redo}:{selectedTool:Tool,setSelectedTool:(s:Tool)=>void,undo:()=>void,redo:()=>void}){
    return <div style={{
            position:"fixed",
            top:10,
            left:10
        }}>
        <div className="flex gap-4">
            <IconButton activated={selectedTool==="pencil"} icon={<Pencil/>} onClick={()=>{setSelectedTool("pencil")}}></IconButton>
            <IconButton activated={selectedTool==="rect"}  icon={<RectangleHorizontalIcon/>} onClick={()=>{setSelectedTool("rect")}}></IconButton>
            <IconButton activated={selectedTool==="circle"}  icon={<Circle/>} onClick={()=>{setSelectedTool("circle")}}></IconButton>
            <button  className="px-2 py-1 rounded"onClick={undo}><Undo /></button>
            <button  className="px-2 py-1 rounded"onClick={redo}><Redo /></button>
        </div>
    </div>
}