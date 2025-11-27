import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI not defined");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Successfully connected to DB")
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
} 

export default connectDB;