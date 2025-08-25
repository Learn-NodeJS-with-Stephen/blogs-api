import express from "express";
import usersController from "../controllers/usersController.js";
import { auth } from "../middleware/auth.js";
import blogsController from "../controllers/blogsController.js";

const router = express.Router();

router.post("/", auth, blogsController.createPost);
router.put("/:id", auth, blogsController.updatePost);
router.delete("/:id", auth, blogsController.deletePost);
router.get("/pagination", blogsController.getAllPostWithPagination);
router.get("/", blogsController.getAllPost);
router.get("/:id", auth, blogsController.getSinglePost);
router.get("/my/post", auth, blogsController.getMyPost);
router.get("/:id/similar", auth, blogsController.getSimilarPosts);

// Comment
router.get("/:post_id/comments", blogsController.getCommentsForPost);
router.post("/:post_id/comment", auth, blogsController.addComment);
router.put("/comment/:id", auth, blogsController.editComment);
router.delete("/comment/:id", auth, blogsController.deleteComment);

// Likess
router.post("/:post_id/like", auth, blogsController.likePost);
router.delete("/:post_id/like", auth, blogsController.unlikePost);
router.get("/:post_id/like/:user_id", blogsController.hasUserLikedPost);
router.get("/:post_id/likes", blogsController.getPostLikes);

export default router;
