import express from "express"
import { getAllUsers, getUser, deleteUser } from "../controllers/userControllers";

const router = express.Router();

// router.use(verifyRoles) add middleware for role verification later

router.get("/", getAllUsers); 
router.get("/:id", getUser);

router.delete("/:id", deleteUser);

export default router;