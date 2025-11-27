import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connectDB";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";

const app = express();
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})