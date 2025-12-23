import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connectDB";
import { Server } from "socket.io";
import http from 'http';
import cookieParser from "cookie-parser";
import { setupSwagger } from "./config/swagger";
import fetchRandomWord from "./utils/fetchWords";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import taskRoutes from './routes/taskRoutes';

const app = express();
dotenv.config();
connectDB();

(async () => {
    await setupSwagger(app);
})();

// Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use('/tasks', taskRoutes);


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const roomWords: Map<string, string> = new Map();

io.on('connection', (socket) => {
    console.log("Client connected", socket.id);

    socket.on("join-room", async (roomId: string, username: string) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        const count = room?.size || 0;
        const MAX = process.env.MAX_ROOM_CAPACITY ? parseInt(process.env.MAX_ROOM_CAPACITY) : 3;

        if (count >= MAX) {
            socket.emit("room-full");
            return;
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit("room-joined", roomId);
        io.to(roomId).emit("users-update", Array.from(io.sockets.adapter.rooms.get(roomId) || []));

        if (roomWords.has(roomId)) {
            socket.emit("word-to-guess", roomWords.get(roomId));
        }

        const [word] = await fetchRandomWord(1);
        if (word) roomWords.set(roomId, word);

        io.to(roomId).emit("word-to-guess", word);


        socket.on("message", (data) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            io.to(roomId).emit("message", {msg: data.msg, username: data.username});
        });

        socket.on("get-room-info", () => {
            const roomId = socket.data.roomId;
            if (!roomId) {
                socket.emit("room-info", { roomId: "", count: 0, members: [] });
                return;
            }
            const room = io.sockets.adapter.rooms.get(roomId);
            const count = room?.size || 0;
            socket.emit("room-info", {
                roomId,
                count,
                members: room ? Array.from(room) : []
            });
        })

        socket.on("draw", (data) => {
            io.to(roomId).emit("draw", data);
        })

        socket.on("erase-canvas", () => {
            io.to(roomId).emit("erase-canvas");
        })

        socket.on("leave-room", () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            socket.leave(roomId);
            socket.data.roomId = null;

            socket.emit("left-room");
            io.to(roomId).emit("user-left", socket.id);
        })

        socket.on("disconnect", () => {
            const roomId = socket.data.roomId;
            if (roomId) {
                io.to(roomId).emit("user-left", socket.id);
            }
        })
    })
})

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})