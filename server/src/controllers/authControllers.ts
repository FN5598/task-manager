/// <reference path="../types/express.d.ts" />
import jwt from 'jsonwebtoken';
import User from "../models/userSchema";
import bcrypt from "bcryptjs";
import { Request, Response } from 'express';


export interface JwtPayload {
    userId: string;
    email: string,
    createdAt: string;
}

//@desc Create account
//@route POST /auth/sign-up
//@access Public
const createUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required to create new account" });
    if (!password) return res.status(400).json({ message: "Password is required to create new account" });

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists!",
                success: false
            })
        };

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            email,
            hashedPassword
        });

        return res.status(201).json({ message: "Successfully created a user", success: true })
    } catch (err) {
        console.log("Failed to create a user:", err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

//@desc Login into existing account
//@route POST /auth/login
//@access Public
const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required to Login into account" });
    if (!password) return res.status(400).json({ message: "Password is required to Login into account" });

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User doesn't exist!",
                success: false
            })
        };

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false
            })
        }

        const payload: JwtPayload = {
            userId: user._id.toString(),
            email: user.email,
            createdAt: (user.createdAt ?? new Date()).toISOString()
        }

        const { ACCESS_TOKEN, ACCESS_TOKEN_EXPIRE, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRE } = process.env;

        if (!ACCESS_TOKEN || !ACCESS_TOKEN_EXPIRE || !REFRESH_TOKEN || !REFRESH_TOKEN_EXPIRE) {
            return res.status(500).json({
                message: "Missing JWT env variables",
                success: false
            })
        };
        const accessToken = jwt.sign(payload, ACCESS_TOKEN, { expiresIn: Number(ACCESS_TOKEN_EXPIRE) });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN, { expiresIn: Number(REFRESH_TOKEN_EXPIRE) });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 15 // 15 min
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });

        res.status(200).json({
            message: "Successfully Logged In",
            success: true,
            user: {
                userId: user._id,
                userEmail: user.email
            }
        })
    } catch (err) {
        console.log("Failed to Login: ", err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

//@desc Delete user account
//@route DELETE /auth/delete
//@access Private
const deleteUser = async (req: Request, res: Response) => {
    const id = req.user?.userId;

    if (!id) {
        return res.status(400).json({
            message: "ID is required to delete account",
            success: false
        });
    }

    try {
        const userToDelete = await User.findById(id);

        if (!userToDelete) {
            return res.status(404).json({
                message: `No user exists under ID: ${id}`,
                success: false
            })
        }

        await userToDelete.deleteOne();
        res.status(200).json({
            message: `Successfully deleted user ${userToDelete.email}`,
            success: true
        })

    } catch (err) {
        console.log("Failed to delete account:", err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

//@desc Refresh Expired access token
//@route POST /auth/refresh
//@access Public
const refreshAccessToken = async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = req.cookies;

    if (accessToken) {
        return res.status(200).json({
            message: "Token exists. Token wasn't refreshed",
            success: true
        })
    }

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh Token expired!",
            success: false,
        })
    }

    try {
        const { REFRESH_TOKEN, ACCESS_TOKEN, ACCESS_TOKEN_EXPIRE } = process.env;
        if (!REFRESH_TOKEN || !ACCESS_TOKEN || !ACCESS_TOKEN_EXPIRE) {
            return res.status(500).json({
                message: "Missing JWT env variables",
                success: false
            })
        }

        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN) as JwtPayload;

        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                message: "Invalid refresh token",
                success: false
            })
        }
        const payload: JwtPayload = {
            userId: user._id.toString(),
            email: user.email,
            createdAt: (user.createdAt ?? new Date()).toISOString()
        }

        const newAccessToken = jwt.sign(payload, ACCESS_TOKEN, { expiresIn: Number(ACCESS_TOKEN_EXPIRE) });

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 15 // 15 min
        })

        res.status(200).json({
            message: "Successfully refreshed User Access Token",
            success: true
        })
    } catch (err) {
        console.log("Failed to refresh token", err);
        res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

//@desc Log out user
//@route POST /auth/logout
//@access Private
const logoutUser = async (req: Request, res: Response) => {
    const id = req.user?.userId;

    if (!id) {
        return res.status(400).json({
            message: "Id is required to logout",
            success: false
        })
    };

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }

        user.refreshToken = '';
        await user.save();

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({
            message: "Successfully logged out",
            success: true
        });
    } catch (err) {
        console.log("Failed to logout user", err);
        res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

export {
    createUser,
    loginUser,
    deleteUser,
    refreshAccessToken,
    logoutUser
}