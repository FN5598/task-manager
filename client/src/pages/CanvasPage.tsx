import type { Socket } from "socket.io-client";
import { CanvasComponent } from "../canvasComponents/CanvasComponent";
import { ChatComponent } from "../canvasComponents/ChatComponent";
import { HeaderComponent } from "../components/HeaderComponent";

type CanvasPageProps = {
    socket: Socket;
    joined: boolean;
    setJoined: (value: boolean) => void;
    roomId: string;
    setRoomId: (value: string) => void;
}

export function CanvasPage({ socket, setJoined, joined, setRoomId, roomId }: CanvasPageProps) {
    return (
        <>
            <HeaderComponent />
            <div className="flex display-row justify-center gap-5 bg-bg-light">
                <CanvasComponent socket={socket} setJoined={setJoined} joined={joined} setRoomId={setRoomId} />

                <ChatComponent socket={socket} joined={joined} roomId={roomId} />
            </div>
        </>
    );
} 