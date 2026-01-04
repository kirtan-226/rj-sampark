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
app.use(
  cors({
    // Frontend runs on Vite dev server by default; allow that origin. Use "*" if you truly need any origin.
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
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
