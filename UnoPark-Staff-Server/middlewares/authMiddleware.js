import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) return res.status(401).send({ message: "No token provided" });

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).send({ message: "Invalid or expired token" });
  }
};
