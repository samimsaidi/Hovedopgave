import { Router } from "express";
import db from "../database/connection.js";
import { hash, compare } from "../util/passwordUtil.js";
import jwt from "jsonwebtoken";
import authRateLimiter from "../middlewares/authRateLimiter.js";
const router = Router();

router.post("/api/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, password, role, require_password_change FROM users WHERE email = ?",
      [email]
    );

    const user = users[0];

    if (user) {
      const match = await compare(password, user.password);
      if (match) {
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
          },
          process.env.JWT_SECRET
        );

        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 24 * (60 * 60 * 1000),
        });

        const requirePasswordChange = user.require_password_change === 1;

        res.status(200).send({
          message: "Logged in successfully",
          token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          requirePasswordChange: requirePasswordChange,
        });
      } else {
        res.status(404).send({ message: "Invalid login details" });
      }
    } else {
      res.status(404).send({ message: "Invalid login details" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal login error" });
  }
});

router.post("/api/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).send({ message: "Logged out successfully" });
});

export default router;
