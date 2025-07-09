"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./../components/IconButton";
import { Game } from "@/draw/Game";
import {
  Circle,
  Pencil,
  RectangleHorizontal,
  Redo,
  Undo,
  Download,
  Type,
  MousePointer2,
  ArrowRight,
  Minus
} from "lucide-react";

export type Tool = "circle" | "rect" | "pencil" | "text" | "select" |"line" | "arrow";

export function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [game, setGame] = useState<Game>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting,setIsExporting]=useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const g = new Game(canvasRef.current,containerRef.current, roomId, socket);
      setGame(g);
      return () => {
        g.destroy();
      };
    }
  }, [roomId,socket]);
  

  useEffect(() => {
    // Initialize dimensions after mount
    setDimensions({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

   const handleExport = () => {
    if (game && !isExporting) {
      setIsExporting(true);
      try {
        game.exportToJPEG();
      } catch (error) {
        console.error("Export failed:", error);
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="h-screen relative">
      <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ backgroundColor: "white" }}
      />
      </div>
      {isExporting && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center">
          <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
          Exporting image...
        </div>
      )}
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        undo={() => game?.undo()}
        redo={() => game?.redo()}
        onExport={handleExport}
      />
    </div>
  );
}

function Topbar({
  selectedTool,
  setSelectedTool,
  undo,
  redo,
  onExport
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  undo: () => void;
  redo: () => void;
  onExport:()=> void;
}) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center bg-white rounded-full shadow-md px-3 py-2 space-x-2 border border-gray-200">
        <IconButton
          activated={selectedTool === "pencil"}
          icon={<Pencil className="w-5 h-5" />}
          onClick={() => setSelectedTool("pencil")}
        />
        <IconButton
          activated={selectedTool === "rect"}
          icon={<RectangleHorizontal className="w-5 h-5" />}
          onClick={() => setSelectedTool("rect")}
        />
        <IconButton
          activated={selectedTool === "circle"}
          icon={<Circle className="w-5 h-5" />}
          onClick={() => setSelectedTool("circle")}
        />
        <IconButton
          activated={selectedTool === "text"}
          icon={<Type className="w-5 h-5" />}
          onClick={() => setSelectedTool("text")}
        />

         <IconButton
          activated={selectedTool === "select"}
          icon={<MousePointer2 className="w-5 h-5" />}
          onClick={() => setSelectedTool("select")}
        />

        <IconButton activated={selectedTool==="line"} 
         icon={<Minus className="w-5 h-5"/>}
          onClick={() => setSelectedTool("line")}
        />

        <IconButton
          activated={selectedTool === "arrow"}
          icon={<ArrowRight className="w-5 h-5"/>} // simple arrow icon
          onClick={() => setSelectedTool("arrow")}
        />
        <div className="w-px h-5 bg-gray-200 mx-1" />

        <IconButton icon={<Undo className="w-5 h-5" />} onClick={undo} />
        <IconButton icon={<Redo className="w-5 h-5" />} onClick={redo} />

        <div className="w-px h-5 bg-gray-200 mx-1" />
          <IconButton icon={<Download className="w-5 h-5" />} onClick={onExport} />
        </div>
    </div>
  );
}
