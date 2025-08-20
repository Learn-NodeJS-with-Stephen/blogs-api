import express from "express";
import usersController from "../controllers/usersController.js";
import { auth } from "../middleware/auth.js";
import blogsController from "../controllers/blogsController.js";

const router = express.Router();

router.post("/", auth, blogsController.createPost);
router.put("/:id", auth, blogsController.updatePost);
router.delete("/:id", auth, blogsController.deletePost);
router.get("/", blogsController.getAllPost);
router.get("/:id", auth, blogsController.getSinglePost);
router.get("/my/post", auth, blogsController.getMyPost);
router.get("/:id/similar", auth, blogsController.getSimilarPosts);
router.get("/pagination", blogsController.getAllPostWithPagination);

// Comment
router.get("/:post_id/comments", auth, blogsController.getCommentsForPost);
router.post("/posts/:post_id/comments", auth, blogsController.addComment);
router.put("/comments/:id", auth, blogsController.editComment);
router.delete("/comments/:id", auth, blogsController.deleteComment);

// Likess
router.post("/posts/:post_id/like", auth, blogsController.likePost);
router.delete("/posts/:post_id/like", auth, blogsController.unlikePost);
router.get("/posts/:post_id/like/:user_id", blogsController.hasUserLikedPost);
router.get("/posts/:post_id/likes", blogsController.getPostLikes);

export default router;
