import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { toast } from "react-toastify"
import { RoomInfo } from "../pages/CanvasPage";

type ChatComponentProps = {
    socket: Socket;
    joined: boolean;
    wordToGuess: string;
    setIsGuessed: React.Dispatch<React.SetStateAction<boolean>>;
    setCanDraw: React.Dispatch<React.SetStateAction<boolean>>;
    roomInfo: RoomInfo;
}

export function ChatComponent({ socket, joined, wordToGuess, setIsGuessed, setCanDraw, roomInfo }: ChatComponentProps) {
    const username = localStorage.getItem("username") || "Anonymous";
    const theme = localStorage.getItem("isLightTheme");

    const [data, setData] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [canType, setCanType] = useState<boolean>(socket.id === roomInfo?.currentDrawerId);

    useEffect(() => {
        function handleMessage({ msg, username }: { msg: string, username: string }) {
            setData((prevData) => [...prevData, `${username}: ${msg}`]);
        }

        function handleNextPlayer() {
            toast.success(`Next player drawing is`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: `${theme}`
            })
        }

        function handleRoomInfo({ currentDrawerId }: { currentDrawerId: string }) {
            // Update canDraw based on whether this user is the current drawer
            const isCurrentDrawer = socket.id === currentDrawerId;
            setCanDraw(isCurrentDrawer);
            setCanType(!isCurrentDrawer); 
        }

        socket.on("message", handleMessage);
        socket.on("next-player", handleNextPlayer);
        socket.on("room-info", handleRoomInfo);

        // Cleanup listeners on component unmount
        return () => {
            socket.off("message", handleMessage);
            socket.off("next-player", handleNextPlayer);
            socket.off("room-info", handleRoomInfo);
        };
    }, [socket, theme, setIsGuessed, setCanDraw]);

    function sendMessage() {
        if (!joined) return;

        if (input || username) {
            if (input.toLowerCase() === wordToGuess.toLowerCase()) {
                socket.emit("message", { msg: `has guessed the word`, username });
                setIsGuessed(true);
                setTimeout(() => {
                    socket.emit("next-player");
                    setIsGuessed(false);
                }, 2000)
            } else {
                socket.emit("message", { msg: input, username });
            }
            setInput("");
        }
    }

    function handleSend(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    return (
        <div className="flex flex-col text-text w-[400px] h-[500px] bg-bg-light p-2">
            <div className="flex flex-col justify-end flex-1 overflow-y-auto p-4">
                {data.map((message, index) => (
                    <p
                        key={index}
                        className="text-bg font-medium"
                    >{message}</p>
                ))}
            </div>

            <div
                className="bg-bg p-2 rounded-2xl overflow-x-clip relative">
                <textarea
                    disabled={!canType}
                    className="w-full pt-1 pr-15 rounded resize-none overflow-hidden text-text"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleSend}
                    placeholder={canType ? "Type your message" : "Cannot type while drawing"}
                />
                <button
                    className="absolute top-3 right-3 cursor-pointer"
                    type="submit">Submit</button>
            </div>
        </div>
    )
}