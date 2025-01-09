import { Router } from "express";
import db from "../database/connection.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = Router();

router.post("/api/wifi-whitelist", isAdmin, async (req, res) => {
  const { name, ip_address } = req.body;

  try {
    if (!name || !ip_address) {
      return res
        .status(400)
        .send({ message: "Name and IP address are required" });
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip_address)) {
      return res.status(400).send({ message: "Ugyldig IP adresse format" });
    }

    const [result] = await db.execute(
      "INSERT INTO wifi_whitelist (name, ip_address, created_by) VALUES (?, ?, ?)",
      [name, ip_address, req.user.id]
    );

    res.status(201).send({
      message: "IP adresse tilføjet til whitelist",
      whitelistId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating whitelist entry:", error);
    res.status(500).send({ message: "Error creating whitelist entry" });
  }
});

router.get("/api/wifi-whitelist", isAuthenticated, async (req, res) => {
  try {
    const [entries] = await db.execute(`
      SELECT w.*, u.name as created_by_name 
      FROM wifi_whitelist w 
      LEFT JOIN users u ON w.created_by = u.id 
      ORDER BY w.name ASC
    `);
    res.status(200).send(entries);
  } catch (error) {
    console.error("Error fetching whitelist entries:", error);
    res.status(500).send({ message: "Error fetching whitelist entries" });
  }
});

router.put("/api/wifi-whitelist/:id", isAdmin, async (req, res) => {
  const { name, ip_address } = req.body;

  try {
    if (!name || !ip_address) {
      return res
        .status(400)
        .send({ message: "Name and IP address are required" });
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip_address)) {
      return res.status(400).send({ message: "Ugyldig IP adresse format" });
    }

    const [result] = await db.execute(
      "UPDATE wifi_whitelist SET name = ?, ip_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, ip_address, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Whitelist entry not found" });
    }

    res.status(200).send({ message: "Whitelist entry updated successfully" });
  } catch (error) {
    console.error("Error updating whitelist entry:", error);
    res.status(500).send({ message: "Error updating whitelist entry" });
  }
});

router.delete("/api/wifi-whitelist/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM wifi_whitelist WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Whitelist entry not found" });
    }

    res.status(200).send({ message: "Whitelist entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting whitelist entry:", error);
    res.status(500).send({ message: "Error deleting whitelist entry" });
  }
});

export default router;
