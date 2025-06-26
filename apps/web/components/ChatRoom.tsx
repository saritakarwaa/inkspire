import axios from "axios";
import { BACKEND_URL } from "../app/room/config";
import { ChatRoomClient } from "./ChatRoomClient";

async function getChats(roomId:string){
   try {
    const response = await axios.get(`${BACKEND_URL}/chat/${roomId}`);
    console.log(response.data);
    return response.data.messages || [];
  } catch (err: any) {
    console.error("Failed to fetch chats:", err.response?.data || err.message);
    return []; 
  }
}

export async function ChatRoom({id}:{id:string}){
    const messages=await getChats(id)
    return <ChatRoomClient id={id} messages={messages} />
}