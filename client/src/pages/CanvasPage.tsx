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
    members?: { id: string, username: string }[]
    currentDrawerId?: string;
}

export function CanvasPage({ socket, setJoined, joined, setRoomId, roomId }: CanvasPageProps) {
    const navigate = useNavigate();
    const [wordToGuess, setWordToGuess] = useState<string>('');
    const [isGuessed, setIsGuessed] = useState(false);
    const [canDraw, setCanDraw] = useState<boolean>(false)

    const theme = localStorage.getItem("isLightTheme");
    const username = localStorage.getItem("username");

    const [roomInfo, setRoomInfo] = useState<RoomInfo>({
        roomId: "Loading ..."
    });

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (joined) {
                socket.emit("leave-room");
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [socket, joined]);

    useEffect(() => {
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

        if (!joined) {
            navigate("/");
            return;
        }

        socket.on("left-room", handleLeaveRoom);
        socket.on("room-info", handleRoomInfo);

        return () => {
            socket.off("room-info", handleRoomInfo);
            socket.off("left-room", handleLeaveRoom);
        }
    }, [joined, navigate, setJoined, setRoomId, socket, theme]);

    useEffect(() => {
        socket.emit("make-word");

        socket.emit("get-room-info");
    }, [socket]);

    function handleLeave() {
        if (!joined) return;
        socket.emit("message", { msg: `has left the game`, username });
        socket.emit("leave-room");
    }

    return (
        <div className="flex flex-row gap-5 bg-[#949494] h-screen justify-center">
            <div className="flex text-center flex-col w-[350px] h-[600px] mt-auto mb-auto">
                <div className="flex justify-center">
                    <h1 className="text-text text-4xl mb-2 bg-bg p-3 rounded">Players</h1>
                </div>
                <div className="flex-1 items-start justify-center flex-col bg-bg-light p-2 rounded-lg">
                    {roomInfo?.members?.map((member) =>
                        <p
                            className={`text-3xl ${member.id === roomInfo?.currentDrawerId ? `font-bold text-text-muted` : `text-text-muted`}`}
                            key={member.id}
                        >{member.username}</p>
                    )}
                </div>
            </div>

            <CanvasComponent
                socket={socket}
                joined={joined}
                roomId={roomId}
                setWordToGuess={setWordToGuess}
                wordToGuess={wordToGuess}
                roomInfo={roomInfo}
                isGuessed={isGuessed}
                canDraw={canDraw}
            />

            <div className="flex gap-2 flex-col justify-center">
                <div className="flex flex-row gap-2 justify-center">
                    <button
                        onClick={() => handleLeave()}
                        className="text-text bg-warning hover:bg-danger transition-all p-2 rounded cursor-pointer">Leave room</button>
                    <div className="text-text bg-bg p-2 rounded">
                        <p>Room ID: {roomInfo?.roomId}</p>
                    </div>
                    <div className="text-text bg-bg p-2 rounded">
                        <p>Members: {roomInfo?.members?.length}</p>
                    </div>
                </div>
                <ChatComponent
                    socket={socket}
                    joined={joined}
                    wordToGuess={wordToGuess}
                    setIsGuessed={setIsGuessed}
                    setCanDraw={setCanDraw}
                    roomInfo={roomInfo}
                />
            </div>
        </div>
    );
} 