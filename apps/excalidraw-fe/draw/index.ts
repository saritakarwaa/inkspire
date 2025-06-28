import { HTTP_BACKEND } from "@/config"
import axios from "axios"



export async function initDraw(canvas:HTMLCanvasElement,roomId:string,socket:WebSocket){
        const ctx=canvas.getContext("2d")
        if(!ctx) return
        let existingShapes:Shape[]=await getExistingShapes(roomId) //state management
        console.log(existingShapes)
        clearCanvas(existingShapes, canvas, ctx);
        
        //clearCanvas(existingShapes,canvas,ctx)      
}



