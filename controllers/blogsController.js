import db from "../config/db.js";

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
      const [result] = await db.query(
        "UPDATE blog_posts SET title = ?, content = ?, blog_category_id = ? WHERE id = ? AND user_id = ?",
        [title, content, blog_category_id, req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res
          .status(403)
          .json({ success: false, message: "Blog not found or unauthorized" });
      }

      res.json({ success: true, message: "Post updated successfully" });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // TODO: first check if the post exist if not return the error (It will be thesame for the update, getPost and deletePost)
  // TODO: Create an endpoint for a single post
  // TODO: Get my post (simplier to get all post but it will only get the post created by me or similer ID  )

  async deletePost(req, res) {
    const [result] = await db.query(
      "UPDATE blog_posts SET is_deleted = TRUE WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res
        .status(403)
        .json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post deleted" });
  }

  async getAllPosts(req, res) {
    const [posts] =
      await db.query(`SELECT bp.id, title, content, bp.created_at, u.username, bc.name AS category 
    FROM blog_posts bp
    JOIN users u ON u.id = bp.user_id
    JOIN blog_categories bc ON bp.blog_category_id = bc.id
    WHERE bp.is_deleted = FALSE AND bp.is_restricted = FALSE
    ORDER BY bp.created_at DESC`);

    res.json({ success: true, data: posts });
  }
}

export default new BlogsController();
