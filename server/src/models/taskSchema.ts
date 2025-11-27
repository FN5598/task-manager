import { Schema, model } from "mongoose";

const taskSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true
})

export default model("Task", taskSchema);