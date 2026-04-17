// ============================================
// server.js
// Entry point — sets up Express app and starts
// the HTTP server on port 5000
// ============================================

const express        = require("express");
const cors           = require("cors");
const studentRoutes  = require("./routes/studentRoutes");

// ── App Initialisation ────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ─────────────────────────────────────────────────────────

// Allow cross-origin requests (so any frontend on a different port can call us)
app.use(cors());

// Parse incoming JSON request bodies automatically
app.use(express.json());

// ── Health-check Route ────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎓 Student Management System API is running!",
    endpoints: {
      "GET    /students":                 "Fetch all students",
      "GET    /students?search=name":     "Search students by name",
      "GET    /students?marksAbove=75":   "Filter students with marks > 75",
      "POST   /students":                 "Add a new student",
      "PUT    /students/:id":             "Update a student",
      "DELETE /students/:id":             "Delete a student",
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// All student-related routes live under /students
app.use("/students", studentRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a defined route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches any error thrown inside route/middleware handlers
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Server is running on http://localhost:${PORT}`);
  console.log(`📋  API root        → http://localhost:${PORT}/`);
  console.log(`👨‍🎓  Students API    → http://localhost:${PORT}/students\n`);
});
