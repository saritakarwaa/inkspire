"use client";

import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const router = useRouter();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 relative z-50">

      {/* Logo & Title */}
      <motion.div 
        className="flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <Pen className="w-4 h-4 text-white" />
          </motion.div>
        </div>
        <span className="text-xl font-bold 
                         bg-gradient-to-r from-blue-600 to-purple-600 
                         bg-clip-text text-transparent 
                         dark:from-blue-400 dark:to-purple-400">
          Inkspire
        </span>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <ThemeToggle />

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/signin")}
            className="text-gray-700 dark:text-gray-300 
                       hover:text-blue-600 dark:hover:text-blue-400 
                       hover:bg-blue-50 dark:hover:bg-gray-800/50 
                       transition-colors duration-200"
          >
            Sign In
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => router.push("/signup")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            Sign Up
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
}
