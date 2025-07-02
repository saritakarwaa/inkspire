"use client";

import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";


export function Navbar() {
    const router=useRouter()
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 relative z-50"
    >
      <motion.div 
        className="flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
          >
            <Pen className="w-4 h-4 text-white" />
          </motion.div>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Inskpire
        </span>
      </motion.div>
      
      <div className="flex items-center space-x-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost"  onClick={() => router.push("/signin")}
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            Sign In
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button onClick={() => router.push("/signup")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Sign Up
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
}