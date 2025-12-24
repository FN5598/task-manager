import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type ChatComponentProps = {
    socket: Socket;
    joined: boolean;
    wordToGuess: string;
    setIsGuessed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatComponent({ socket, joined, wordToGuess, setIsGuessed }: ChatComponentProps) {
    const username = localStorage.getItem("username") || "Anonymous";

    const [data, setData] = useState<string[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        function handleMessage({ msg, username }: { msg: string, username: string }) {
            setData((prevData) => [...prevData, `${username}: ${msg}`]);
        }

        socket.on("message", handleMessage);

        // Cleanup listeners on component unmount
        return () => {
            socket.off("connect");
            socket.off("message", handleMessage);
        };
    }, [socket, setData]);

    function sendMessage() {
        if (!joined) return;

        if (input || username) {
            if (input === wordToGuess) {
                socket.emit("message", { msg: `has guessed the word`, username });
                setIsGuessed(true);
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
        <div className="flex flex-col text-text w-[400px] h-[600px] mt-auto mb-auto bg-bg p-2">
            <div className="flex flex-col justify-end flex-1 overflow-y-auto p-4">
                {data.map((message, index) => (
                    <p
                        key={index}
                    >{message}</p>
                ))}
            </div>

            <div
                className="bg-bg-light p-2 rounded-2xl overflow-x-clip relative">
                <textarea
                    className="w-full pt-1 pr-15 rounded resize-none overflow-hidden"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleSend}
                    placeholder="Type your message"
                />
                <button
                    className="absolute top-3 right-3 cursor-pointer"
                    type="submit">Submit</button>
            </div>
        </div>
    )
}