import { HeaderComponent } from "../components/HeaderComponent";
import { Socket } from "socket.io-client";
import { useEffect } from "react";
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

        socket.on("get-room-info", ({ count, roomId }) => {
            console.log(`Room ${roomId} has total ${count} participants`)
        })
    }, [socket, setJoined, setRoomId, theme, navigate]);


    function getRoomInfo(roomId: string) {
        socket.emit("get-room-info", roomId);
    }

    getRoomInfo("room 1");

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

            </div>
        </div>
    );
}