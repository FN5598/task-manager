import { CanvasComponent } from "../canvasComponents/CanvasComponent";
import { ChatComponent } from "../canvasComponents/ChatComponent";
import { HeaderComponent } from "../components/HeaderComponent";
import { io, Socket } from "socket.io-client";


// Initialize socket connection outside the component
const socket: Socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

export function CanvasPage() {

    return (
        <>
            <HeaderComponent />
            <div className="flex display-row justify-center gap-5 bg-bg-light">
                <CanvasComponent socket={socket}/>

                <ChatComponent socket={socket} />
            </div>
        </>
    );
}