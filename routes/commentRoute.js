import express from "express";
import commentsController from "../controllers/commentController.js";
import authMiddleware, { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/:post_id/comments", auth, commentsController.getCommentsForPost);
router.post("/posts/:post_id/comments", auth, commentsController.addComment);
router.put("/comments/:id", auth, commentsController.editComment);
router.delete("/comments/:id", auth, commentsController.deleteComment);

export default router;
