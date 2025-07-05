
import { RoomCanvas } from "@/components/RoomCanvas"
interface PageProps{
    params:{
        roomId:string
    }
}
export default function Page({ params }: PageProps) {
  return <RoomCanvas roomId={params.roomId} />
}

