import { Tool } from "@/components/Canvas"
import { getExistingShapes } from "./http"
import { nanoid } from "nanoid";

export type Shape = { id: string } & (
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "pencil"; points: { x: number; y: number }[] }
  | { type: "text"; x: number; y: number; text: string; font: string }
  | { type: "line" | "arrow"; startX: number; startY: number; endX: number; endY: number }
);

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private permanentCanvas: HTMLCanvasElement
  private permanentCtx: CanvasRenderingContext2D

  private existingShapes: Shape[]
  private roomId: string
  socket: WebSocket

  private offsetX = 0
  private offsetY = 0
  private scale = 1

  private isPanning = false
  private lastPanX = 0
  private lastPanY = 0

  private panPositions: { x: number, y: number, t: number }[] = []

  private clicked: boolean
  private startX: number
  private startY: number

  private selectedTool: Tool = "circle"
  private currentPath: { x: number, y: number }[] = []
  private undoStack: Shape[] = []
  private redoStack: Shape[] = []
  private lastUndoId: string | null = null;
  private lastRedoId: string | null = null;
  private selectedShape: Shape | null = null
  private isDragging = false
  private dragOffsetX = 0
  private dragOffsetY = 0
  private strokeColor: string
  private fillColor: string

  // rendering flags / preview
  private needsRedraw = true
  private permanentDirty = true
  private previewShape: Shape | null = null

  // pencil throttle
  private lastPencilTime = 0
  private pencilThrottleMs = 8 // ~125Hz

  // zoom animation state
  private zoomAnimId: number | null = null
  private zoomDurationMs = 260
  private zoomEasing = (t: number) => 1 - Math.pow(1 - t, 3) // easeOut-like

  // pan momentum state
  private momentumId: number | null = null

  constructor(canvas: HTMLCanvasElement, private parent: HTMLElement, roomId: string, socket: WebSocket) {
    const isDarkTheme = document.documentElement.classList.contains("dark");
    this.strokeColor = isDarkTheme ? "#fff" : "#000";
    this.fillColor = isDarkTheme ? "#fff" : "#000";
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
    this.socket = socket
    this.roomId = roomId
    this.existingShapes = []
    this.clicked = false
    this.startX = 0
    this.startY = 0

    // create offscreen permanent canvas
    this.permanentCanvas = document.createElement('canvas')
    // initialize sizes (will be updated in resizeCanvas)
    this.permanentCanvas.width = this.canvas.width = window.innerWidth
    this.permanentCanvas.height = this.canvas.height = window.innerHeight
    this.permanentCtx = this.permanentCanvas.getContext('2d')!

    this.resizeCanvas()
    this.init()
    this.initHandlers()
    this.initMouseHandlers()
    this.renderLoop()
  }

  /** Convert client coordinates (mouse event clientX/clientY) into canvas pixel coordinates.
   *  This correctly handles page scroll, CSS scaling, and different backing sizes.
   */
  private getCanvasPoint(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    // map client coordinate into canvas internal coordinate system
    const x = (clientX - rect.left) * (this.canvas.width / rect.width)
    const y = (clientY - rect.top) * (this.canvas.height / rect.height)
    return { x, y }
  }

  /** Convert canvas pixel coords to world coords using current offset & scale.
   *  We treat offsetX/offsetY and scale in *canvas pixels* (not client pixels).
   */
  screenToWorld(canvasX: number, canvasY: number) {
    return {
      x: (canvasX - this.offsetX) / this.scale,
      y: (canvasY - this.offsetY) / this.scale
    }
  }

  worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY
    }
  }

  resizeCanvas() {
    window.addEventListener("resize", () => {
      // preserve previous permanent content by re-rendering from shapes after resize
      const w = window.innerWidth
      const h = window.innerHeight
      // set internal canvas pixel size to CSS size (no DPR scaling here to keep math simple)
      this.canvas.width = w
      this.canvas.height = h
      this.canvas.style.width = `${w}px`
      this.canvas.style.height = `${h}px`

      this.permanentCanvas.width = this.canvas.width
      this.permanentCanvas.height = this.canvas.height

      // ensure we re-render the permanent layer
      this.permanentDirty = true
      this.redrawPermanent()
      this.drawVisible()
    })
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.panMouseDown);
    this.canvas.removeEventListener("mouseup", this.panMouseUp);
    this.canvas.removeEventListener("mousemove", this.panMouseMove);
    this.canvas.removeEventListener("wheel", this.wheelZoom);
    this.canvas.removeEventListener("contextmenu", this.blockMenu);
  }
  setTool(tool: "circle" | "pencil" | "rect" | "text" | "select" | "line" | "arrow") {
    this.selectedTool = tool
  }
  async init() {
    this.existingShapes = await getExistingShapes(this.roomId)
    this.permanentDirty = true
    this.redrawPermanent()
    this.drawVisible()
  }

  initHandlers() {
    if (!this.socket) {
      console.error("WebSocket is not initialized")
      return
    }
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "shape_add") {
        if (!this.existingShapes.some(s => s.id === message.shape.id)) {
          this.existingShapes.push(message.shape);
          this.undoStack.push(message.shape);
          this.redoStack = [];
          this.permanentDirty = true;
        }
      } else if (message.type === "shape_undo") {
        if (message.shapeId !== this.lastUndoId) {
          const shapeIndex = this.existingShapes.findIndex(s => s.id === message.shapeId);
          if (shapeIndex !== -1) {
            const [shape] = this.existingShapes.splice(shapeIndex, 1);
            this.redoStack.push(shape);
            this.permanentDirty = true;
          }
          this.lastUndoId = message.shapeId;
        }
      } else if (message.type === "shape_redo") {
        if (message.shapeId !== this.lastRedoId) {
          if (message.shape && !this.existingShapes.some(s => s.id === message.shape.id)) {
            this.existingShapes.push(message.shape);
            this.undoStack.push(message.shape);
            const redoIndex = this.redoStack.findIndex(s => s.id === message.shapeId);
            if (redoIndex !== -1) {
              this.redoStack.splice(redoIndex, 1);
            }
            this.permanentDirty = true;
          }
          this.lastRedoId = message.shapeId;
        }
      } else if (message.type === "shape_move") {
        const shape = this.existingShapes.find(s => s.id === message.shapeId);
        if (shape) {
          if (shape.type === "rect" || shape.type === "text") {
            shape.x = message.newPosition.x;
            shape.y = message.newPosition.y;
          }
          else if (shape.type === "circle") {
            shape.centerX = message.newPosition.x;
            shape.centerY = message.newPosition.y;
          }
          else if (shape.type === "pencil") {
            const dx = message.newPosition.x - shape.points[0].x;
            const dy = message.newPosition.y - shape.points[0].y;
            for (const point of shape.points) {
              point.x += dx;
              point.y += dy;
            }
          }
          this.permanentDirty = true;
        }
      }
      // batch redraw after messages
      this.redrawPermanent()
      this.drawVisible()
    }
  }

  private redrawPermanent() {
    // draw all shapes into permanent (world coords)
    this.permanentCtx.setTransform(1, 0, 0, 1, 0, 0)
    this.permanentCtx.fillStyle = document.documentElement.classList.contains("dark") ? "#000" : "#fff";
    this.permanentCtx.fillRect(0, 0, this.permanentCanvas.width, this.permanentCanvas.height);

    for (const shape of this.existingShapes) {
      this.drawShape(shape, this.permanentCtx)
    }

    this.permanentDirty = false
    this.needsRedraw = true
  }

  private drawVisible() {
    if (this.permanentDirty) this.redrawPermanent()

    // reset transform and draw background
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#000" : "#fff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // apply pan & zoom (offsetX/Y are canvas pixels)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.translate(this.offsetX, this.offsetY)
    this.ctx.scale(this.scale, this.scale)

    // draw permanent (already in world coords)
    this.ctx.drawImage(this.permanentCanvas, 0, 0)

    // preview
    if (this.previewShape) {
      this.drawShape(this.previewShape, this.ctx)
    }

    if (this.isDragging && this.selectedShape) {
      this.drawShape(this.selectedShape, this.ctx)
    }
  }

  clearCanvas() {
    if (this.permanentDirty) {
      this.redrawPermanent()
    }
    this.drawVisible()
    this.needsRedraw = false
  }

  drawShape(shape: Shape, ctx: CanvasRenderingContext2D = this.ctx) {
    // same style logic as before
    if (this.selectedTool === "select" && this.selectedShape?.id === shape.id) {
      ctx.strokeStyle = (this.selectedTool === "select" && this.selectedShape?.id === shape.id) ? "blue" : this.strokeColor;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = 1;
    }

    if (shape.type === "rect") {
      ctx.strokeStyle = this.strokeColor;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
    else if (shape.type == "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    else if (shape.type === "pencil") {
      if (!shape.points || shape.points.length === 0) return;
      ctx.beginPath();
      const [first, ...rest] = shape.points;
      if (!first) return;
      ctx.moveTo(first.x, first.y);
      for (const pt of rest) ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.closePath()
    }
    else if (shape.type === "text") {
      ctx.fillStyle = this.fillColor
      ctx.font = "16px Arial"
      ctx.textBaseline = "top"
      ctx.fillText(shape.text, shape.x, shape.y)
    }
    else if (shape.type === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.startX, shape.startY);
      ctx.lineTo(shape.endX, shape.endY);
      ctx.stroke();
    }
    else if (shape.type === "arrow") {
      const { startX, startY, endX, endY } = shape;
      const headLength = 10;
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(endX, endY);
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
  }

  mouseUpHandler = (e: MouseEvent) => {
    if (this.isDragging && this.selectedShape) {
      this.isDragging = false;

      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: "shape_move",
          shapeId: this.selectedShape.id,
          newPosition: this.getShapePosition(this.selectedShape),
          roomId: this.roomId
        }));
      }

      this.permanentDirty = true
      this.redrawPermanent()
      this.drawVisible()
      return;
    }

    // use canvas-local coords
    const canv = this.getCanvasPoint(e.clientX, e.clientY)
    this.clicked = false
    const { x, y } = this.screenToWorld(canv.x, canv.y);
    const width = x - this.startX;
    const height = y - this.startY;

    const selectedTool = this.selectedTool
    let shape: Shape | null = null
    const shapeId = nanoid()
    if (selectedTool === "rect") {
      shape = { id: shapeId, type: "rect", x: this.startX, y: this.startY, height, width } as any
    }
    else if (selectedTool === "circle") {
      const radius = Math.abs(Math.max(width, height) / 2);
      shape = { id: shapeId, type: "circle", radius: radius, centerX: this.startX + radius, centerY: this.startY + radius } as any
    }
    else if (this.selectedTool === "pencil") {
      if (this.currentPath.length > 0) {
        shape = {
          id: shapeId,
          type: "pencil",
          points: [...this.currentPath],
        } as Shape;
      }
      this.currentPath = []
      this.previewShape = null
    }
    else if (selectedTool === "line" || selectedTool === "arrow") {
      let endX = x;
      let endY = y;
      if ((e as MouseEvent).shiftKey) {
        ({ x: endX, y: endY } = this.snapAngle(this.startX, this.startY, x, y));
      }

      shape = {
        id: shapeId,
        type: selectedTool,
        startX: this.startX,
        startY: this.startY,
        endX,
        endY
      } as any;
      this.previewShape = null
    }

    if (!shape) {
      this.previewShape = null
      this.drawVisible()
      return
    }

    this.existingShapes.push(shape)
    this.undoStack.push(shape)
    this.redoStack = []
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

    this.permanentDirty = true
    this.redrawPermanent()
    this.drawVisible()
  }

  mouseDownHandler = (e: MouseEvent) => {
    const canv = this.getCanvasPoint(e.clientX, e.clientY)
    const { x, y } = this.screenToWorld(canv.x, canv.y)

    if (this.selectedTool === "text") {
      this.createTextInput(e.clientX, e.clientY)
      return
    }
    if (this.selectedTool === "select") {
      this.selectedShape = this.getShapeAt(x, y);
      if (this.selectedShape) {
        this.isDragging = true;
        if (this.selectedShape.type === "rect") {
          this.dragOffsetX = x - this.selectedShape.x;
          this.dragOffsetY = y - this.selectedShape.y;
        }
        else if (this.selectedShape.type === "circle") {
          this.dragOffsetX = x - this.selectedShape.centerX;
          this.dragOffsetY = y - this.selectedShape.centerY;
        }
        else if (this.selectedShape.type === "pencil") {
          this.dragOffsetX = x - this.selectedShape.points[0].x;
          this.dragOffsetY = y - this.selectedShape.points[0].y;
        }
        else if (this.selectedShape.type === "text") {
          this.dragOffsetX = x - this.selectedShape.x;
          this.dragOffsetY = y - this.selectedShape.y;
        }
        this.drawVisible()
        return;
      }
    }
    this.clicked = true
    this.startX = x
    this.startY = y

    if (this.selectedTool === "pencil") {
      this.currentPath = [{ x, y }]
      this.previewShape = { id: "preview", type: "pencil", points: [...this.currentPath] } as Shape
      this.drawVisible()
    }
  }

  mouseMoveHandler = (e: MouseEvent) => {
    const canv = this.getCanvasPoint(e.clientX, e.clientY)
    const { x, y } = this.screenToWorld(canv.x, canv.y)

    if (this.isDragging && this.selectedShape) {
      if (this.selectedShape.type === "rect") {
        this.selectedShape.x = x - this.dragOffsetX;
        this.selectedShape.y = y - this.dragOffsetY;
      }
      else if (this.selectedShape.type === "circle") {
        this.selectedShape.centerX = x - this.dragOffsetX;
        this.selectedShape.centerY = y - this.dragOffsetY;
      }
      else if (this.selectedShape.type === "pencil") {
        const dx = x - this.dragOffsetX - this.selectedShape.points[0].x;
        const dy = y - this.dragOffsetY - this.selectedShape.points[0].y;
        for (const point of this.selectedShape.points) {
          point.x += dx;
          point.y += dy;
        }
      }
      else if (this.selectedShape.type === "text") {
        this.selectedShape.x = x - this.dragOffsetX;
        this.selectedShape.y = y - this.dragOffsetY;
      }

      this.drawVisible()
      return;
    }
    if (this.clicked) {
      const width = x - this.startX;
      const height = y - this.startY;

      if (this.selectedTool === "rect") {
        this.previewShape = {
          id: "preview",
          type: "rect",
          x: this.startX,
          y: this.startY,
          width,
          height
        } as any
      }
      else if (this.selectedTool === "circle") {
        const radius = Math.abs(Math.max(width, height) / 2);
        const centerX = this.startX + radius
        const centerY = this.startY + radius
        this.previewShape = {
          id: "preview",
          type: "circle",
          centerX,
          centerY,
          radius
        } as any
      }
      else if (this.selectedTool === "pencil") {
        const now = performance.now()
        if (now - this.lastPencilTime >= this.pencilThrottleMs) {
          this.lastPencilTime = now
          this.currentPath.push({ x, y })
          this.previewShape = { id: "preview", type: "pencil", points: [...this.currentPath] } as Shape
        }
      }
      else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
        let endX = x;
        let endY = y;
        if ((e as MouseEvent).shiftKey) {
          ({ x: endX, y: endY } = this.snapAngle(this.startX, this.startY, x, y));
        }
        this.previewShape = {
          id: "preview",
          type: this.selectedTool,
          startX: this.startX,
          startY: this.startY,
          endX,
          endY
        } as any
      }

      this.needsRedraw = true
      this.drawVisible()
    }
  }

  private renderLoop = () => {
    if (this.permanentDirty) {
      this.redrawPermanent()
    }

    if (this.needsRedraw) {
      this.drawVisible()
      this.needsRedraw = false
    }
    requestAnimationFrame(this.renderLoop)
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.panMouseDown);
    this.canvas.addEventListener("mouseup", this.panMouseUp);
    this.canvas.addEventListener("mousemove", this.panMouseMove);
    this.canvas.addEventListener("wheel", this.wheelZoom, { passive: false });
    this.canvas.addEventListener("contextmenu", this.blockMenu);
  }

  panMouseDown = (e: MouseEvent) => {
    // left click drawing
    if ((this.selectedTool === "text" || this.selectedTool === "select") && e.button === 0) {
      this.mouseDownHandler(e);
      return;
    }
    if (e.button === 0) {
      this.mouseDownHandler(e);
      return;
    }

    if (e.button === 1 || e.button === 2) {
      if (this.momentumId) cancelAnimationFrame(this.momentumId), this.momentumId = null
      if (this.zoomAnimId) cancelAnimationFrame(this.zoomAnimId), this.zoomAnimId = null

      this.isPanning = true;
      // record in canvas pixel space for consistency
      const p = this.getCanvasPoint(e.clientX, e.clientY)
      this.lastPanX = p.x
      this.lastPanY = p.y
      this.panPositions = [{ x: p.x, y: p.y, t: performance.now() }]
    }
  }

  panMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseUpHandler(e);
    if (e.button === 1 || e.button === 2) {
      this.isPanning = false;
      this.startMomentumIfNeeded()
    }
  }

  panMouseMove = (e: MouseEvent) => {
    if (this.isPanning) {
      const p = this.getCanvasPoint(e.clientX, e.clientY)
      const dx = p.x - this.lastPanX
      const dy = p.y - this.lastPanY
      this.offsetX += dx
      this.offsetY += dy
      this.lastPanX = p.x
      this.lastPanY = p.y

      // record sample (canvas pixels)
      const now = performance.now()
      this.panPositions.push({ x: p.x, y: p.y, t: now })
      while (this.panPositions.length > 10 && (now - this.panPositions[0].t) > 250) this.panPositions.shift()

      this.drawVisible()
      return
    }
    this.mouseMoveHandler(e)
  }

  private startMomentumIfNeeded() {
    const samples = this.panPositions
    if (samples.length < 2) return
    const last = samples[samples.length - 1]
    let idx = samples.length - 2
    while (idx > 0 && (last.t - samples[idx].t) < 50) idx--
    const earlier = samples[idx]
    const dt = (last.t - earlier.t) / 1000
    if (dt <= 0) return
    const vx = (last.x - earlier.x) / dt
    const vy = (last.y - earlier.y) / dt
    const speed = Math.hypot(vx, vy)
    if (speed < 200) return

    const friction = 0.94
    let curVx = vx
    let curVy = vy

    const step = () => {
      const dtSec = 16 / 1000
      this.offsetX += curVx * dtSec
      this.offsetY += curVy * dtSec
      curVx *= friction
      curVy *= friction
      this.drawVisible()
      if (Math.hypot(curVx, curVy) > 10) {
        this.momentumId = requestAnimationFrame(step)
      } else {
        this.momentumId = null
      }
    }
    if (this.momentumId) cancelAnimationFrame(this.momentumId)
    this.momentumId = requestAnimationFrame(step)
  }

  undo() {
    if (this.existingShapes.length === 0) return;

    const shape = this.existingShapes.pop()!;
    console.log("Local undo", shape.id);

    this.redoStack.push(shape);
    this.lastUndoId = shape.id;
    this.permanentDirty = true
    this.redrawPermanent()
    this.drawVisible()

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: "shape_undo",
        roomId: this.roomId,
        shapeId: shape.id,
      }));
    }
  }

  wheelZoom = (e: any) => {
    e.preventDefault();
    // compute canvas-local mouse position (crucial fix)
    const p = this.getCanvasPoint(e.clientX, e.clientY)
    const worldBefore = this.screenToWorld(p.x, p.y)

    const delta = -e.deltaY
    const zoomFactor = Math.exp(delta * 0.0018)
    const targetScale = Math.max(0.2, Math.min(5, this.scale * zoomFactor))
    if (Math.abs(targetScale - this.scale) < 1e-5) return

    const targetOffsetX = p.x - worldBefore.x * targetScale
    const targetOffsetY = p.y - worldBefore.y * targetScale

    if (this.zoomAnimId) cancelAnimationFrame(this.zoomAnimId), this.zoomAnimId = null
    if (this.momentumId) cancelAnimationFrame(this.momentumId), this.momentumId = null

    const startScale = this.scale
    const startOffX = this.offsetX
    const startOffY = this.offsetY
    const startTime = performance.now()
    const duration = this.zoomDurationMs

    const step = () => {
      const now = performance.now()
      const t = Math.min(1, (now - startTime) / duration)
      const eased = this.zoomEasing(t)
      this.scale = startScale + (targetScale - startScale) * eased
      this.offsetX = startOffX + (targetOffsetX - startOffX) * eased
      this.offsetY = startOffY + (targetOffsetY - startOffY) * eased
      this.drawVisible()
      if (t < 1) {
        this.zoomAnimId = requestAnimationFrame(step)
      } else {
        this.zoomAnimId = null
      }
    }
    this.zoomAnimId = requestAnimationFrame(step)
  }

  blockMenu = (e: any) => { e.preventDefault() }

  redo() {
    if (this.redoStack.length === 0) return;

    const shape = this.redoStack.pop()!;
    console.log("Local redo", shape.id);

    this.existingShapes.push(shape);
    this.lastRedoId = shape.id;
    this.permanentDirty = true
    this.redrawPermanent()
    this.drawVisible()

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
    const ta = document.createElement('textarea');
    ta.value = 'Text here';
    Object.assign(ta.style, {
      position: 'fixed',
      top: `${screenY}px`,
      left: `${screenX}px`,
      width: '200px',
      height: '24px',
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
      display: 'block',
    });
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
    setTimeout(() => {
      ta.focus();
      ta.select();
    }, 10);
    let committed = false
    const commit = () => {
      if (committed) return;
      committed = true
      const txt = ta.value.trim();
      if (txt) {
        const canv = this.getCanvasPoint(screenX, screenY)
        const world = this.screenToWorld(canv.x, canv.y);
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
        this.permanentDirty = true
        this.redrawPermanent()
        this.drawVisible()
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: "shape_add",
            roomId: this.roomId,
            shape,
          }));
        }
      }
      if (container.parentNode) container.remove();
      ta.removeEventListener('blur', commit);
      ta.removeEventListener('keydown', handleKeydown);
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commit();
      }
    };
    ta.addEventListener('blur', commit);
    ta.addEventListener('keydown', handleKeydown);
    ta.addEventListener('mousedown', e => e.stopPropagation());
    ta.addEventListener('mouseup', e => e.stopPropagation());
  }

  private getShapeAt(x: number, y: number): Shape | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (shape.type === "rect") {
        if (x >= shape.x && x <= shape.x + shape.width &&
          y >= shape.y && y <= shape.y + shape.height) {
          return shape;
        }
      }
      else if (shape.type === "circle") {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= shape.radius) {
          return shape;
        }
      }
      else if (shape.type === "pencil") {
        for (const point of shape.points) {
          const dx = x - point.x;
          const dy = y - point.y;
          if (dx * dx + dy * dy < 100) {
            return shape;
          }
        }
      }
      else if (shape.type === "text") {
        this.ctx.font = shape.font;
        const metrics = this.ctx.measureText(shape.text);
        if (x >= shape.x && x <= shape.x + metrics.width &&
          y >= shape.y && y <= shape.y + 20) {
          return shape;
        }
      }
    }
    return null;
  }

  private getShapePosition(shape: Shape): { x: number, y: number } {
    if (shape.type === "rect") return { x: shape.x, y: shape.y };
    if (shape.type === "circle") return { x: shape.centerX, y: shape.centerY };
    if (shape.type === "pencil") return { x: shape.points[0].x, y: shape.points[0].y };
    if (shape.type === "text") return { x: shape.x, y: shape.y };
    return { x: 0, y: 0 };
  }

  exportToJPEG() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) {
      console.error('Failed to create export canvas context');
      return;
    }
    const scaleFactor = 2;
    exportCanvas.width = this.canvas.width * scaleFactor;
    exportCanvas.height = this.canvas.height * scaleFactor;
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.translate(this.offsetX * scaleFactor, this.offsetY * scaleFactor);
    exportCtx.scale(this.scale * scaleFactor, this.scale * scaleFactor);

    for (const shape of this.existingShapes) {
      const shapeCopy = { ...shape };
      if (shapeCopy.type === "rect") {
        exportCtx.strokeStyle = "black";
        exportCtx.strokeRect(shapeCopy.x, shapeCopy.y, shapeCopy.width, shapeCopy.height);
      }
      else if (shapeCopy.type === "circle") {
        exportCtx.beginPath();
        exportCtx.arc(shapeCopy.centerX, shapeCopy.centerY, shapeCopy.radius, 0, Math.PI * 2);
        exportCtx.stroke();
      }
      else if (shapeCopy.type === "pencil") {
        if (!shapeCopy.points || shapeCopy.points.length === 0) continue;
        exportCtx.beginPath();
        const [first, ...rest] = shapeCopy.points;
        if (!first) continue;
        exportCtx.moveTo(first.x, first.y);
        for (const pt of rest) exportCtx.lineTo(pt.x, pt.y);
        exportCtx.stroke();
        exportCtx.closePath();
      }
      else if (shapeCopy.type === "text") {
        exportCtx.fillStyle = "black";
        exportCtx.font = "16px Arial";
        exportCtx.textBaseline = "top";
        exportCtx.fillText(shapeCopy.text, shapeCopy.x, shapeCopy.y);
      }
      else if (shapeCopy.type === "line") {
        exportCtx.beginPath()
        exportCtx.moveTo(shapeCopy.startX, shapeCopy.startY)
        exportCtx.lineTo(shapeCopy.endX, shapeCopy.endY)
        exportCtx.stroke();
        exportCtx.closePath();
      }
      else if (shapeCopy.type === "arrow") {
        exportCtx.beginPath();
        exportCtx.moveTo(shapeCopy.startX, shapeCopy.startY);
        exportCtx.lineTo(shapeCopy.endX, shapeCopy.endY);
        exportCtx.stroke();

        const angle = Math.atan2(shapeCopy.endY - shapeCopy.startY, shapeCopy.endX - shapeCopy.startX);
        const headLength = 10;
        exportCtx.beginPath();
        exportCtx.moveTo(shapeCopy.endX, shapeCopy.endY);
        exportCtx.lineTo(
          shapeCopy.endX - headLength * Math.cos(angle - Math.PI / 6),
          shapeCopy.endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        exportCtx.moveTo(shapeCopy.endX, shapeCopy.endY);
        exportCtx.lineTo(
          shapeCopy.endX - headLength * Math.cos(angle + Math.PI / 6),
          shapeCopy.endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        exportCtx.stroke();
      }
    }
    const dataURL = exportCanvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `Inkspire-${this.roomId}-${new Date().toISOString().slice(0, 10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }

  private snapAngle(startX: number, startY: number, endX: number, endY: number) {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const rawAngle = Math.atan2(dy, dx);
    const snappedAngle = Math.round(rawAngle / (Math.PI / 4)) * (Math.PI / 4);
    return {
      x: startX + Math.cos(snappedAngle) * length,
      y: startY + Math.sin(snappedAngle) * length
    };
  }

}
