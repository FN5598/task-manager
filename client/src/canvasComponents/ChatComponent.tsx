import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type ChatComponentProps = {
    socket: Socket;
    joined: boolean;
}

export function ChatComponent({ socket, joined }: ChatComponentProps) {
    const username = localStorage.getItem("username") || "Anonymous";

    const [data, setData] = useState<string[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        socket.on("message", ({msg, username}) => {
            console.log("Received message:", msg, username);
            setData((prevData) => [...prevData, `${username}: ${msg}`]);
        });

        // Cleanup listeners on component unmount
        return () => {
            socket.off("connect");
            socket.off("message");
        };
    }, [socket]);

    function sendMessage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        console.log("Sending message:", input, joined);
        if (!joined) return;

        if (input || username) {
            socket.emit("message", {msg: input, username});
            setInput("");
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

            <form
                className="bg-bg-light p-2 rounded-2xl overflow-x-clip relative"
                onSubmit={sendMessage}>
                <textarea
                    className="w-full pt-1 pr-15 rounded resize-none overflow-hidden"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message"
                />
                <button
                    className="absolute top-3 right-3 cursor-pointer"
                    type="submit">Submit</button>
            </form>
        </div>
    )
}