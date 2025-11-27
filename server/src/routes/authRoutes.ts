import express from "express"
import { loginUser, createUser, deleteUser, refreshAccessToken, logoutUser } from "../controllers/authControllers";
import verifyToken from "../middlewares/verifyToken"; 

const router = express.Router();

router.post("/login", loginUser);

router.post("/sign-up", createUser);

router.delete("/delete", verifyToken, deleteUser);

router.post("/refresh", refreshAccessToken);

router.post("/logout", verifyToken, logoutUser);

export default router;