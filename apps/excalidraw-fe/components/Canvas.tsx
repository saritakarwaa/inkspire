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
  Palette,
  Download,
  Share2,
  Type
} from "lucide-react";

export type Tool = "circle" | "rect" | "pencil" | "text";

export function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [game, setGame] = useState<Game>();
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [roomId]);

  return (
    <div className="h-screen relative">
      <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ backgroundColor: "white" }}
      />
      </div>
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        undo={() => game?.undo()}
        redo={() => game?.redo()}
      />
    </div>
  );
}

function Topbar({
  selectedTool,
  setSelectedTool,
  undo,
  redo,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  undo: () => void;
  redo: () => void;
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

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <IconButton icon={<Undo className="w-5 h-5" />} onClick={undo} />
        <IconButton icon={<Redo className="w-5 h-5" />} onClick={redo} />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <IconButton icon={<Palette className="w-5 h-5" />} onClick={() => {}} />
        <IconButton icon={<Download className="w-5 h-5" />} onClick={() => {}} />
        <IconButton icon={<Share2 className="w-5 h-5" />} onClick={() => {}} />
      </div>
    </div>
  );
}
