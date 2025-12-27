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
import { Socket } from "socket.io";

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
const rooms = new Map<string, RoomState>();
const TURN_TIME = 80 * 1000;

io.on('connection', (socket) => {
    console.log("New socket connected:", socket.id)


    function startRoomTimer(roomId: string) {
        console.log("Started room Timer");
        const room = rooms.get(roomId);
        if (!room) return;
        if (!room.turnEndsAt) {
            room.turnEndsAt = Date.now() + TURN_TIME;
        }
        if (!room) return;
        room.interval = setInterval(() => {
            const now = Date.now();

            if (room.turnEndsAt! <= now) {
                socket.emit("next-player")
                room.turnEndsAt = now + TURN_TIME;
            }
        }, 250)
    };

    function createRoom(): RoomState {
        const roomId = crypto.randomUUID();

        const room: RoomState = {
            roomId: roomId,
            members: [],
            currentDrawerIndex: 0,
            turnEndsAt: null,
            maxPlayers: 3
        };

        rooms.set(roomId, room);
        return room;
    }


    function findAvailableRoom(): RoomState | null {
        for (const room of rooms.values()) {
            if (room.members.length < room.maxPlayers) {
                return room;
            }
        }
        return null;
    }

    async function joinRoom(roomId: string, socket: Socket, username: string) {
        console.log("Join room Func called");

        socket.join(roomId);

        socket.data.username = username;
        socket.data.roomId = roomId;

        const room = rooms.get(roomId);
        if (!room) return;

        room.members.push(socket.id);
        socket.emit("room-joined", roomId);

        startRoomTimer(roomId);

        if (!roomWords.has(roomId)) {
            const wordObj = await fetchRandomWord();
            if (wordObj?.word) {
                roomWords.set(roomId, wordObj.word);
                console.log("New word craeted:", wordObj.word);
            }
        }

        const members = room.members.map(id => {
            const user = io.sockets.sockets.get(id);
            return {
                id,
                username: user?.data.username
            };
        });

        const currentDrawerId = room.members[room.currentDrawerIndex];

        io.to(roomId).emit("room-info", {
            roomId,
            members,
            currentDrawerId,
            turnEndsAt: room.turnEndsAt
        })
    }

    socket.on("find-room", async ({ username }: { username: string }) => {
        let room = findAvailableRoom();
        console.log("Found availible rooms:", room);

        if (!room) {
            room = createRoom();
            console.log("Created room:", room);
        }

        await joinRoom(room.roomId, socket, username);
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

        if (room.members.length === 0) {
            clearInterval(room.interval);
            rooms.delete(room.roomId);
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