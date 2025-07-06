"use client"

import { useParams } from "next/navigation"
import { RoomCanvas } from "@/components/RoomCanvas"
import { useEffect, useState } from "react"

export default function CanvasPage() {
  const params = useParams()
  const [roomId, setRoomId] = useState<string>("")
  
  useEffect(() => {
    // Get room ID from URL params
    if (params?.roomId) {
      setRoomId(params.roomId as string)
    }
  }, [params])

  if (!roomId) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    )
  }
  
  return <RoomCanvas roomId={roomId} />
}