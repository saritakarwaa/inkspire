// import { ReactNode } from "react";

// export function IconButton({icon,onClick,activated}:{icon:ReactNode,onClick:()=>void,activated:boolean}){
//     return <div className={`m-2 pointer rounded-full border p-2 bg-black hover:bg-gray ${activated ? "text-red-400":"text-white"}`} onClick={onClick}>
//         {icon}
//     </div>
// }


import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IconButton({
  icon,
  activated,
  onClick,
}: {
  icon: ReactNode;
  activated?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition",
        activated ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
      )}
    >
      {icon}
    </button>
  );
}
