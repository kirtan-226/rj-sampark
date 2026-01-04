require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const ahevaalRoutes = require("./routes/ahevaalRoutes");
const exportRoutes = require("./routes/exportRoutes");
const mandalRoutes = require("./routes/mandalRoutes");

const app = express();

// cors + logging + parsers
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const defaultOrigin = "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps / curl
      const allowed = frontendOrigins.length ? frontendOrigins : [defaultOrigin, "*"];
      if (allowed.includes("*") || allowed.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);
app.use((req, res, next) => {
  const allowed = frontendOrigins.length ? frontendOrigins : [defaultOrigin, "*"];
  const origin = allowed.includes("*") ? "*" : req.headers.origin || allowed[0];
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,x-user-id");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// connect DB once
connectDB();

// routes
app.get("/", (req, res) => res.send("Sampark API running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/ahevaals", ahevaalRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/mandals", mandalRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
