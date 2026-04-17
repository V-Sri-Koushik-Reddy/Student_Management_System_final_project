// ============================================
// routes/studentRoutes.js
// Defines API endpoints and maps them to
// controller functions via Express Router
// ============================================

const express = require("express");
const router  = express.Router();

const {
  getStudents,
  createStudent,
  editStudent,
  removeStudent,
} = require("../controllers/studentController");

// ── Route Definitions ─────────────────────────────────────────────────────────

/**
 * GET  /students
 * Fetch all students.
 * Optional query params: ?search=alice  |  ?marksAbove=75  |  both combined
 */
router.get("/", getStudents);

/**
 * POST /students
 * Add a new student.
 * Body: { name, rollNo, marks }
 */
router.post("/", createStudent);

/**
 * PUT  /students/:id
 * Update an existing student by ID.
 * Body: { name?, rollNo?, marks? }  (at least one field required)
 */
router.put("/:id", editStudent);

/**
 * DELETE /students/:id
 * Remove a student by ID.
 */
router.delete("/:id", removeStudent);

module.exports = router;
