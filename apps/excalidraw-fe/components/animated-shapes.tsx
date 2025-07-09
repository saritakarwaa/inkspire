"use client";

import { motion } from "framer-motion";

export function AnimatedShapes() {
  const shapes = [
    { type: "circle", size: 60, color: "bg-blue-500/20", delay: 0, radius: 200, duration: 20 },
    { type: "rectangle", size: 50, color: "bg-purple-500/20", delay: 2, radius: 250, duration: 25 },
    { type: "triangle", size: 40, color: "bg-orange-500/20", delay: 4, radius: 180, duration: 18 },
    { type: "hexagon", size: 55, color: "bg-teal-500/20", delay: 1, radius: 230, duration: 28 },
    { type: "star", size: 45, color: "bg-pink-500/20", delay: 3, radius: 210, duration: 22 },
    { type: "circle", size: 35, color: "bg-green-500/20", delay: 1.5, radius: 300, duration: 30 },
    { type: "rectangle", size: 45, color: "bg-pink-500/20", delay: 3.5, radius: 220, duration: 22 },
    { type: "circle", size: 25, color: "bg-yellow-500/20", delay: 5, radius: 160, duration: 16 },
    { type: "hexagon", size: 30, color: "bg-red-500/20", delay: 2.5, radius: 270, duration: 24 },
    { type: "star", size: 50, color: "bg-indigo-500/20", delay: 4.5, radius: 190, duration: 20 },
    { type: "pencil", size: 40, color: "bg-gray-500/20", delay: 2.8, radius: 200, duration: 26 }
  ];

  const clipPaths: Record<string, string> = {
    triangle: "polygon(50% 0%, 0% 100%, 100% 100%)",
    hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    pencil: "polygon(0% 20%, 80% 0%, 100% 100%, 20% 100%)"
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      {shapes.map((shape, index) => {
        const isRound = shape.type === "circle";
        const isRect = shape.type === "rectangle";
        const clip = clipPaths[shape.type] || undefined;

        return (
          <motion.div
            key={index}
            className={`absolute ${shape.color}`}
            style={{
              width: shape.size,
              height: shape.size,
              left: "50%",
              top: "50%",
              marginLeft: -shape.size / 2,
              marginTop: -shape.size / 2,
              borderRadius: isRound ? "50%" : isRect ? "0.25rem" : undefined,
              clipPath: clip,
            }}
            animate={{
              rotate: 360,
              x: [
                Math.cos(0) * shape.radius,
                Math.cos(Math.PI / 2) * shape.radius,
                Math.cos(Math.PI) * shape.radius,
                Math.cos((3 * Math.PI) / 2) * shape.radius,
                Math.cos(2 * Math.PI) * shape.radius,
              ],
              y: [
                Math.sin(0) * shape.radius,
                Math.sin(Math.PI / 2) * shape.radius,
                Math.sin(Math.PI) * shape.radius,
                Math.sin((3 * Math.PI) / 2) * shape.radius,
                Math.sin(2 * Math.PI) * shape.radius,
              ],
              scale: [1, 1.2, 1, 0.8, 1],
              opacity: [0.8, 1, 0.8, 0.6, 0.8]
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: "linear",
              delay: shape.delay,
            }}
          />
        );
      })}
    </div>
  );
}