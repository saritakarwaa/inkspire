import { Tool } from "@/components/Canvas"
import { getExistingShapes } from "./http"
import { nanoid } from "nanoid";

type Shape={id:string}&(|
{    type:"rect"
    x:number
    y:number
    width:number
    height:number
} | {
    type:"circle"
    centerX:number
    centerY:number
    radius:number
} | {
    type:"pencil"
    points: { x: number; y: number }[];
})

export class Game{
    private canvas:HTMLCanvasElement
    private ctx:CanvasRenderingContext2D
    private existingShapes:Shape[] 
    private roomId:string
    socket:WebSocket
    private clicked:boolean
    private startX:number
    private startY:number
    private selectedTool:Tool="circle"
    private currentPath:{x:number,y:number}[]=[]
    private undoStack:Shape[]=[]
    private redoStack:Shape[]=[]

    constructor(canvas:HTMLCanvasElement,roomId:string,socket:WebSocket){
        this.canvas=canvas
        this.ctx=canvas.getContext("2d")!
        this.socket=socket
        this.roomId=roomId
        this.existingShapes =[]
        this.clicked=false
        this.startX=0
        this.startY=0
        this.init()
        this.initHandlers()
        this.initMouseHandlers()
    }

    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup",this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove",this.mouseMoveHandler)
    }
    setTool(tool:"circle" | "pencil" | "rect"){
        this.selectedTool=tool
    }
    async init(){
        this.existingShapes=await getExistingShapes(this.roomId)
        this.clearCanvas()
    }

    initHandlers(){
        if (!this.socket) {
            console.error("WebSocket is not initialized")
            return
        }
        this.socket.onmessage=(event)=>{
            const message=JSON.parse(event.data)
            if(message.type==="shape_add"){
                this.existingShapes.push(message.shape)
            }
            if(message.type==="shape_undo"){
                console.log("Handling shape_undo for shapeId:", message.shapeId);
                console.log("Current shapes before undo:", this.existingShapes);
                this.existingShapes=this.existingShapes.filter(
                    (s)=>s.id!==message.shapeId
                )
                console.log("Shapes after undo:", this.existingShapes);
            }
            if(message.type==="shape_redo"){
                if (message.shape) {
                    this.existingShapes.push(message.shape); 
                } else {
                    console.warn("Redo received without shape:", message);
                }
            }
            this.clearCanvas()
        }
    }

    clearCanvas(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
        this.ctx.fillStyle="rgba(0,0,0)"
        this.existingShapes.map((shape)=>{
            if(shape.type==="rect"){
                this.ctx.strokeStyle="rgba(255,255,255)"
                this.ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
            }else if(shape.type==="circle"){
                this.ctx.beginPath()
                this.ctx.arc(shape.centerX,shape.centerY,Math.abs(shape.radius),0,Math.PI*2)
                this.ctx.stroke()
                this.ctx.closePath()
            }else if(shape.type==="pencil"){
                this.ctx.beginPath()
                const [first,...rest]=shape.points;
                this.ctx.moveTo(first.x,first.y)
                rest.forEach(p=>this.ctx.lineTo(p.x,p.y))
                this.ctx.stroke()
                this.ctx.closePath()
            }
        })
    }


    mouseUpHandler=(e:any)=>{
        this.clicked=false
        const width=e.clientX-this.startX
        const height=e.clientY-this.startY
       
        const selectedTool=this.selectedTool
        let shape:Shape | null=null
        const shapeId=nanoid()
        if(selectedTool==="rect"){
            shape={id:shapeId,type:"rect",x:this.startX,y:this.startY,height,width}
        }
        else if(selectedTool==="circle"){
            const radius=Math.max(width,height)/2
            shape={id:shapeId,type:"circle",radius:radius,centerX:this.startX+radius,centerY:this.startY+radius }    
        }
        else if(this.selectedTool==="pencil"){
            shape={id:shapeId,type:"pencil",points:this.currentPath}
            this.currentPath=[]
        }
        if(!shape) return
        this.existingShapes.push(shape)
        this.undoStack.push(shape)
        this.redoStack=[]
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "shape_add",
                shape,
                roomId: this.roomId
            }));
        } else {
            console.warn("WebSocket is not open, cannot send shape");
        }
    }


    mouseDownHandler=(e:any)=>{
        this.clicked=true
        this.startX=e.clientX
        this.startY=e.clientY

        if(this.selectedTool==="pencil"){
            this.currentPath=[{x:e.clientX,y:e.clientY}]
        }
    }
    mouseMoveHandler=(e:any)=>{
        if(this.clicked){ 
            const width=e.clientX-this.startX
            const height=e.clientY-this.startY
            this.clearCanvas()
            this.ctx.strokeStyle="rgba(255,255,255)"
            const selectedTool=this.selectedTool
            if(selectedTool==="rect"){
                this.ctx.strokeRect(this.startX,this.startY,width,height)
            }
            else if(selectedTool==="circle"){
                const radius=Math.max(width,height)/2
                const centerX=this.startX+radius
                const centerY=this.startY+radius
                this.ctx.beginPath()
                this.ctx.arc(centerX,centerY,Math.abs(radius),0,Math.PI*2)
                this.ctx.stroke()
                this.ctx.closePath()
            } 
            else if(selectedTool==="pencil"){
                this.currentPath.push({x:e.clientX,y:e.clientY})
                this.ctx.beginPath()
                const [first,...rest]=this.currentPath;
                this.ctx.moveTo(first.x,first.y)
                rest.forEach(p=>this.ctx.lineTo(p.x,p.y))
                this.ctx.stroke()
                this.ctx.closePath()
            }  
        }
    }


    initMouseHandlers(){
        this.canvas.addEventListener("mousedown",this.mouseDownHandler)
        this.canvas.addEventListener("mouseup",this.mouseUpHandler)
        this.canvas.addEventListener("mousemove",this.mouseMoveHandler)
    }

    undo(){
        if(this.existingShapes.length===0) return;
        const shape=this.existingShapes.pop()!
        console.log("Undo clicked, shape removed:", shape);
        this.redoStack.push(shape)
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
            type: "shape_undo",
            roomId: this.roomId,
            shapeId: shape.id,
            }));
        }
    }

    redo(){
        if(this.redoStack.length===0) return;
        const shape=this.redoStack.pop()!
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
            type: "shape_redo",
            roomId: this.roomId,
            shapeId: shape.id,
            shape
            }));
        }
    }
}