import { Router } from "express";
import db from "../database/connection.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = Router();

router.post("/api/feed", isAdmin, async (req, res) => {
  const { title, content } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO feed_posts (title, content, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [title, content, req.user.id]
    );

    res.status(201).send({
      message: "Post created successfully",
      postId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send({ message: "Error creating post" });
  }
});

router.get("/api/feed", async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT 
        fp.*,
        u.name as author_name 
      FROM feed_posts fp
      JOIN users u ON fp.created_by = u.id
      ORDER BY fp.created_at DESC
    `);

    res.status(200).send(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({ message: "Error fetching posts" });
  }
});

router.delete("/api/feed/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM feed_posts WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.status(200).send({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send({ message: "Error deleting post" });
  }
});

export default router;
