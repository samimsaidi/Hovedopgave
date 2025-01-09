import db from "../database/connection.js";

export const isWhitelistedIP = async (req, res, next) => {
  try {
    const clientIP =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.connection.remoteAddress;

    const ipv4 = clientIP.replace(/^::ffff:/, "");

    if (process.env.NODE_ENV === "development") {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();

      const [entries] = await db.execute(
        "SELECT * FROM wifi_whitelist WHERE ip_address = ?",
        [data.ip]
      );

      if (entries.length === 0) {
        return res.status(403).json({
          message: "IP address is not whitelisted",
        });
      }

      req.locationName = entries[0].name;

      return next();
    }

    const [entries] = await db.execute(
      "SELECT * FROM wifi_whitelist WHERE ip_address = ?",
      [ipv4]
    );

    if (entries.length === 0) {
      return res.status(403).json({
        message: "IP address is not whitelisted",
      });
    }

    req.locationName = entries[0].name;

    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking IP whitelist" });
  }
};
