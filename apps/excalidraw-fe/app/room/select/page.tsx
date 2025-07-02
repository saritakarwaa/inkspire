"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "@/config";

export default function SelectRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${HTTP_BACKEND}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: generateSlug() }), // You can generate a slug or ask user for name
      });

      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      alert("Error creating room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      const res = await fetch(`${HTTP_BACKEND}/room/${roomCode}`);
      const data = await res.json();
      if (res.ok) {
        router.push(`/canvas/${data.room.id}`);
      } else {
        alert("Room not found");
      }
    } catch (err) {
      alert("Failed to join room");
    }
  };

  const generateSlug = () =>
    Math.random().toString(36).substring(2, 8); // Random 6-char slug

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-6 bg-gray-50">
      <h1 className="text-2xl font-bold">Choose an action</h1>

      <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
        <button
          disabled={creating}
          onClick={handleCreateRoom}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          {creating ? "Creating..." : "Create Room"}
        </button>

        <div className="w-full border-t pt-4">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room slug"
            className="w-full border p-2 rounded mb-2"
          />
          <button
            onClick={handleJoinRoom}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
