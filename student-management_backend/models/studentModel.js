// ============================================
// models/studentModel.js
// In-memory data store for students
// ============================================

// In-memory array to store student records
// Acts as our "database" for this project
let students = [
  { id: 1, name: "Alice Johnson", rollNo: "CS101", marks: 88 },
  { id: 2, name: "Bob Smith",     rollNo: "CS102", marks: 73 },
  { id: 3, name: "Carol White",   rollNo: "CS103", marks: 95 },
  { id: 4, name: "David Brown",   rollNo: "CS104", marks: 60 },
  { id: 5, name: "Eva Green",     rollNo: "CS105", marks: 82 },
];

// Auto-increment counter for generating unique IDs
let nextId = 6;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return the full students array */
const getAllStudents = () => students;

/** Find one student by numeric ID, or undefined if not found */
const findStudentById = (id) => students.find((s) => s.id === id);

/**
 * Add a new student.
 * @param {string} name
 * @param {string} rollNo
 * @param {number} marks
 * @returns {object} The newly created student record
 */
const addStudent = (name, rollNo, marks) => {
  const newStudent = { id: nextId++, name, rollNo, marks };
  students.push(newStudent);
  return newStudent;
};

/**
 * Update an existing student by ID.
 * Only the fields provided in `updates` are changed.
 * @returns {object|null} Updated student, or null if ID not found
 */
const updateStudent = (id, updates) => {
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;

  students[index] = { ...students[index], ...updates };
  return students[index];
};

/**
 * Delete a student by ID.
 * @returns {object|null} Deleted student, or null if ID not found
 */
const deleteStudent = (id) => {
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const [deleted] = students.splice(index, 1);
  return deleted;
};

/**
 * Search students whose name contains the query (case-insensitive).
 * @param {string} query
 * @returns {object[]}
 */
const searchByName = (query) =>
  students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

/**
 * Filter students whose marks are strictly greater than `minMarks`.
 * @param {number} minMarks
 * @returns {object[]}
 */
const filterByMarks = (minMarks) =>
  students.filter((s) => s.marks > minMarks);

// Export all model helpers
module.exports = {
  getAllStudents,
  findStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  searchByName,
  filterByMarks,
};
