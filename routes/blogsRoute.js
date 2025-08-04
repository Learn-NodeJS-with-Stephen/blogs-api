import express from "express";
import usersController from "../controllers/usersController.js";
import { auth } from "../middleware/auth.js";
import blogsController from "../controllers/blogsController.js";

const router = express.Router();

router.post("/", auth, blogsController.createPost);
router.put("/:id", auth, blogsController.updatePost);
router.delete("/:id", auth, blogsController.deletePost);
router.get("/", auth, blogsController.getAllPost);
router.get("/:id", auth, blogsController.getSinglePost);
router.get("/my/post", auth, blogsController.getMyPost);
router.get("/:id/similar", auth, blogsController.getSimilarPosts);

export default router;
