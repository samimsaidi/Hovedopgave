import db from "./connection.js";
import { hash } from "../util/passwordUtil.js";
import fs from "fs/promises";
import path from "path";

async function initializeDatabase() {
  try {
    const schemaSQL = await fs.readFile(
      path.resolve("database/database_creation.sql"),
      "utf8"
    );
    await db.query(schemaSQL);

    await db.query(
      "INSERT INTO users (name, email, password, role, require_password_change) VALUES (?, ?, ?, ?, ?)",
      ["John Doe", "johndoe@unopark.dk", await hash("test123"), "ADMIN", false]
    );

    await db.query(
      "INSERT INTO users (name, email, password, role, require_password_change) VALUES (?, ?, ?, ?, ?)",
      ["Jane Doe", "janedoe@unopark.dk", await hash("test123"), "USER", false]
    );

    await db.query(
      "INSERT INTO users (name, email, password, role, require_password_change) VALUES (?, ?, ?, ?, ?)",
      [
        "Bob Smith",
        "accountant@unopark.dk",
        await hash("test123"),
        "ACCOUNTANT",
        false,
      ]
    );

    await db.query(`
      INSERT INTO employees (user_id, name, position, salary_type, salary_rate, created_by)
      VALUES (2, 'Jane Doe', 'P-Vagt', 'HOURLY', 120.00, 1)
    `);

    await db.query(`
      INSERT INTO wifi_whitelist (name, ip_address, created_by)
      VALUES 
        ('UnoPark Kontor - Hvidovre', '91.100.160.57', 1)
    `);

    await db.query(`
      INSERT INTO shifts (employee_id, start_time, end_time, status, notes, location)
      VALUES 
        (1, '2024-12-03 09:00:00', '2024-12-03 17:00:00', 'COMPLETED', '', 'UnoPark Kontor'),
        (1, '2024-12-04 09:00:00', '2024-12-04 17:00:00', 'COMPLETED', '', 'Hvidovre Kontor')
    `);

    await db.query(`
      INSERT INTO routes (name)
      VALUES 
        ('Vestegnen - Hvidovre'),
        ('Vestegnen - Brøndby'),
        ('Storkøbenhavn - Nørrebro'),
        ('Storkøbenhavn - Frederiksberg')
    `);

    await db.query(`
      INSERT INTO schedules (employee_id, start_time, end_time, route_id, created_by, schedule_type)
      VALUES 
        (1, '2024-12-03 09:00:00', '2024-12-03 17:00:00', 1, 1, 'ADMIN'),
        (1, '2024-12-04 09:00:00', '2024-12-04 17:00:00', 2, 1, 'ADMIN'),
        (1, '2024-12-05 09:00:00', '2024-12-05 17:00:00', 3, 1, 'ADMIN')
    `);

    await db.query(`
      INSERT INTO feed_posts (title, content, created_by)
      VALUES (
        'Velkommen til Unopark',
        'Det er her den nye platform, hvor I kan få overblik over jeres vagter',
        1
      )
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await db.end();
  }
}

initializeDatabase();
