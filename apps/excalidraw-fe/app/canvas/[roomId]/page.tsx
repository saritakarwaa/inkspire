
import { RoomCanvas } from "@/components/RoomCanvas"
export default async  function Canvas({params}:{params:{roomId:string}}){
    const {roomId} =await params
    console.log(roomId)
   return <RoomCanvas roomId={roomId} />
}
