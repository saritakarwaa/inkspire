
import { RoomCanvas } from "@/components/RoomCanvas"
interface CanvasPageProps{
    params:{
        roomId:string
    }
}
export default function Page({ params }: CanvasPageProps) {
  return <RoomCanvas roomId={params.roomId} />
}

