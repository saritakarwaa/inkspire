import { HTTP_BACKEND } from "@/config"
import axios from "axios"

type Shape={
    type:"rect"
    x:number
    y:number
    width:number
    height:number
} | {
    type:"circle"
    centerX:number
    centerY:number
    radius:number
}

export async function initDraw(canvas:HTMLCanvasElement,roomID:string,socket:WebSocket){
        const ctx=canvas.getContext("2d")

        let existingShapes:Shape[]=await getExistingShapes(roomID) //state management
        if(!ctx) return 

        socket.onmessage=(event)=>{
            const message=JSON.parse(event.data)
            if(message.type==="chat"){
                const parsedShape=JSON.parse(message.message)
                existingShapes.push(parsedShape.shape)
                clearCanvas(existingShapes,canvas,ctx)
            }
        }
        clearCanvas(existingShapes,canvas,ctx) 
        let clicked=false
        let startX=0
        let startY=0
        canvas.addEventListener("mousedown",(e)=>{
           clicked=true
           startX=e.clientX
           startY=e.clientY
        })
        canvas.addEventListener("mouseup",(e)=>{
            clicked=false
            const width=e.clientX-startX
            const height=e.clientY-startY
            const shape:Shape={type:"rect",x:startX,y:startY,height,width}
            existingShapes.push(shape)
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape }),
                    roomID
                }));
            } else {
                console.warn("WebSocket is not open. Cannot send shape.");
            }
        })
        canvas.addEventListener("mousemove",(e)=>{
            if(clicked){ 
                const width=e.clientX-startX
                const height=e.clientY-startY
                clearCanvas(existingShapes,canvas,ctx)
                ctx.strokeStyle="rgba(255,255,255)"
                ctx.strokeRect(startX,startY,width,height)
            }
        }) 
}

function clearCanvas(existingShapes:Shape[],canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle="rgba(0,0,0)"
    existingShapes.map((shape)=>{
        if(shape.type==="rect"){
            ctx.strokeStyle="rgba(255,255,255)"
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
        }
    })
}

async function getExistingShapes(roomId:string){
    // const res=await axios.get(`${HTTP_BACKEND}/chats/${roomId}`)
    // const data=res.data.messages
    // const shapes=data.messages.map((x:any):{message:string} =>{
    //     const messageData=JSON.parse(x.message)
    //     return messageData.shape
    // })
    // return shapes
     try {
        console.log("Calling:", `${HTTP_BACKEND}/chats/${roomId}`)
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const data = res.data.messages; // This is the array of messages

    const shapes = data.map((x: { message: string }) => {
      const messageData = JSON.parse(x.message);
      return messageData.shape;
    });

    return shapes;
  } catch (error) {
    console.error("Error fetching existing shapes:", error);
    return [];
  }
}