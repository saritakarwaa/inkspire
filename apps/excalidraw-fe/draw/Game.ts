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
}  | {
    type:"text"
    x:number
    y:number
    text:string
    font:string
})

export class Game{
    private canvas:HTMLCanvasElement
    private ctx:CanvasRenderingContext2D
    private existingShapes:Shape[] 
    private roomId:string
    socket:WebSocket

    private offsetX=0
    private offsetY=0
    private scale=1

    private isPanning=false
    private lastPanX=0
    private lastPanY=0

    private clicked:boolean
    private startX:number
    private startY:number
    private selectedTool:Tool="circle"
    private currentPath:{x:number,y:number}[]=[]
    private undoStack:Shape[]=[]
    private redoStack:Shape[]=[]

    constructor(canvas:HTMLCanvasElement,private parent: HTMLElement,roomId:string,socket:WebSocket){
        this.canvas=canvas
        this.ctx=canvas.getContext("2d")!
        this.socket=socket
        this.roomId=roomId
        this.existingShapes =[]
        this.clicked=false
        this.startX=0
        this.startY=0
        this.resizeCanvas()
        this.init()
        this.initHandlers()
        this.initMouseHandlers()
    }

    resizeCanvas(){ //resize canvas dynamically
        this.canvas.width=window.innerWidth
        this.canvas.height=window.innerHeight
        window.addEventListener("resize",()=>{
            this.canvas.width=window.innerWidth
            this.canvas.height=window.innerHeight
            this.clearCanvas()
        })
    }

    screenToWorld(x:number,y:number){
        return {
            x:(x-this.offsetX)/this.scale,
            y:(y-this.offsetY)/this.scale
        }
    }


    destroy(){
        // this.canvas.removeEventListener("mousedown",this.mouseDownHandler)
        // this.canvas.removeEventListener("mouseup",this.mouseUpHandler)
        // this.canvas.removeEventListener("mousemove",this.mouseMoveHandler)

        this.canvas.removeEventListener("mousedown", this.panMouseDown);
        this.canvas.removeEventListener("mouseup",   this.panMouseUp);
        this.canvas.removeEventListener("mousemove", this.panMouseMove);
        this.canvas.removeEventListener("wheel",     this.wheelZoom);
        this.canvas.removeEventListener("contextmenu", this.blockMenu);
    }
    setTool(tool:"circle" | "pencil" | "rect" | "text"){
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
        this.ctx.setTransform(1,0,0,1,0,0)
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
        this.ctx.translate(this.offsetX,this.offsetY)
        this.ctx.scale(this.scale,this.scale)
        for(const shape of this.existingShapes){
            this.drawShape(shape)
        }
    }

    drawShape(shape:Shape){
        if(shape.type==="rect"){
            this.ctx.strokeStyle = "black";
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        else if(shape.type=="circle"){
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        else if(shape.type==="pencil"){
            if (!shape.points || shape.points.length === 0) return;
            this.ctx.beginPath();
            const [first, ...rest] = shape.points;
            if (!first) return; 
            this.ctx.moveTo(first.x, first.y);
            for (const pt of rest) this.ctx.lineTo(pt.x, pt.y);
            this.ctx.stroke();
            this.ctx.closePath()
        }
        else if(shape.type==="text"){
            this.ctx.fillStyle="black"
            this.ctx.font="16px Arial"
            this.ctx.textBaseline="top"
            this.ctx.fillText(shape.text,shape.x,shape.y)
        }
    }


    mouseUpHandler=(e:MouseEvent)=>{
        this.clicked=false
        const { x, y } = this.screenToWorld(e.clientX, e.clientY);
        const width = x - this.startX;
        const height = y - this.startY;
       
        const selectedTool=this.selectedTool
        let shape:Shape | null=null
        const shapeId=nanoid()
        if(selectedTool==="rect"){
            shape={id:shapeId,type:"rect",x:this.startX,y:this.startY,height,width}
        }
        else if(selectedTool==="circle"){
            const radius=Math.abs(Math.max(width, height) / 2);
            shape={id:shapeId,type:"circle",radius:radius,centerX:this.startX+radius,centerY:this.startY+radius }    
        }
        else if(this.selectedTool==="pencil"){
            if (this.currentPath.length > 0) {
                shape = {
                id: shapeId,
                type: "pencil",
                points: [...this.currentPath],
                };
            }
            this.currentPath=[]
        }
        if(!shape) return
        this.existingShapes.push(shape)
        this.undoStack.push(shape)
        this.redoStack=[]
        console.log("Sending shape_add", shape.id)
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


    mouseDownHandler=(e:MouseEvent)=>{
       
        const {x,y}=this.screenToWorld(e.clientX,e.clientY)
        if(this.selectedTool==="text"){
            this.createTextInput(e.clientX,e.clientY)
            return
        }
        this.clicked=true
        this.startX=x
        this.startY=y

        if(this.selectedTool==="pencil"){
            this.currentPath=[{x,y}]
        }
        
    }
    mouseMoveHandler=(e:MouseEvent)=>{
        if(this.clicked){ 
            const { x, y } = this.screenToWorld(e.clientX, e.clientY);
            const width = x - this.startX;
            const height = y - this.startY;

            this.clearCanvas()
            this.ctx.strokeStyle="black"
            const selectedTool=this.selectedTool
            if(selectedTool==="rect"){
                this.ctx.strokeRect(this.startX,this.startY,width,height)
            }
            else if(selectedTool==="circle"){
                const radius=Math.abs(Math.max(width, height) / 2);
                const centerX=this.startX+radius
                const centerY=this.startY+radius
                this.ctx.beginPath()
                this.ctx.arc(centerX,centerY,Math.abs(radius),0,Math.PI*2)
                this.ctx.stroke()
                this.ctx.closePath()
            } 
            else if(selectedTool==="pencil"){
                this.currentPath.push({x,y})
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
        this.canvas.addEventListener("mousedown", this.panMouseDown);
        this.canvas.addEventListener("mouseup",   this.panMouseUp);
        this.canvas.addEventListener("mousemove", this.panMouseMove);
        this.canvas.addEventListener("wheel",     this.wheelZoom, { passive: false });
        // Prevent context menu on right-click
        this.canvas.addEventListener("contextmenu",this.blockMenu);

        // this.canvas.addEventListener("mousedown",this.mouseDownHandler)
        // this.canvas.addEventListener("mouseup",this.mouseUpHandler)
        // this.canvas.addEventListener("mousemove",this.mouseMoveHandler)
    }
    panMouseDown=(e:MouseEvent)=>{
        if (this.selectedTool === "text") {
        // For text tool, always handle left click
            if (e.button === 0) {
                this.mouseDownHandler(e);
                return;
            }
        }
        if (e.button === 0) {          // left‑click draws
                this.mouseDownHandler(e);
            } else if (e.button === 1 || e.button === 2) { // middle/right pan
                this.isPanning = true;
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
            }
    }

    panMouseUp=(e:MouseEvent)=>{
        if (e.button === 0) this.mouseUpHandler(e);
            this.isPanning = false;
    }

    panMouseMove=(e:MouseEvent)=>{
        if (this.isPanning) {
                const dx = e.clientX - this.lastPanX;
                const dy = e.clientY - this.lastPanY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
                this.clearCanvas();
                return;
            }
            this.mouseMoveHandler(e)
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

    wheelZoom=(e:any)=>{
         e.preventDefault();
            const zoomAmount = -e.deltaY * 0.001;
            this.scale *= 1 + zoomAmount;
            this.scale = Math.max(0.2, Math.min(5, this.scale));
            this.clearCanvas();
    }

    blockMenu=(e:any)=>{e.preventDefault()}

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

    private createTextInput(screenX: number, screenY: number) {
        console.log('Creating text input at:', screenX, screenY);
        
        // Create textarea element
        const ta = document.createElement('textarea');
        
        // Set initial content to ensure it has size
        ta.value = 'Text here';
        
        // Add debug styles to make it highly visible
        Object.assign(ta.style, {
            position: 'fixed',
            top: `${screenY}px`,
            left: `${screenX}px`,
            width: '200px',
            height: '24px', // Set explicit height
            zIndex: '2147483647',
            backgroundColor: 'yellow',
            color: 'black',
            border: '3px solid red',
            padding: '8px',
            fontSize: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            resize: 'none',
            outline: 'none',
            pointerEvents: 'auto',
            display: 'block', // Ensure it's visible
        });

        // Create a container to ensure proper rendering
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '2147483647',
            pointerEvents: 'none',
        });
        
        container.appendChild(ta);
        document.body.appendChild(container);
        console.log('Textarea container appended to body');

        // Add a slight delay before focusing to prevent immediate blur
        setTimeout(() => {
            ta.focus();
            ta.select();
            console.log('Textarea focused');
        }, 10);

        const commit = () => {
            console.log('Committing text:', ta.value);
            const txt = ta.value.trim();
            if (txt) {
            const world = this.screenToWorld(screenX, screenY);
            const shape: Shape = {
                id: nanoid(),
                type: "text",
                x: world.x,
                y: world.y,
                text: txt,
                font: "16px Arial"
            };

            this.existingShapes.push(shape);
            this.undoStack.push(shape);
            this.redoStack = [];
            this.clearCanvas();

            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                type: "shape_add",
                roomId: this.roomId,
                shape,
                }));
            }
            }
            container.remove();
        };

        // Add a delay before attaching blur handler
        setTimeout(() => {
            ta.addEventListener('blur', commit);
        }, 20);

        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
            }
        });
        
        // Prevent clicks on textarea from propagating to canvas
        ta.addEventListener('mousedown', e => e.stopPropagation());
        ta.addEventListener('mouseup', e => e.stopPropagation());
    }
}