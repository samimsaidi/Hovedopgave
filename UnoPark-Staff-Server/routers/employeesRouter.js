import { Router } from "express";
import db from "../database/connection.js";
import {
  isAdmin,
  isAdminOrAccountant,
} from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
const router = Router();

router.post("/api/employees", isAdmin, async (req, res) => {
  const { name, position, salaryType, salaryRate, email, userId } = req.body;

  try {
    if (!["HOURLY", "FIXED"].includes(salaryType)) {
      return res.status(400).send({ message: "Invalid salary type" });
    }

    const [result] = await db.query(
      `INSERT INTO employees (name, position, salary_type, salary_rate, user_id, created_at, updated_at, created_by) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [name, position, salaryType, salaryRate, userId || null, req.user.id]
    );

    res.status(201).send({
      message: "Employee created successfully",
      employeeId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).send({ message: "Error creating employee" });
  }
});

router.get("/api/employees", async (req, res) => {
  try {
    const [employees] = await db.query("SELECT * FROM employees");
    res.status(200).send(employees);
  } catch (error) {
    res.status(500).send({ message: "Error fetching employees" });
  }
});

router.get("/api/employees/:id", async (req, res) => {
  try {
    const [employees] = await db.execute(
      "SELECT * FROM employees WHERE id = ?",
      [req.params.id]
    );

    if (employees.length === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }
    res.status(200).send(employees[0]);
  } catch (error) {
    res.status(500).send({ message: "Error fetching employee" });
  }
});

router.put("/api/employees/:id", isAdmin, async (req, res) => {
  const { name, position, salaryType, salaryRate } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE employees 
       SET name = ?, position = ?, salary_type = ?, salary_rate = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, position, salaryType, salaryRate, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }
    res.status(200).send({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).send({ message: "Error updating employee" });
  }
});

router.delete("/api/employees/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM employees WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Employee not found" });
    }
    res.status(200).send({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting employee" });
  }
});

router.get("/api/employees/me/stats", isAuthenticated, async (req, res) => {
  const { start_date, end_date, onlyActiveShifts } = req.query;

  try {
    const [employeeDetails] = await db.execute(
      `SELECT e.*, u.name as employee_name 
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.user_id = ?`,
      [req.user.id]
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
      WHERE e.user_id = ?`;

    const params = [req.user.id];

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

    const startDate = new Date(start_date || new Date().setDate(1));
    const endDate = new Date(
      end_date || new Date(new Date().setMonth(new Date().getMonth() + 1, 0))
    );
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
    console.error("Error fetching employee stats:", error);
    res.status(500).send({ message: "Error fetching statistics" });
  }
});

router.get("/api/stats", isAdminOrAccountant, async (req, res) => {
  try {
    const [employeesCount] = await db.query(
      "SELECT COUNT(*) as count FROM employees"
    );

    const [todayShifts] = await db.query(
      `SELECT COUNT(*) as count FROM schedules 
       WHERE DATE(start_time) = CURDATE() 
       AND schedule_type = 'SHIFT'`
    );

    const [activeShifts] = await db.query(
      `SELECT COUNT(*) as count FROM shifts 
       WHERE status = 'ONGOING'`
    );

    const [todayHours] = await db.query(
      `SELECT SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as hours 
       FROM schedules 
       WHERE DATE(start_time) = CURDATE() 
       AND schedule_type = 'SHIFT'`
    );

    res.status(200).send({
      totalEmployees: employeesCount[0].count,
      todayShifts: todayShifts[0].count,
      activeShifts: activeShifts[0].count,
      todayScheduledHours: todayHours[0].hours || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).send({ message: "Error fetching statistics" });
  }
});

export default router;
