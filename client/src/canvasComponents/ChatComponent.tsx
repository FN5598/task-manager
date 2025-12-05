import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type ChatComponentProps = {
    socket: Socket;
}

export function ChatComponent({ socket }: ChatComponentProps) {

    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected", socket.id);
        });

        socket.on("message", (msg: string) => {
            setMessages(prev => [...prev, msg]);
        });

        // Cleanup listeners on component unmount
        return () => {
            socket.off("connect");
            socket.off("message");
        };
    }, [socket]);

    function sendMessage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (input) {
            socket.emit("message", input);
            setInput("");
        }
    }
    return (
        <div className="flex flex-col text-text w-100 h-140 justify-end mt-auto mb-auto bg-bg p-2">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message, index) => (
                    <p key={index}>{message}</p>
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