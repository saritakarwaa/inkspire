import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId:string){
    const res=await axios.get(`${HTTP_BACKEND}/chats/${roomId}`)
    const data=res.data.messages
    
    if (!Array.isArray(data)) {
        console.warn("Expected messages to be an array. Got:", data);
        return [];
    }
    const shapes = data
  .filter((x: any) => !x.deleted)
  .map((x: { message: string }) => {
    try {
      return JSON.parse(x.message)?.shape;
    } catch (err) {
      console.error("Invalid shape JSON:", x.message);
      return null;
    }
  })
  .filter(Boolean);
    
    return shapes
}
