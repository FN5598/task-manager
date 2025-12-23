import { HeaderComponent } from "../components/HeaderComponent";
import { Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


type HomePageProps = {
    socket: Socket;
    setJoined: (value: boolean) => void;
    setRoomId: (value: string) => void;
    joinRoom: (roomId: string) => void;
}

export function HomePage({ socket, setJoined, setRoomId, joinRoom }: HomePageProps) {
    const theme = localStorage.getItem("isLightTheme");

    const navigate = useNavigate();
    const [username, setUsername] = useState<string>(localStorage.getItem("username") || "");

    useEffect(() => {
        socket.on("room-joined", (roomId: string) => {
            console.log("Joined room:", roomId);
            setRoomId(roomId);
            setJoined(true);
            navigate(`/canvas/${roomId}`)
        });

        socket.on("room-full", (roomId: string) => {
            console.log("Room is full:", roomId);
            setJoined(false);
            setRoomId("");
            navigate(`/`);
            toast.error("Room is full. Please try another room.", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: `${theme}`
            });
        });
        return () => {
            socket.off("room-joined");
            socket.off("room-full");
        }
    }, [socket, setJoined, setRoomId, theme, navigate]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        if (name === "username") {
            setUsername(value);
        }
    }

    function handleSubmit() {
        localStorage.setItem("username", username);
        socket.emit("set-username", username);
    }

    return (
        <div>
            <HeaderComponent />

            <div className="h-screen bg-bg text-text">

                <div>
                    <h1>{ }</h1>
                </div>
                <button
                    onClick={() => joinRoom("room 1")}
                    className="pl-40"
                >JOIN ROOM 1</button>
                <button
                    onClick={() => joinRoom("room 2")}
                    className="pl-20"
                >JOIN ROOM 2</button>

                <input
                    type="text"
                    className="border-2 border-gray-300 p-2 rounded-lg mt-4 ml-20"
                    placeholder="Enter username"
                    name="username"
                    onChange={handleChange}
                    value={username}
                ></input>
                <button
                    onClick={handleSubmit}
                    className="ml-4 p-2 bg-blue-500 text-white rounded-lg cursor-pointer"
                >Submit</button>

            </div>
        </div>
    );
}