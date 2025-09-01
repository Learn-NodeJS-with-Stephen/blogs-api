import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

class UsersController {
  async createUser(req, res) {
    try {
      const { first_name, last_name, email, username, user_type, password } =
        req.body;
      if (!first_name || !last_name || !email || !username || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const [existingUser] = await db.query(
        "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1",
        [email, username]
      );
      if (existingUser.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "User already exists" });
      }

      const hashedpassword = bcrypt.hashSync(password, 8);
      const [result] = await db.query(
        "INSERT INTO users (first_name, last_name, username, email, user_type, password) VALUES (?, ?, ?, ?, ?, ?)",
        [
          first_name,
          last_name,
          username,
          email,
          user_type || "user",
          hashedpassword,
        ]
      );

      const token = jwt.sign(
        { id: result.insertId, user_type: user_type || "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        userId: result.insertId,
        token,
        user: {
          id: result.insertId,
          first_name,
          last_name,
          username,
          email,
          user_type: user_type || "user",
        },
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const [user] = await db.query(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (
        user.length === 0 ||
        !bcrypt.compareSync(password, user[0].password)
      ) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid login details" });
      }

      const token = jwt.sign(
        { id: user[0].id, user_type: user[0].user_type },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ success: true, message: "Login successful", token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Get all users with pagination and search
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";

      // Get total count for pagination
      const [countResult] = await db.query(
        `SELECT COUNT(*) AS total FROM users WHERE username LIKE ? OR email LIKE ?`,
        [`%${search}%`, `%${search}%`]
      );
      const total = countResult[0].total;

      // Get paginated users
      const [users] = await db.query(
        `SELECT id, first_name, last_name, username, email, user_type, is_active
         FROM users
         WHERE username LIKE ? OR email LIKE ?
         ORDER BY id DESC
         LIMIT ?, ?`,
        [`%${search}%`, `%${search}%`, offset, limit]
      );

      res.json({
        success: true,
        data: users,
        meta: {
          page,
          limit,
          total,
          count: users.length,
          hasNext: offset + users.length < total,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getProfile(req, res) {
    try {
      const [user] = await db.query(
        "SELECT id, first_name, last_name, username, email FROM users WHERE id = ?",
        [req.user.id]
      );

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      res.json({
        success: true,
        data: user[0],
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async updateProfile(req, res) {
    try {
      const { first_name, last_name, username } = req.body;

      const [user] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.user.id,
      ]);

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      await db.query(
        "UPDATE users SET first_name=?, last_name=?, username=? WHERE id=?",
        [first_name, last_name, username, req.user.id]
      );

      const [updatedUser] = await db.query(
        "SELECT id, first_name, last_name, username, email FROM users WHERE id=?",
        [req.user.id]
      );

      res.json({
        success: true,
        message: "Profile has been updated",
        data: updatedUser[0],
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Get all authors and the total number of posts they created
  async getAuthorsWithPostCount(req, res) {
    try {
      const [authors] = await db.query(
        `SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.first_name, 
            u.last_name, 
            u.user_type, 
            u.is_active,
            COUNT(bp.id) AS total_posts
         FROM users u
         JOIN blog_posts bp ON bp.user_id = u.id
         WHERE bp.is_deleted = FALSE AND bp.is_restricted = FALSE
         GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.user_type, u.is_active
         ORDER BY total_posts DESC`
      );

      res.json({
        success: true,
        data: authors,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new UsersController();
