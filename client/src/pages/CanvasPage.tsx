import type { Socket } from "socket.io-client";
import { CanvasComponent } from "../canvasComponents/CanvasComponent";
import { ChatComponent } from "../canvasComponents/ChatComponent";
import { HeaderComponent } from "../components/HeaderComponent";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type CanvasPageProps = {
    socket: Socket;
    joined: boolean;
    setJoined: (value: boolean) => void;
    roomId: string;
    setRoomId: (value: string) => void;
}

export function CanvasPage({ socket, setJoined, joined, setRoomId, roomId }: CanvasPageProps) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!joined) {
            navigate(`/`, { replace: true });
            setJoined(false);
            setRoomId("");
            socket.emit("leave-room");
        }
    }, [navigate, joined, socket, setJoined, setRoomId]);

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