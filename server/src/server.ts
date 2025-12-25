import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connectDB";
import { Server } from "socket.io";
import http from 'http';
import cookieParser from "cookie-parser";
import { setupSwagger } from "./config/swagger";
import { fetchRandomWord } from "./utils/fetchRandomWord";
import { RoomState } from "./types/RoomState";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import taskRoutes from './routes/taskRoutes';
import { time } from "console";

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
const rooms = new Map<string, RoomState>();
const TURN_TIME = 80 * 1000;

io.on('connection', (socket) => {

    function startRoomTimer(roomId: string) {
        console.log("Started room Timer");
        const room = rooms.get(roomId);
        if (!room) return;
        if (!room.turnEndsAt) {
            room.turnEndsAt = Date.now() + TURN_TIME;
        }
        if (!room) return;
        console.log("Log before Interval - Turn ends At:", room.turnEndsAt);
        setInterval(() => {
            const now = Date.now();

            if (room.turnEndsAt <= now) {
                socket.emit("next-player")
                room.turnEndsAt = now + TURN_TIME;
                console.log("turn ends at:", room.turnEndsAt);
                console.log("current time:", now);
            }
        }, 250)
    }

    socket.on("join-room", async (roomId: string, username: string) => {
        console.log(roomId);
        socket.data.username = username;
        const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        const MAX = process.env.MAX_ROOM_CAPACITY ? parseInt(process.env.MAX_ROOM_CAPACITY) : 3;

        if (count >= MAX) {
            socket.emit("room-full");
            return;
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit("room-joined", roomId);

        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                members: [],
                currentDrawerIndex: 0,
                turnEndsAt: Date.now() + TURN_TIME
            });
        }

        const room = rooms.get(roomId)!;
        room.members.push(socket.id);

        if (!roomWords.has(roomId) || count === 0) {
            const wordObj = await fetchRandomWord();
            const wordToGuess = wordObj?.word;
            if (wordToGuess) {
                roomWords.set(roomId, wordToGuess);
                console.log("New word created:", wordToGuess);
            }
        }
        startRoomTimer(roomId);
        const members = room.members.map(id => {
            const user = io.sockets.sockets.get(id);
            return {
                id,
                username: user?.data.username,
            }
        });
        const turnEndsAt = room.turnEndsAt;
        const currentDrawerId = room.members[room.currentDrawerIndex];
        io.to(roomId).emit("room-info", {
            roomId,
            members,
            currentDrawerId,
            turnEndsAt
        });
    });

    socket.on("next-player", async () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        // Randomly select the next drawer index
        room.currentDrawerIndex = Math.floor(Math.random() * room.members.length);

        const members = room.members.map(id => {
            const user = io.sockets.sockets.get(id);
            return {
                id,
                username: user?.data.username
            }
        });

        const wordObj = await fetchRandomWord();
        const wordToGuess = wordObj?.word;
        if (wordToGuess) {
            roomWords.set(roomId, wordToGuess);
            console.log("New word created:", wordToGuess);
        }

        io.to(roomId).emit("word-to-guess", wordToGuess);
        io.to(roomId).emit("erase-canvas");

        const turnEndsAt = room.turnEndsAt;
        const currentDrawerId = room.members[room.currentDrawerIndex];
        io.to(roomId).emit("room-info", {
            roomId,
            members,
            currentDrawerId,
            turnEndsAt
        });
    });

    socket.on("get-word", () => {
        const roomId = socket.data.roomId;
        if (!roomId) {
            socket.emit("word-to-guess", "");
            return;
        }
        const word = roomWords.get(roomId);
        console.log("Sending word to client:", word);
        socket.emit("word-to-guess", word || "");
    });

    socket.on("message", (data) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        io.to(roomId).emit("message", { msg: data.msg, username: data.username });
    });

    socket.on("get-room-info", () => {
        const roomId = socket.data.roomId;
        const room = rooms.get(roomId)
        if (!room) return;

        const members = room.members.map(id => {
            const user = io.sockets.sockets.get(id);
            return {
                id,
                username: user?.data.username
            }
        });

        const turnEndsAt = room.turnEndsAt
        const currentDrawerId = room.members[room.currentDrawerIndex];
        io.to(roomId).emit("room-info", {
            roomId,
            members,
            currentDrawerId,
            turnEndsAt
        })

    });

    socket.on("draw", (data) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        const currentDrawerId = room.members[room.currentDrawerIndex];

        if (socket.id !== currentDrawerId) {
            return;
        }

        io.to(roomId).emit("draw", data);
    });

    socket.on("erase-canvas", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        io.to(roomId).emit("erase-canvas");
    });

    socket.on("leave-room", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        socket.leave(roomId);
        socket.data.roomId = null;
        room.members = room.members.filter(id => id !== socket.id);

        if (room.currentDrawerIndex >= room.members.length) {
            room.currentDrawerIndex = 0;
        }
        const members = room.members.map(id => {
            const user = io.sockets.sockets.get(id);
            return {
                id,
                username: user?.data.username
            }
        });

        const currentDrawerId = room.members[room.currentDrawerIndex];
        io.to(roomId).emit("room-info", {
            roomId,
            members,
            currentDrawerId
        });

        socket.emit("left-room");
        io.to(roomId).emit("user-left", socket.id);
    });

    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        if (roomId) {
            io.to(roomId).emit("user-left", socket.id);
        }
    });
})

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})