/// <reference path="../types/express.d.ts" />
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "../controllers/authControllers";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No access token provided",
                success: false
            })
        };

        const token = (authHeader.split(' ')[1])?.toString();

        if (!token) {
            return res.status(401).json({
                message: "No token",
                success: false
            });
        }

        if (!process.env.ACCESS_TOKEN) {
            return res.status(500).json({
                message: "No JWT env variable",
                success: false
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN) as unknown as JwtPayload;
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

export default verifyToken;