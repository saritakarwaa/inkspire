"use client"

import { HTTP_BACKEND } from "@/config";
import { useRouter } from "next/navigation";
import { useState } from "react";


export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const router=useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
   const [error, setError] = useState("");


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError("")
    const endpoint=isSignin?"/signin":"/signup"
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
    try{
        const res=await fetch(`${HTTP_BACKEND}${endpoint}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(body)
        })
        const data=await res.json()
        if(!res.ok || data.message?.toLowerCase().includes("error")){
            setError(data.message || "Something went wrong")
            return
        }
        if(isSignin){
            localStorage.setItem("token",data.token)
            router.push("/room")
        }
        else{
            router.push("/signin")
        }
    }
    catch (e) {
      setError("Failed to connect to server");
      console.error(e);
    }

  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignin ? "Sign In to Your Account" : "Create an Account"}
        </h2>

        {!isSignin && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 font-medium">Email / Username</label>
          <input
            type="text"
            name="email"
            placeholder="Enter your email or username"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          {isSignin ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
