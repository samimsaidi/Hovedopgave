import db from "../database/connection.js";
import jwt from "jsonwebtoken";

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).send({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
        decoded.id,
      ]);
      const user = users[0];

      if (!user || user.role !== "ADMIN") {
        return res.status(403).send({ message: "Admin access required" });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      throw jwtError;
    }
  } catch (error) {
    res.status(401).send({ message: "Invalid token" });
  }
};

export const isAdminOrAccountant = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).send({ message: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
        decoded.id,
      ]);
      const user = users[0];

      if (!user || (user.role !== "ADMIN" && user.role !== "ACCOUNTANT")) {
        return res
          .status(403)
          .send({ message: "Admin or accountant access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).send({ message: "Invalid token" });
    }
  } catch (error) {
    res.status(401).send({ message: "Invalid token" });
  }
};
