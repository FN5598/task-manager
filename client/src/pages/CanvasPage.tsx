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

export type RoomInfo = {
    roomId: number | "Loading ...";
    members?: string[]
    currentDrawerId?: number;
}

export function CanvasPage({ socket, setJoined, joined, setRoomId, roomId }: CanvasPageProps) {
    const navigate = useNavigate();
    const [wordToGuess, setWordToGuess] = useState<string>('');
    const [isGuessed, setIsGuessed] = useState(false);

    const theme = localStorage.getItem("isLightTheme");
    const username = localStorage.getItem("username");

    const [roomInfo, setRoomInfo] = useState<RoomInfo>({
        roomId: "Loading ..."
    });

    useEffect(() => {
        if (!joined) {
            navigate(`/`, { replace: true });
            setJoined(false);
            setRoomId("");
            socket.emit("leave-room");
        }

        const handleRoomInfo = ({ roomId, members, currentDrawerId }: RoomInfo) => {
            console.log("Received room-info:", { roomId, members, currentDrawerId });
            setRoomInfo({ roomId, members, currentDrawerId });
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
        return () => {
            socket.off("room-info", handleRoomInfo);
            socket.off("left-room", handleLeaveRoom);
        }
    }, [joined, navigate, setJoined, setRoomId, socket, theme]);

    function handleLeave() {
        if (!joined) return;
        socket.emit("message", { msg: `has left the game`, username });
        socket.emit("leave-room");
    }

    useEffect(() => {
        socket.emit("make-word");

        socket.emit("get-room-info");
    }, [socket]);

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
                    <p>Members: {roomInfo?.members?.length}</p>
                </div>
            </div>
            <CanvasComponent
                socket={socket}
                joined={joined}
                roomId={roomId}
                setWordToGuess={setWordToGuess}
                wordToGuess={wordToGuess}
                roomInfo={roomInfo}
                isGuessed={isGuessed} />

            <ChatComponent
                socket={socket}
                joined={joined}
                wordToGuess={wordToGuess}
                setIsGuessed={setIsGuessed}
            />
        </div>
    );
} 