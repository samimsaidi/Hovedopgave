import { Router } from "express";
import db from "../database/connection.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  isAdmin,
  isAdminOrAccountant,
} from "../middlewares/adminMiddleware.js";

const router = Router();

router.post("/api/schedules", isAdmin, async (req, res) => {
  const { employeeId, startTime, endTime } = req.body;

  try {
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).send({
        message: "End time must be after start time",
      });
    }

    const [employee] = await db.execute(
      "SELECT id FROM employees WHERE id = ?",
      [employeeId]
    );

    if (employee.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const [conflicts] = await db.execute(
      `SELECT id FROM schedules 
       WHERE employee_id = ? 
       AND ((start_time BETWEEN ? AND ?) 
       OR (end_time BETWEEN ? AND ?))`,
      [employeeId, startTime, endTime, startTime, endTime]
    );

    if (conflicts.length > 0) {
      return res.status(409).send({
        message: "Schedule conflicts with existing shifts",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO schedules 
       (employee_id, start_time, end_time, created_by) 
       VALUES (?, ?, ?, ?)`,
      [employeeId, startTime, endTime, req.user.id]
    );

    res.status(201).send({
      message: "Schedule created successfully",
      scheduleId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).send({ message: "Error creating schedule" });
  }
});

router.get("/api/schedules/me", isAuthenticated, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT e.id FROM employees e 
       WHERE e.user_id = ?`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const employeeId = rows[0].id;

    let query = `
      SELECT s.*, u.name as employee_name, e.position as employee_position,
             r.name as route_name 
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN routes r ON s.route_id = r.id
      WHERE s.employee_id = ?`;
    const params = [employeeId];

    if (
      startDate &&
      endDate &&
      startDate !== "undefined" &&
      endDate !== "undefined"
    ) {
      query += " AND s.start_time BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    query += " ORDER BY s.start_time ASC";

    const [schedules] = await db.execute(query, params);
    res.status(200).send(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).send({ message: "Error fetching schedules" });
  }
});

router.get(
  "/api/employees/:employeeId/schedules",
  isAdmin,
  async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
      let query = "SELECT * FROM schedules WHERE employee_id = ?";
      const params = [req.params.employeeId];

      if (startDate && endDate) {
        query += " AND start_time BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      query += " ORDER BY start_time ASC";

      const [schedules] = await db.execute(query, params);
      res.status(200).send(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).send({ message: "Error fetching schedules" });
    }
  }
);

router.put("/api/schedules/:id", isAdmin, async (req, res) => {
  const { startTime, endTime } = req.body;

  try {
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).send({
        message: "End time must be after start time",
      });
    }

    const [schedule] = await db.execute(
      "SELECT employee_id FROM schedules WHERE id = ?",
      [req.params.id]
    );

    if (schedule.length === 0) {
      return res.status(404).send({ message: "Schedule not found" });
    }

    const [conflicts] = await db.execute(
      `SELECT id FROM schedules 
       WHERE employee_id = ? 
       AND id != ?
       AND ((start_time BETWEEN ? AND ?) 
       OR (end_time BETWEEN ? AND ?))`,
      [
        schedule[0].employee_id,
        req.params.id,
        startTime,
        endTime,
        startTime,
        endTime,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(409).send({
        message: "Schedule conflicts with existing shifts",
      });
    }

    await db.execute(
      `UPDATE schedules 
       SET start_time = ?, 
           end_time = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [startTime, endTime, req.params.id]
    );

    res.status(200).send({ message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).send({ message: "Error updating schedule" });
  }
});

router.delete("/api/schedules/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM schedules WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Schedule not found" });
    }

    res.status(200).send({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).send({ message: "Error deleting schedule" });
  }
});

router.get(
  "/api/employees/:employeeId/schedules/stats",
  isAdminOrAccountant,
  async (req, res) => {
    const { start_date, end_date, onlyActiveShifts } = req.query;

    try {
      const [employeeDetails] = await db.execute(
        `SELECT e.*, u.name as employee_name 
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = ?`,
        [req.params.employeeId]
      );

      if (employeeDetails.length === 0) {
        return res.status(404).send({ message: "Employee not found" });
      }

      let query = `
        SELECT s.*, u.name as employee_name, e.position as employee_position,
               r.name as route_name 
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN routes r ON s.route_id = r.id
        WHERE s.employee_id = ?`;

      const params = [req.params.employeeId];

      if (start_date && end_date) {
        query += ` AND s.start_time BETWEEN ? AND ?`;
        params.push(start_date, end_date);
      }

      if (onlyActiveShifts === "true") {
        query += ` AND s.schedule_type = 'SHIFT'`;
      }

      query += ` ORDER BY s.start_time ASC`;

      const [schedules] = await db.execute(query, params);

      const now = new Date();
      let workedHours = 0;
      let scheduledHours = 0;
      let workedShifts = 0;
      let scheduledShifts = 0;
      let salary = 0;

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const monthsDiff =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) +
        1;

      schedules.forEach(schedule => {
        const startTime = new Date(schedule.start_time);
        const endTime = new Date(schedule.end_time);
        const duration = (endTime - startTime) / (1000 * 60 * 60);
        const roundedDuration = Math.round(duration * 2) / 2;

        scheduledHours += roundedDuration;
        scheduledShifts++;

        if (endTime < now) {
          workedHours += roundedDuration;
          workedShifts++;
        }
      });

      if (employeeDetails[0].salary_type === "HOURLY") {
        const hoursToUse =
          onlyActiveShifts === "true" ? workedHours : scheduledHours;
        salary = hoursToUse * employeeDetails[0].salary_rate;
      } else if (employeeDetails[0].salary_type === "FIXED") {
        salary = monthsDiff * employeeDetails[0].salary_rate;
      }

      res.status(200).send({
        schedules,
        stats: {
          workedHours: Math.round(workedHours * 10) / 10,
          scheduledHours: Math.round(scheduledHours * 10) / 10,
          workedShifts,
          scheduledShifts,
          salary: Math.round(salary * 100) / 100,
          salaryType: employeeDetails[0].salary_type,
          salaryRate: employeeDetails[0].salary_rate,
          activeShiftsOnly: onlyActiveShifts === "true",
        },
      });
    } catch (error) {
      console.error("Error fetching schedule stats:", error);
      res.status(500).send({ message: "Error fetching schedule statistics" });
    }
  }
);

router.post("/api/schedules/recurring", isAdmin, async (req, res) => {
  const { employeeId, startTime, endTime, recurrence, endDate } = req.body;

  try {
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).send({
        message: "End time must be after start time",
      });
    }

    const [employee] = await db.execute(
      "SELECT id FROM employees WHERE id = ?",
      [employeeId]
    );

    if (employee.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const schedules = [];
    let currentStart = new Date(startTime);
    let currentEnd = new Date(endTime);
    const recurringEndDate = new Date(endDate);

    if (recurrence !== "NONE" && currentStart > recurringEndDate) {
      return res.status(400).send({
        message: "End date must be after or equal to start time",
      });
    }

    if (recurrence === "NONE") {
      const [conflicts] = await db.execute(
        `SELECT id FROM schedules 
         WHERE employee_id = ? 
         AND ((start_time BETWEEN ? AND ?) 
         OR (end_time BETWEEN ? AND ?))`,
        [employeeId, currentStart, currentEnd, currentStart, currentEnd]
      );

      if (conflicts.length === 0) {
        const [result] = await db.execute(
          `INSERT INTO schedules 
           (employee_id, start_time, end_time, created_by, route_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [employeeId, currentStart, currentEnd, req.user.id, req.body.routeId]
        );
        schedules.push(result.insertId);
      }
    } else {
      while (currentStart <= recurringEndDate) {
        const [conflicts] = await db.execute(
          `SELECT id FROM schedules 
           WHERE employee_id = ? 
           AND ((start_time BETWEEN ? AND ?) 
           OR (end_time BETWEEN ? AND ?))`,
          [employeeId, currentStart, currentEnd, currentStart, currentEnd]
        );

        if (conflicts.length === 0) {
          const [result] = await db.execute(
            `INSERT INTO schedules 
             (employee_id, start_time, end_time, created_by, route_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              employeeId,
              currentStart,
              currentEnd,
              req.user.id,
              req.body.routeId,
            ]
          );
          schedules.push(result.insertId);
        }

        switch (recurrence) {
          case "DAILY":
            currentStart.setDate(currentStart.getDate() + 1);
            currentEnd.setDate(currentEnd.getDate() + 1);
            break;
          case "WEEKLY":
            currentStart.setDate(currentStart.getDate() + 7);
            currentEnd.setDate(currentEnd.getDate() + 7);
            break;
          case "MONTHLY":
            currentStart.setMonth(currentStart.getMonth() + 1);
            currentEnd.setMonth(currentEnd.getMonth() + 1);
            break;
          default:
            currentStart = new Date(recurringEndDate.getTime() + 1);
        }
      }
    }

    res.status(201).send({
      message: "Schedules created successfully",
      scheduleIds: schedules,
    });
  } catch (error) {
    res.status(500).send({ message: "Error creating recurring schedules" });
  }
});

router.get("/api/schedules/me/upcoming", isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.id FROM employees e 
       WHERE e.user_id = ?`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }

    const employeeId = rows[0].id;

    const [schedules] = await db.execute(
      `SELECT s.*, r.name as route_name 
       FROM schedules s
       LEFT JOIN routes r ON s.route_id = r.id
       WHERE s.employee_id = ? 
       AND s.start_time > NOW()
       ORDER BY s.start_time ASC
       LIMIT 3`,
      [employeeId]
    );

    res.status(200).send(schedules);
  } catch (error) {
    console.error("Error fetching upcoming schedules:", error);
    res.status(500).send({ message: "Error fetching upcoming schedules" });
  }
});

export default router;
