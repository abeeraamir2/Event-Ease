const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { id, role }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = authMiddleware;
