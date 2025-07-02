import axios from "axios"
import { BACKEND_URL } from "../config"
import { ChatRoom} from "../../../components/ChatRoom"
async function getRoomId(slug:string) {
    console.log(BACKEND_URL)
    try {
        const token=localStorage.getItem("token")
        console.log("Calling axios with:", `${BACKEND_URL}/room/${slug}`); 
        const response=await fetch(`${BACKEND_URL}/room/${slug}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                 "Authorization": `${token}`
            },})
         const data = await response.json();
        console.log("Room API response:", data);
        if (!data?.room?.id) {
            throw new Error("Room not found - ID missing");
        }

        return data.room.id;
    } catch (err:any) {
        console.error("Unexpected error:", err.response?.data || err.message);
        return null;   
    }
}

export default async function ChatRoom1({params}:{params:{slug:string}}){
    const slug=(await params).slug
    console.log("Fetching room for slug:", slug);
    const roomId=await getRoomId(slug)
     console.log("Fetched roomId:", roomId);
    if (!roomId) {
        return <div>Room not found</div>; 
    }
    return <ChatRoom id={roomId}/>
}  