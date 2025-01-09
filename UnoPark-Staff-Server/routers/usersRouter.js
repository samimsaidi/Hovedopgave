import { Router } from "express";
import { hash } from "bcrypt";
import authRateLimiter from "../middlewares/authRateLimiter.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import db from "../database/connection.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { isAdminOrAccountant } from "../middlewares/adminMiddleware.js";

const router = Router();

const VALID_ROLES = ["USER", "ADMIN", "ACCOUNTANT"];

router.post("/api/users", isAdmin, authRateLimiter, async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).send({
        message: "Invalid role. Must be one of: USER, ADMIN, ACCOUNTANT",
      });
    }

    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).send({ message: "Email already exists" });
    }

    const hashedPassword = await hash(password, 10);
    await db.execute(
      "INSERT INTO users (name, email, password, role, require_password_change, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, true, new Date()]
    );

    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send({ message: "Error registering user" });
  }
});

router.get("/api/users", isAdminOrAccountant, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ message: "Error fetching users" });
  }
});

router.get("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send({ message: "Error fetching user" });
  }
});

router.put("/api/users/:id", isAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  const updates = [];
  const values = [];

  try {
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).send({
          message: "Invalid role. Must be one of: USER, ADMIN, ACCOUNTANT",
        });
      }
      updates.push("role = ?");
      values.push(role);
    }

    if (email) {
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, req.params.id]
      );
      if (existingUsers.length > 0) {
        return res.status(409).send({ message: "Email already exists" });
      }
    }

    if (updates.length > 0) {
      values.push(req.params.id);
      const [result] = await db.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "User not found" });
      }
    }

    res.status(200).send({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ message: "Error updating user" });
  }
});

router.delete("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({ message: "Error deleting user" });
  }
});

router.post("/api/users/change-password", isAuthenticated, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const hashedPassword = await hash(password, 10);
    await db.execute(
      "UPDATE users SET password = ?, require_password_change = ? WHERE id = ?",
      [hashedPassword, false, userId]
    );

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send({ message: "Error changing password" });
  }
});

export default router;
