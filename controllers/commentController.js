import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

class CommentsController {
  async getCommentsForPost(req, res) {
    try {
      const postId = req.params.post_id;
      const [comments] = await db.query(
        `SELECT pc.*, u.username 
         FROM post_comments pc 
         JOIN users u ON u.id = pc.user_id 
         WHERE pc.blog_post_id = ? 
         ORDER BY pc.created_at DESC`,
        [postId]
      );
      res.json({ success: true, data: comments });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async addComment(req, res) {
    try {
      const postId = req.params.post_id;
      const userId = req.user.id;
      const { comment } = req.body;

      // Validate comment length
      if (!comment || comment.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
        });
      }
      if (comment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot exceed 1000 characters",
        });
      }

      // Check if user already commented on this post
      const [existing] = await db.query(
        "SELECT * FROM post_comments WHERE user_id = ? AND blog_post_id = ?",
        [userId, postId]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already commented on this post",
        });
      }

      const [result] = await db.query(
        "INSERT INTO post_comments (user_id, blog_post_id, comment) VALUES (?, ?, ?)",
        [userId, postId, comment]
      );
      res.status(201).json({
        success: true,
        message: "Comment added",
        id: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async editComment(req, res) {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;
      const { comment } = req.body;

      // Validate comment length
      if (!comment || comment.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
        });
      }
      if (comment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot exceed 1000 characters",
        });
      }

      const [existing] = await db.query(
        "SELECT * FROM post_comments WHERE id = ? AND user_id = ?",
        [commentId, userId]
      );
      if (existing.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comment",
        });
      }

      await db.query(
        "UPDATE post_comments SET comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [comment, commentId]
      );
      res.json({ success: true, message: "Comment updated" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteComment(req, res) {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      const [existing] = await db.query(
        "SELECT * FROM post_comments WHERE id = ? AND user_id = ?",
        [commentId, userId]
      );
      if (existing.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own comment",
        });
      }

      await db.query("DELETE FROM post_comments WHERE id = ?", [commentId]);
      res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new CommentsController();
