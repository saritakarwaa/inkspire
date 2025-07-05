
import { RoomCanvas } from "@/components/RoomCanvas"
export default function Canvas({params}:{params:{roomId:string}}){
    const {roomId} =params
    console.log(roomId)
   return <RoomCanvas roomId={roomId} />
}
