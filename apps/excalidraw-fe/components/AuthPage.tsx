"use client";

import { HTTP_BACKEND } from "@/config";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, User, Mail, Lock, AlertCircle } from "lucide-react";
import { AnimatedShapes } from "./animated-shapes";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const endpoint = isSignin ? "signin" : "signup";
    const body = isSignin
      ? {
          username: formData.email,
          password: formData.password,
        }
      : {
          username: formData.email,
          password: formData.password,
          name: formData.name,
        };
    
    try {
      const res = await fetch(`${HTTP_BACKEND}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials:"include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok || data.message?.toLowerCase().includes("error")) {
        setError(data.message || "Something went wrong");
        return;
      }
      
      if (isSignin) {
        localStorage.setItem("token", data.token);
        console.log(data.token)
        router.push("/room/select");
      } else {
        router.push("/signin");
      }
    } catch (e) {
      setError("Failed to connect to server");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      <AnimatedShapes />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3"
              >
                <Pen className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Inskpire
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isSignin ? "Welcome Back" : "Join Inskpire"}
            </h2>
            <p className="text-gray-600">
              {isSignin 
                ? "Sign in to continue your creative journey" 
                : "Create your account and start collaborating"
              }
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {!isSignin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-gray-700 font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: isSignin ? 0.2 : 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-gray-700 font-medium flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email / Username</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Enter your email or username"
                value={formData.email}
                onChange={handleChange}
                className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: isSignin ? 0.3 : 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-gray-700 font-medium flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Password</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: isSignin ? 0.4 : 0.5 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isSignin ? "Signing In..." : "Creating Account..."}</span>
                  </div>
                ) : (
                  isSignin ? "Sign In" : "Create Account"
                )}
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600">
              {isSignin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => router.push(isSignin ? "/signup" : "/signin")}
                className="text-blue-600 hover:text-purple-600 font-medium transition-colors duration-200"
              >
                {isSignin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}