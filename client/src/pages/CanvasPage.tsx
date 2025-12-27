import type { Socket } from "socket.io-client";
import { CanvasComponent } from "../canvasComponents/CanvasComponent";
import { ChatComponent } from "../canvasComponents/ChatComponent";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import settingsIcon from "../assets/settings.png";

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
    turnEndsAt: number | "Loading ...";
}

export function CanvasPage({ socket, setJoined, joined, setRoomId, roomId }: CanvasPageProps) {
    const navigate = useNavigate();
    const [wordToGuess, setWordToGuess] = useState<string>('');
    const [isGuessed, setIsGuessed] = useState(false);
    const [canDraw, setCanDraw] = useState<boolean>(false)
    const [timeLeft, setTimeLeft] = useState<number | "Loading ...">("Loading ...");

    const theme = localStorage.getItem("isLightTheme");
    const username = localStorage.getItem("username");

    const [roomInfo, setRoomInfo] = useState<RoomInfo>({
        roomId: "Loading ...",
        turnEndsAt: "Loading ..."
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
        const handleRoomInfo = ({ roomId, members, currentDrawerId, turnEndsAt }: RoomInfo) => {
            console.log("Received room-info:", { roomId, members, currentDrawerId, turnEndsAt });
            setRoomInfo({ roomId, members, currentDrawerId, turnEndsAt });
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

        function handleNextPlayer() {
            const playerUsername = roomInfo.members?.find(member => member.id === roomInfo.currentDrawerId)?.username;

            socket.emit("message", { msg: "is the next player drawing", username: playerUsername });
        }

        socket.on("left-room", handleLeaveRoom);
        socket.on("room-info", handleRoomInfo);
        socket.on("next-player", handleNextPlayer);

        return () => {
            socket.off("room-info", handleRoomInfo);
            socket.off("left-room", handleLeaveRoom);
            socket.off("next-player", handleNextPlayer);
        }
    }, [joined, navigate, setJoined, setRoomId, socket, theme, roomInfo.currentDrawerId, roomInfo.members]);


    useEffect(() => {
        socket.emit("make-word");

        socket.emit("get-room-info");
    }, [socket]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const timeLeftMs = +roomInfo.turnEndsAt - now;

            // use fractional seconds
            const secondsLeft = Math.max(0, timeLeftMs / 1000);

            setTimeLeft(Math.floor(secondsLeft));

            if (secondsLeft <= 0) {
                setIsGuessed(false);
                socket.emit("get-room-info");
                socket.emit("next-player");
            }
        }, 250);

        return () => clearInterval(interval);
    }, [roomInfo.turnEndsAt, socket]);

    function handleLeave() {
        if (!joined) return;
        socket.emit("message", { msg: `has left the game`, username });
        socket.emit("leave-room");
    }

    return (
        <div className="flex flex-row gap-5 bg-bg-canvas h-screen justify-center">
            <div className="flex text-center flex-col w-[400px] mt-auto mb-auto">
                <div className="flex justify-center relative">
                    <div className="text-text bg-bg p-2 rounded mb-2">
                        <p>Room ID: {roomInfo?.roomId}</p>
                    </div>

                </div>
                <div className="items-start justify-center flex-col bg-bg-light p-2 rounded-lg h-[500px]">
                    <p className="text-text-muted text-4xl font-bold mb-4">Current Players:</p>
                    {roomInfo?.members?.map((member) =>
                        <>
                            <p
                                className={`text-3xl ${member.id === roomInfo?.currentDrawerId ? `font-bold text-text-muted` : `text-text-muted`}`}
                                key={member.id}
                            >{member.username}</p>
                        </>
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
                timeLeft={timeLeft}
            />

            <div className="flex gap-2 flex-col justify-center">
                <div className="flex flex-row gap-2 justify-center">
                    <button
                        onClick={() => handleLeave()}
                        className="text-text bg-warning hover:bg-danger transition-all p-2 rounded cursor-pointer">Leave room</button>
                    <div className="text-text bg-bg p-2 rounded">
                        <p>Members: {roomInfo?.members?.length}</p>
                    </div>
                    <div className="text-text bg-bg p-2 rounded cursor-pointer">
                        <img src={settingsIcon} />
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