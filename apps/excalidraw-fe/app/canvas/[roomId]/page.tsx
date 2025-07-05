
import { RoomCanvas } from "@/components/RoomCanvas"
interface PageProps{
    params:{
        roomId:string
    }
}
export default function Canvas({params}:PageProps){
    const {roomId} =params
    console.log(roomId)
   return <RoomCanvas roomId={roomId} />
}
