import express from "express";
import usersController from "../controllers/usersController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", usersController.createUser);
router.post("/login", usersController.loginUser);
router.get("/get", auth, usersController.getAllUsers);
router.get("/profile", auth, usersController.getProfile);
router.put("/profile", auth, usersController.updateProfile);

export default router;
