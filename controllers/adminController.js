import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

class AdminController {
  async login(req, res) {
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
  }

  async getAllPosts(req, res) {
    const [posts] = await db.query(
      `SELECT bp.*, u.username, bc.name AS category FROM blog_posts bp JOIN users u ON u.id = bp.user_id JOIN blog_categories bc ON bc.id = bp.blog_category_id ORDER BY bp.created_at DESC`
    );
    res.json({ success: true, data: posts });
  }

  async restrictPost(req, res) {
    const { restriction_reason } = req.body;
    const blogId = req.params.id;
    // db.
    await db.query("UPDATE blog_posts SET is_restricted = TRUE WHERE id = ?", [
      blogId,
    ]);
    await db.query(
      "INSERT INTO blog_restrictions (blog_id, restriction_reason) VALUES (?, ?)",
      [blogId, restriction_reason]
    );
    res.json({ success: true, message: "Blog post restricted" });
  }

  // TODO: after finding the blog, It should look for the blog pos, if it doesn't find the post it should return with the error "blog post doesn't exist"
  // TODO: For restrist and delete post it should check if the post has already been restricted or deleted. 
  // TODO: All the code should be in a try-catch block (Error handling) 
  // TODO: When you are adding a new user or new category you first check if the name already exist in the DB 

  async deletePost(req, res) {
    const { deletion_reason } = req.body;
    const blogId = req.params.id;
    await db.query("UPDATE blog_posts SET is_deleted = TRUE WHERE id = ?", [
      blogId,
    ]);
    await db.query(
      "INSERT INTO blog_restrictions (blog_id, deletion_reason) VALUES (?, ?)",
      [blogId, deletion_reason]
    );
    res.json({ success: true, message: "Post deleted" });
  }

  async restrictUser(req, res) {
    const userId = req.params.id;
    await db.query("UPDATE users SET is_active = FALSE WHERE id = ?", [userId]);
    res.json({ success: true, message: "User restricted" });
  }

  async createCategory(req, res) {
  const { name } = req.body;

  try {
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
}



export default new AdminController();