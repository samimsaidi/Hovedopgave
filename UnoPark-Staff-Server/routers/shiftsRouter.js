import { Router } from "express";
import db from "../database/connection.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  isAdmin,
  isAdminOrAccountant,
} from "../middlewares/adminMiddleware.js";
import { isWhitelistedIP } from "../middlewares/ipWhitelistMiddleware.js";

const router = Router();

router.post(
  "/api/shifts/start",
  isAuthenticated,
  isWhitelistedIP,
  async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        console.error("User not properly authenticated:", req.user);
        return res
          .status(401)
          .send({ message: "User not properly authenticated" });
      }

      const [rows] = await db.execute(
        "SELECT id FROM employees WHERE user_id = ?",
        [req.user.id]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).send({ message: "Employee not found" });
      }

      const employeeId = rows[0].id;

      const [activeShifts] = await db.execute(
        "SELECT id FROM shifts WHERE employee_id = ? AND status = 'ONGOING'",
        [employeeId]
      );

      if (activeShifts.length > 0) {
        return res
          .status(400)
          .send({ message: "Already have an active shift" });
      }

      const [result] = await db.execute(
        "INSERT INTO shifts (employee_id, start_time, status, location) VALUES (?, NOW(), 'ONGOING', ?)",
        [employeeId, req.locationName]
      );

      res.status(201).send({
        message: "Shift started successfully",
        shiftId: result.insertId,
        location: req.locationName,
      });
    } catch (error) {
      console.error("Error starting shift:", error);
      res.status(500).send({ message: "Error starting shift" });
    }
  }
);

router.post("/api/shifts/:id/end", isAuthenticated, async (req, res) => {
  const { notes } = req.body;

  try {
    if (!req.user || !req.user.id) {
      console.error("User not properly authenticated:", req.user);
      return res
        .status(401)
        .send({ message: "User not properly authenticated" });
    }

    const [rows] = await db.execute(
      "SELECT id FROM employees WHERE user_id = ?",
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const employeeId = rows[0].id;

    await db.beginTransaction();

    try {
      const [shiftRows] = await db.execute(
        "SELECT start_time FROM shifts WHERE id = ? AND employee_id = ? AND status = 'ONGOING'",
        [req.params.id, employeeId]
      );

      if (shiftRows.length === 0) {
        await db.rollback();
        return res.status(404).send({ message: "No active shift found" });
      }

      const [result] = await db.execute(
        `UPDATE shifts 
         SET end_time = NOW(), 
             status = 'COMPLETED',
             notes = ?
         WHERE id = ? AND employee_id = ? AND status = 'ONGOING'`,
        [notes || null, req.params.id, employeeId]
      );

      await db.execute(
        `INSERT INTO schedules 
         (employee_id, start_time, end_time, created_by, schedule_type)
         VALUES (?, ?, NOW(), ?, 'SHIFT')`,
        [employeeId, shiftRows[0].start_time, req.user.id]
      );

      await db.commit();
      res.status(200).send({ message: "Shift ended successfully" });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error ending shift:", error);
    res.status(500).send({ message: "Error ending shift" });
  }
});

router.get(
  "/api/employees/:employeeId/shifts",
  isAdminOrAccountant,
  async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
      let query = "SELECT * FROM shifts WHERE employee_id = ?";
      const params = [req.params.employeeId];

      if (startDate && endDate) {
        query += " AND start_time BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      query += " ORDER BY start_time DESC";

      const [shifts] = await db.execute(query, params);
      res.status(200).send(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).send({ message: "Error fetching shifts" });
    }
  }
);

router.get("/api/shifts/me", isAuthenticated, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const [rows] = await db.execute(
      "SELECT id FROM employees WHERE user_id = ?",
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const employeeId = rows[0].id;

    let query = "SELECT * FROM shifts WHERE employee_id = ?";
    const params = [employeeId];

    if (startDate && endDate) {
      query += " AND start_time BETWEEN ? AND ?";
      params.push(
        new Date(startDate).toISOString().slice(0, 19).replace("T", " "),
        new Date(endDate).toISOString().slice(0, 19).replace("T", " ")
      );
    }

    query += " ORDER BY start_time DESC";

    const [shifts] = await db.execute(query, params);
    res.status(200).send(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    res.status(500).send({ message: "Error fetching shifts" });
  }
});

export default router;
