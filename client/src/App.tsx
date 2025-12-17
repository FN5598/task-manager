import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState } from 'react';
import { CanvasPage } from "./pages/CanvasPage";
import { io, Socket } from "socket.io-client";

// Initialize socket connection outside the component
const socket: Socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { autoConnect: false });

function App() {

  const [joined, setJoined] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("");

  function joinRoom(roomId: string) {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", roomId);
  }

  useEffect(() => {
    const isLightTheme = localStorage.getItem("isLightTheme");
    if (isLightTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);


  return (
    <>
      {/* Alert Pop Up */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        limit={1}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />


      {/* All Routes */}
      <Routes>
        <Route index element={<HomePage
          socket={socket}
          setJoined={setJoined}
          setRoomId={setRoomId}
          joinRoom={joinRoom} />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        <Route path="/canvas/:roomId" element={<CanvasPage
          socket={socket}
          joined={joined}
          setJoined={setJoined}
          roomId={roomId}
          setRoomId={setRoomId} />} />
      </Routes>
    </>
  );
}

export default App
