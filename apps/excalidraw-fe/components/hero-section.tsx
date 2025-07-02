"use client";

import { Button } from "@/components/ui/button";
import { Users, Zap, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedShapes } from "./animated-shapes";

export function HeroSection() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AnimatedShapes />
      
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent leading-tight"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            Inskpire
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Real-time collaborative drawing that brings ideas to life.
            <br />
            Create, collaborate, and inspire together.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Creating
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 text-lg font-semibold border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
            >
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-8 justify-center items-center text-center"
        >
          <motion.div 
            className="flex items-center space-x-2 text-gray-600"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium">Real-time Collaboration</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2 text-gray-600"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="p-2 bg-purple-100 rounded-full">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium">Lightning Fast</span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2 text-gray-600"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="p-2 bg-orange-100 rounded-full">
              <Palette className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-medium">Infinite Canvas</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
    </div>
  );
}