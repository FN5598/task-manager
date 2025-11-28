import User from "../models/userSchema";
import { Request, Response } from "express";

//@desc Get all existing users
//@route GET users/
//@access Private
const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "No users found",
                success: true
            });
        };

        return res.status(200).json({
            message: "Successfully fetched users",
            success: true,
            users: users
        })
    } catch (err) {
        console.log("Failed to get all users: ", err);
        res.status(500).json({
            message: "Server error",
            success: false
        })
    }
}

//@desc Get One user by ID
//@route GET users/:id
//@access Private
const getUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID is required",
            success: false
        })
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Successfully fetched user",
            success: true,
            user: user
        });
    } catch (err) {
        console.log(`Error fetching user ${id}`, err)
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

//@desc Delete User 
//@route DELETE users/:id
//@access Private
const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "User ID is required",
            success: false
        })
    }

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Successfully deleted user",
            success: true,
            user: deletedUser
        })
    } catch (err) {
        console.log("Failed to delete user", err);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

export {
    getAllUsers,
    getUser,
    deleteUser
}