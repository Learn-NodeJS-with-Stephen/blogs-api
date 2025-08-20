import { error } from "console";
import db from "../config/db.js";
import { auth } from "../middleware/auth.js";

class BlogsController {
  async createPost(req, res) {
    const { title, content, blog_category_id } = req.body;
    const user_id = req.user.id;

    if (!title || !content || !blog_category_id) {
      return res.status(400).json({
        success: false,
        message: "Title, content and category are required",
      });
    }

    try {
      const [result] = await db.query(
        "INSERT INTO blog_posts (title, content, blog_category_id, user_id) VALUES (?, ?, ?, ?)",
        [title, content, blog_category_id, user_id]
      );
      res.status(201).json({
        success: true,
        message: "Blog post created",
        postId: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updatePost(req, res) {
    const { title, content, blog_category_id } = req.body;

    try {
      const [existing] = await db.query(
        "SELECT * FROM blog_posts WHERE id = ? AND is_deleted = FALSE",
        [req.params.id]
      );

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      const [result] = await db.query(
        "UPDATE blog_posts SET title = ?, content = ?, blog_category_id = ? WHERE id = ? AND user_id = ?",
        [title, content, blog_category_id, req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized or post not found" });
      }

      res.json({ success: true, message: "Post updated successfully" });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deletePost(req, res) {
    try {
      const [existing] = await db.query(
        "SELECT * FROM blog_posts WHERE id = ? AND is_deleted = FALSE",
        [req.params.id]
      );
      if (existing.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }
      const [result] = await db.query(
        "UPDATE blog_posts SET is_deleted = TRUE WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to delete this post",
        });
      }

      res.json({ success: true, message: "Post deleted" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSinglePost(req, res) {
    try {
      const [post] = await db.query(
        `SELECT bp.id, title, content, bp.created_at, u.username, bc.name AS category 
        FROM blog_posts bp 
        JOIN users u ON u.id = bp.user_id 
        JOIN blog_categories bc ON bp.blog_category_id = bc.id 
        WHERE bp.id = ? AND bp.is_deleted = FALSE AND bp.is_restricted = FALSE`,
        [req.params.id]
      );

      if (post.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      res.json({ success: true, data: post[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMyPost(req, res) {
    try {
      const [posts] = await db.query(
        `SELECT bp.id, title, content, bp.created_at, bc.name AS category
          FROM blog_posts bp
          JOIN blog_categories bc ON bp.blog_category_id = bc.id
          WHERE bp.user_id = ? AND bp.is_deleted = FALSE
          ORDER BY bp.created_at DESC`,
        [req.user.id]
      );

      if (posts.length === 0) {
        return res
          .status(200)
          .json({ success: true, message: "No post has been created yet" });
      }

      res.json({ success: true, data: posts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAllPost(req, res) {
    try {
      const [posts] =
        await db.query(`SELECT bp.id, title, content, bp.created_at, u.username, bc.name AS category 
        FROM blog_posts bp
        JOIN users u ON u.id = bp.user_id
        JOIN blog_categories bc ON bp.blog_category_id = bc.id
        WHERE bp.is_deleted = FALSE AND bp.is_restricted = FALSE
        ORDER BY bp.created_at DESC`);

      res.json({ success: true, data: posts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Pagination and sorting for all posts
  async getAllPostWithPagination(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [posts] = await db.query(
      `SELECT bp.id, title, content, bp.created_at, u.username, bc.name AS category
       FROM blog_posts bp
       JOIN users u ON u.id = bp.user_id
       JOIN blog_categories bc ON bp.blog_category_id = bc.id
       WHERE bp.is_deleted = FALSE AND bp.is_restricted = FALSE
       ORDER BY bp.created_at DESC
       LIMIT ?, ?`,
      [offset, limit]
    );

    res.json({ success: true, data: posts });
  }

  async getSimilarPosts(req, res) {
    try {
      const postId = req.params.id;
      const [existing] = await db.query(
        "SELECT blog_category_id FROM blog_posts WHERE id = ? AND is_deleted = FALSE AND is_restricted = FALSE",
        [postId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const categoryId = existing[0].blog_category_id;
      const [similarPosts] = await db.query(
        `SELECT bp.id, title, content, bp.created_at, u.username, bc.name AS category
       FROM blog_posts bp
       JOIN users u ON u.id = bp.user_id
       JOIN blog_categories bc ON bp.blog_category_id = bc.id
       WHERE bp.blog_category_id = ? AND bp.id != ? AND bp.is_deleted = FALSE AND bp.is_restricted = FALSE
       ORDER BY bp.created_at DESC`,
        [categoryId, postId]
      );

      res.json({
        success: true,
        data: similarPosts,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Comment

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

  // Likes
  async likePost(req, res) {
    try {
      const postId = req.params.post_id;
      const userId = req.user.id;

      // Check if post exists
      const [post] = await db.query(
        "SELECT id FROM blog_posts WHERE id = ? AND is_deleted = FALSE AND is_restricted = FALSE",
        [postId]
      );
      if (post.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      // Prevent duplicate likes
      const [existing] = await db.query(
        "SELECT * FROM post_likes WHERE user_id = ? AND blog_post_id = ?",
        [userId, postId]
      );
      if (existing.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "You already liked this post" });
      }

      await db.query(
        "INSERT INTO post_likes (user_id, blog_post_id) VALUES (?, ?)",
        [userId, postId]
      );
      res.status(201).json({ success: true, message: "Post liked" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Unlike a post
  async unlikePost(req, res) {
    try {
      const postId = req.params.post_id;
      const userId = req.user.id;

      const [existing] = await db.query(
        "SELECT * FROM post_likes WHERE user_id = ? AND blog_post_id = ?",
        [userId, postId]
      );
      if (existing.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "You have not liked this post" });
      }

      await db.query(
        "DELETE FROM post_likes WHERE user_id = ? AND blog_post_id = ?",
        [userId, postId]
      );
      res.json({ success: true, message: "Post unliked" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Check if a user has liked a post
  async hasUserLikedPost(req, res) {
    try {
      const postId = req.params.post_id;
      const userId = req.params.user_id;

      const [existing] = await db.query(
        "SELECT * FROM post_likes WHERE user_id = ? AND blog_post_id = ?",
        [userId, postId]
      );
      res.json({ success: true, liked: existing.length > 0 });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Get total likes for a post
  async getPostLikes(req, res) {
    try {
      const postId = req.params.post_id;
      const [result] = await db.query(
        "SELECT COUNT(*) AS total_likes FROM post_likes WHERE blog_post_id = ?",
        [postId]
      );
      res.json({ success: true, total_likes: result[0].total_likes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new BlogsController();

// TODO:first check if the post exist if not return the error (It will be thesame for the update, getPost and deletePost) ✅
// TODO: Create an endpoint for a single post ✅
// TODO: Get my post (simplier to get all post but it will only get the post created by me or similer ID) ✅

// 30-July-2025
// TODO: Create an endpoint to get similer post
