"use client";

import { motion } from "framer-motion";

export function AnimatedShapes() {
  const shapes = [
    {
      type: "circle",
      size: 60,
      color: "bg-blue-500/20",
      delay: 0,
      radius: 200,
      duration: 20,
    },
    {
      type: "rectangle",
      size: 50,
      color: "bg-purple-500/20",
      delay: 2,
      radius: 250,
      duration: 25,
    },
    {
      type: "triangle",
      size: 40,
      color: "bg-orange-500/20",
      delay: 4,
      radius: 180,
      duration: 18,
    },
    {
      type: "circle",
      size: 35,
      color: "bg-green-500/20",
      delay: 1,
      radius: 300,
      duration: 30,
    },
    {
      type: "rectangle",
      size: 45,
      color: "bg-pink-500/20",
      delay: 3,
      radius: 220,
      duration: 22,
    },
    {
      type: "circle",
      size: 25,
      color: "bg-yellow-500/20",
      delay: 5,
      radius: 160,
      duration: 16,
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute ${shape.color} ${
            shape.type === "circle" ? "rounded-full" : 
            shape.type === "triangle" ? "clip-triangle" : "rounded-lg"
          }`}
          style={{
            width: shape.size,
            height: shape.size,
            left: "50%",
            top: "50%",
            marginLeft: -shape.size / 2,
            marginTop: -shape.size / 2,
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
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "linear",
            delay: shape.delay,
          }}
        />
      ))}
    </div>
  );
}