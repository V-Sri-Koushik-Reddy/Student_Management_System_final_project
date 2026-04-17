// ============================================
// controllers/studentController.js
// Handles request/response logic for students
// ============================================

const {
  getAllStudents,
  findStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  searchByName,
  filterByMarks,
} = require("../models/studentModel");

// ── GET /students ─────────────────────────────────────────────────────────────
/**
 * Fetch all students.
 * Supports optional query params:
 *   ?search=<name>        → filter by name substring
 *   ?marksAbove=<number>  → filter students with marks > value
 * Both filters can be combined.
 */
const getStudents = (req, res) => {
  try {
    const { search, marksAbove } = req.query;
    let result = getAllStudents();

    // Apply name search filter if provided
    if (search && search.trim() !== "") {
      result = searchByName(search.trim());
    }

    // Apply marks filter if provided
    if (marksAbove !== undefined) {
      const threshold = parseFloat(marksAbove);
      if (isNaN(threshold)) {
        return res
          .status(400)
          .json({ success: false, message: "marksAbove must be a valid number" });
      }
      result = result.filter((s) => s.marks > threshold);
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── POST /students ────────────────────────────────────────────────────────────
/**
 * Add a new student.
 * Required body fields: name, rollNo, marks
 */
const createStudent = (req, res) => {
  try {
    const { name, rollNo, marks } = req.body;

    // Validate required fields
    if (!name || !rollNo || marks === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, rollNo, marks",
      });
    }

    // Validate name is a non-empty string
    if (typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "name must be a non-empty string" });
    }

    // Validate marks is a number between 0 and 100
    const parsedMarks = parseFloat(marks);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
      return res.status(400).json({
        success: false,
        message: "marks must be a number between 0 and 100",
      });
    }

    const newStudent = addStudent(name.trim(), rollNo.trim(), parsedMarks);

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: newStudent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── PUT /students/:id ─────────────────────────────────────────────────────────
/**
 * Update an existing student by ID.
 * Body can contain any subset of: name, rollNo, marks
 */
const editStudent = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate the ID param
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID must be a valid number" });
    }

    // Check student exists
    const existing = findStudentById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${id} not found`,
      });
    }

    const { name, rollNo, marks } = req.body;

    // Ensure at least one field to update is provided
    if (!name && !rollNo && marks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update: name, rollNo, marks",
      });
    }

    // Build the update object — only include provided fields
    const updates = {};
    if (name)             updates.name   = name.trim();
    if (rollNo)           updates.rollNo = rollNo.trim();
    if (marks !== undefined) {
      const parsedMarks = parseFloat(marks);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
        return res.status(400).json({
          success: false,
          message: "marks must be a number between 0 and 100",
        });
      }
      updates.marks = parsedMarks;
    }

    const updated = updateStudent(id, updates);

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── DELETE /students/:id ──────────────────────────────────────────────────────
/**
 * Delete a student by ID.
 */
const removeStudent = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate the ID param
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID must be a valid number" });
    }

    const deleted = deleteStudent(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getStudents, createStudent, editStudent, removeStudent };
