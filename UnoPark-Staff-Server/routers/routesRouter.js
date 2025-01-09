import { Router } from "express";
import db from "../database/connection.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = Router();

router.post("/api/routes", isAdmin, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).send({ message: "Route name is required" });
    }

    const [result] = await db.execute("INSERT INTO routes (name) VALUES (?)", [
      name,
    ]);

    res.status(201).send({
      message: "Route created successfully",
      routeId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).send({ message: "Error creating route" });
  }
});

router.get("/api/routes", isAuthenticated, async (req, res) => {
  try {
    const [routes] = await db.execute("SELECT * FROM routes ORDER BY name ASC");
    res.status(200).send(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).send({ message: "Error fetching routes" });
  }
});

router.get("/api/routes/:id", isAuthenticated, async (req, res) => {
  try {
    const [routes] = await db.execute("SELECT * FROM routes WHERE id = ?", [
      req.params.id,
    ]);

    if (routes.length === 0) {
      return res.status(404).send({ message: "Route not found" });
    }

    res.status(200).send(routes[0]);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).send({ message: "Error fetching route" });
  }
});

router.put("/api/routes/:id", isAdmin, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).send({ message: "Route name is required" });
    }

    const [result] = await db.execute(
      "UPDATE routes SET name = ? WHERE id = ?",
      [name, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Route not found" });
    }

    res.status(200).send({ message: "Route updated successfully" });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).send({ message: "Error updating route" });
  }
});

router.delete("/api/routes/:id", isAdmin, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM routes WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Route not found" });
    }

    res.status(200).send({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).send({ message: "Error deleting route" });
  }
});

export default router;
