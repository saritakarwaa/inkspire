// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { HTTP_BACKEND } from "@/config";
// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Pen, ArrowRight, Sparkles } from "lucide-react";
// import { AnimatedShapes } from "@/components/animated-shapes";
// import { CreateRoomSchema } from "@repo/common/types";


// export default function SelectRoomPage() {
//   const [roomCode, setRoomCode] = useState("");
//   const [loading, setLoading] = useState<"create" | "join" | null>(null);
//   const router = useRouter();
//   const [error, setError] = useState<string | null>(null);


//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const createRoom = async () => {
//     if (!roomCode.trim()) return;      
//     const result = CreateRoomSchema.safeParse({ name: roomCode.trim() });    
//     if (!result.success) {
//       setError(result.error.issues[0].message); // you can show all if you want
//       return;
//     }

//     setLoading("create");
//     try {
//       const res = await fetch(`${HTTP_BACKEND}/room`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${token}`,
//         },
//         body: JSON.stringify({ name: roomCode.trim() }),
//       });
//        if (res.status === 411) {
//         alert("Room already exists with this code.");
//         return;
//       }
//       const data = await res.json();
//       if (res.ok) {
//         router.push(`/canvas/${data.roomId}`);
//       } else {
//         setError(data.message || "Error creating room");
//       }
//     } catch {
//       setError("Error creating room");
//     } finally {
//       setLoading(null);
//     }
//   };

//   const joinRoom = async () => {
//     if (!roomCode.trim()) return;
//     setLoading("join");
//     try {
//       const res = await fetch(`${HTTP_BACKEND}/room/${roomCode.trim()}`);
//       const data = await res.json();
//       if (res.ok) router.push(`/canvas/${data.room.id}`);
//       else alert("Room not found");
//     } catch {
//       alert("Failed to join room");
//     } finally {
//       setLoading(null);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
//       <AnimatedShapes />

//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="relative z-10 w-full max-w-sm mx-6"
//       >
//         {/* Card */}
//         <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
//           {/* Logo / header */}
//           <div className="flex items-center justify-center mb-6">
//             <motion.div
//               animate={{ rotate: 360 }}
//               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//               className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3"
//             >
//               <Pen className="w-5 h-5 text-white" />
//             </motion.div>
//             <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//               Inkspire
//             </span>
//           </div>

//           {/* Single input */}
//           <div className="space-y-4">
//             <Input
//               id="roomCode"
//               placeholder="Room code / new slug"
//               value={roomCode}
//               onChange={(e) => setRoomCode(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && joinRoom()}
//               className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
//             />
//             {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

//             {/* Buttons */}
//             <div className="flex flex-col space-y-3">
//               <Button
//                 onClick={joinRoom}
//                 disabled={loading === "join" || !roomCode.trim()}
//                 className="w-full h-12 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
//               >
//                 {loading === "join" ? (
//                   <Spinner label="Joining…" />
//                 ) : (
//                   <>
//                     <span>Join Room</span>
//                     <ArrowRight className="w-4 h-4 ml-2" />
//                   </>
//                 )}
//               </Button>

//               <Button
//                 onClick={createRoom}
//                 disabled={loading === "create" || !roomCode.trim()}
//                 className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
//               >
//                 {loading === "create" ? (
//                   <Spinner label="Creating…" />
//                 ) : (
//                   <>
//                     <Sparkles className="w-4 h-4 mr-2" />
//                     <span>Create Room</span>
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// /* Small inline spinner component */
// function Spinner({ label }: { label: string }) {
//   return (
//     <div className="flex items-center space-x-2">
//       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//       <span>{label}</span>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "@/config";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pen, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedShapes } from "@/components/animated-shapes";
import { CreateRoomSchema } from "@repo/common/types";

export default function SelectRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const createRoom = async () => {
    if (!roomCode.trim()) return;
    const result = CreateRoomSchema.safeParse({ name: roomCode.trim() });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading("create");
    try {
      const res = await fetch(`${HTTP_BACKEND}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ name: roomCode.trim() }),
      });
      if (res.status === 411) {
        alert("Room already exists with this code.");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        router.push(`/canvas/${data.roomId}`);
      } else {
        setError(data.message || "Error creating room");
      }
    } catch {
      setError("Error creating room");
    } finally {
      setLoading(null);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) return;
    setLoading("join");
    try {
      const res = await fetch(`${HTTP_BACKEND}/room/${roomCode.trim()}`);
      const data = await res.json();
      if (res.ok) router.push(`/canvas/${data.room.id}`);
      else alert("Room not found");
    } catch {
      alert("Failed to join room");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      <AnimatedShapes />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm mx-6"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 p-8">
          {/* Logo / Header */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3"
            >
              <Pen className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Inkspire
            </span>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <Input
              id="roomCode"
              placeholder="Room code / new slug"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              className="h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-400 focus:ring-purple-400/20"
            />
            {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}

            {/* Buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                onClick={joinRoom}
                disabled={loading === "join" || !roomCode.trim()}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading === "join" ? (
                  <Spinner label="Joining…" />
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                onClick={createRoom}
                disabled={loading === "create" || !roomCode.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading === "create" ? (
                  <Spinner label="Creating…" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Create Room</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* Small inline spinner component */
function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span>{label}</span>
    </div>
  );
}
