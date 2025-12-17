import type { Socket } from "socket.io-client";
import { CanvasComponent } from "../canvasComponents/CanvasComponent";
import { ChatComponent } from "../canvasComponents/ChatComponent";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type CanvasPageProps = {
    socket: Socket;
    joined: boolean;
    setJoined: (value: boolean) => void;
    roomId: string;
    setRoomId: (value: string) => void;
}

type RoomInfo = {
    count: number | "Loading ...";
    roomId: string | "Loading ...";
    members: string[];
}

export function CanvasPage({ socket, setJoined, joined, setRoomId }: CanvasPageProps) {
    const navigate = useNavigate();
    const theme = localStorage.getItem("isLightTheme");

    const [roomInfo, setRoomInfo] = useState<RoomInfo>({
        count: "Loading ...",
        roomId: "Loading ...",
        members: []
    });

    useEffect(() => {
        if (!joined) {
            navigate(`/`, { replace: true });
            setJoined(false);
            setRoomId("");
            socket.emit("leave-room");
        }

        const handleRoomInfo = ({ count, roomId, members }: RoomInfo) => {
            console.log("Received room-info:", { count, roomId, members });
            setRoomInfo({ count, roomId, members });
        };

        function handleLeaveRoom() {
            toast.info("You have left the room.", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: `${theme}`
            });
            setJoined(false);
            setRoomId("");
            navigate(`/`);
        }

        socket.on("left-room", handleLeaveRoom);

        socket.on("room-info", handleRoomInfo);

        setTimeout(() => {
            socket.emit("get-room-info");
        }, 500);

        return () => {
            socket.off("room-info", handleRoomInfo);
            socket.off("left-room", handleLeaveRoom);
        }
    }, [joined, navigate, setJoined, setRoomId, socket, theme]);

    function handleLeave() {
        if (!joined) return;
        console.log("Leaving room", joined);
        socket.emit("leave-room");
    }

    return (
        <div className="flex flex-row gap-5 bg-bg-light h-screen justify-center">
            <div className="absolute top-2 left-2 flex flex-row gap-2">
                <button
                    onClick={() => handleLeave()}
                    className="text-text bg-danger p-2 rounded cursor-pointer">Leave room</button>
                <div className="text-text bg-bg p-2 rounded">
                    <p>Room ID: {roomInfo?.roomId}</p>
                </div>
                <div className="text-text bg-bg p-2 rounded">
                    <p>Members: {roomInfo?.members.length}</p>
                </div>
            </div>
            <CanvasComponent socket={socket} setJoined={setJoined} joined={joined} setRoomId={setRoomId} />
            <ChatComponent socket={socket} joined={joined} />
        </div>
    );
} 