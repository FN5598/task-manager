import { Schema, model, Document } from "mongoose";


interface IUser extends Document {
    email: string;
    hashedPassword: string;
    createdAt?: Date;
    updatedAt?: Date;
    refreshToken?: string
}


const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
})

export default model<IUser>("User", userSchema);