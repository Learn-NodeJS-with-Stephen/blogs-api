import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

class AdminController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const [admin] = await db.query(
        "SELECT * FROM users WHERE email = ? AND user_type = 'admin' LIMIT 1",
        [email]
      );

      if (
        admin.length === 0 ||
        !bcrypt.compareSync(password, admin[0].password)
      ) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { id: admin[0].id, user_type: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ success: true, token });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Delete User
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const [user] = await db.query("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      if (user.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "User does not exist" });

      await db.query("DELETE FROM users WHERE id = ?", [userId]);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAllPosts(req, res) {
    try {
      const [posts] = await db.query(
        `SELECT bp.*, u.username, bc.name AS category 
         FROM blog_posts bp 
         JOIN users u ON u.id = bp.user_id 
         JOIN blog_categories bc ON bc.id = bp.blog_category_id 
         ORDER BY bp.created_at DESC`
      );
      res.json({ success: true, data: posts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDashboard(req, res) {
    // Total post
    // Registered user
    // Active authors
    // Total Comments
    // Get all user

    try {
      const [total_users] = await db.query(
        `SELECT COUNT(*) AS total_users FROM users`
      );
      const [total_posts] = await db.query(
        `SELECT COUNT(*) AS total_posts FROM blog_posts`
      );
      const [total_comments] = await db.query(
        `SELECT COUNT(*) AS total_comments FROM post_comments`
      );
      const [active_authors] = await db.query(
        `SELECT COUNT(DISTINCT user_id) AS active_authors FROM blog_posts`
      );

      const [all_users] = await db.query(`SELECT * FROM users`);

      res.json({
        success: true,
        data: {
          total_users: total_users[0].total_users,
          total_posts: total_posts[0].total_posts,
          total_comments: total_comments[0].total_comments,
          active_authors: active_authors[0].active_authors,
          all_users: all_users,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async restrictPost(req, res) {
    try {
      const { restriction_reason } = req.body;
      const blogId = req.params.id;

      const [posts] = await db.query("SELECT * FROM blog_posts WHERE id = ?", [
        blogId,
      ]);
      if (posts.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Blog post doesn't exist" });

      if (posts[0].is_restricted)
        return res
          .status(400)
          .json({ success: false, message: "Post is already restricted" });

      await db.query(
        "UPDATE blog_posts SET is_restricted = TRUE WHERE id = ?",
        [blogId]
      );
      await db.query(
        "INSERT INTO blog_restrictions (blog_id, restriction_reason) VALUES (?, ?)",
        [blogId, restriction_reason]
      );
      res.json({ success: true, message: "Blog post restricted" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Get All restricted posts
  async getRestrictedPosts(req, res) {
    try {
      const [posts] = await db.query(
        "SELECT * FROM blog_posts WHERE is_restricted = TRUE"
      );
      res.json({ success: true, data: posts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deletePost(req, res) {
    try {
      const { deletion_reason } = req.body;
      const blogId = req.params.id;

      const [posts] = await db.query("SELECT * FROM blog_posts WHERE id = ?", [
        blogId,
      ]);
      if (posts.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Blog post doesn't exist" });

      if (posts[0].is_deleted)
        return res
          .status(400)
          .json({ success: false, message: "Post is already deleted" });

      await db.query("UPDATE blog_posts SET is_deleted = TRUE WHERE id = ?", [
        blogId,
      ]);
      await db.query(
        "INSERT INTO blog_restrictions (blog_id, deletion_reason) VALUES (?, ?)",
        [blogId, deletion_reason]
      );
      res.json({ success: true, message: "Post deleted" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // View User Profile
  async viewUserProfile(req, res) {
    try {
      const userId = req.params.id;

      // Get user info
      const [users] = await db.query(
        "SELECT id, username, email, user_type, is_active FROM users WHERE id = ?",
        [userId]
      );
      if (users.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "User does not exist" });

      // Get user's posts
      const [posts] = await db.query(
        "SELECT id, title, content, created_at, is_deleted, is_restricted FROM blog_posts WHERE user_id = ?",
        [userId]
      );

      // Attach posts to user object
      const user = { ...users[0], posts };

      res.json({ success: true, data: { user } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async restrictUser(req, res) {
    try {
      const userId = req.params.id;

      const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      if (users.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "User does not exist" });

      await db.query("UPDATE users SET is_active = FALSE WHERE id = ?", [
        userId,
      ]);
      res.json({ success: true, message: "User restricted" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Get restricted user
  async getRestrictedUsers(req, res) {
    try {
      const [users] = await db.query(
        "SELECT id, username, email, user_type FROM users WHERE is_active = FALSE"
      );
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCategory(req, res) {
    try {
      const { name } = req.body;

      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Category name is required" });

      const [exists] = await db.query(
        "SELECT * FROM blog_categories WHERE name = ?",
        [name]
      );
      if (exists.length > 0)
        return res
          .status(409)
          .json({ success: false, message: "Category already exists" });

      const [result] = await db.query(
        "INSERT INTO blog_categories (name, created_by) VALUES (?, ?)",
        [name, req.user.id]
      );

      res.status(201).json({
        success: true,
        message: "Category created",
        id: result.insertId,
      });
    } catch (err) {
      console.error("Create category error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Get list of categories
  async getCategories(req, res) {
    try {
      const [categories] = await db.query("SELECT * FROM blog_categories");
      res.json({ success: true, data: categories });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new AdminController();

// TODO: after finding the blog, It should look for the blog post, if it doesn't find the post it should return with the error "blog post doesn't exist"
// TODO: For restrist and delete post it should check if the post has already been restricted or deleted.
// TODO: All the code should be in a try-catch block (Error handling)
// TODO: When you are adding a new user or new category you first check if the name already exist in the DB
