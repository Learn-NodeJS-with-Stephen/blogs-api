import express from "express";
import usersController from "../controllers/usersController.js";

const router = express.Router();

router.post("/", usersController.createUser);
router.post("/login", usersController.loginUser);
router.get("/profile", usersController.getProfile);
router.put("/profile", usersController.updateProfile);

export default router;
