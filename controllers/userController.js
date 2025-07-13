import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

class UsersController {
  async createUser(req, res) {
    // what's the need for the (req, res)??
    const { first_name, last_name, email, username, password } = req.body;
    if (!first_name || !last_name || !email || !username || !password) {
      return res.status(400).json({
        // read about status (400)
        success: false,
        message: "All fields are required",
      });
    }

    const [existingUser] = await db.query(
      // Why is the existing format in an array format?
      "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1",
      [email, username]
    );
    if (existingUser.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "User already exist" });
    }

    const hashedpassword = bcrypt.hashSync(password, 8);
    const [result] = await db.query(
      "INSERT INTO users (first_name, last_name, username, email, password, user_type) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name, last_name, username, email, hashedpassword, "user"]
    );
    res.status(201).json({
      success: true,
      message: "Account created sucessfully",
      userId: result.inserted,
    });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const [user] = await db.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (user.length === 0 || !bcrypt.compareSync(password, user[0].password)) {
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
  }

  async getProfile(req, res) {
    const [user] = await db.query(
      "SELECT id, first_name, last_name, username, email FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({
      success: true,
      data: user[0],
    });
  }

  async updateProfile(req, res) {
    const { first_name, last_name, username } = req.body;
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
  }
}

export default new UsersController();
