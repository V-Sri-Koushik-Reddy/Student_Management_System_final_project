// ============================================================
// Scholar — Student Management System
// script.js  |  All API calls, DOM manipulation, UI logic
// ============================================================

"use strict";

/* ── API Configuration ─────────────────────────────────────── */
const BASE_URL = "http://localhost:5001/students";

/* ── DOM References ────────────────────────────────────────── */
const inpName         = document.getElementById("inp-name");
const inpRoll         = document.getElementById("inp-roll");
const inpMarks        = document.getElementById("inp-marks");
const inpSearch       = document.getElementById("inp-search");
const inpMarksFilter  = document.getElementById("inp-marks-filter");
const btnSubmit       = document.getElementById("btn-submit");
const btnLabel        = document.getElementById("btn-label");
const btnCancel       = document.getElementById("btn-cancel");
const btnRefresh      = document.getElementById("btn-refresh");
const btnClearFilters = document.getElementById("btn-clear-filters");
const editIdInput     = document.getElementById("edit-id");
const formTitle       = document.getElementById("form-title");
const formBadge       = document.getElementById("form-badge");
const tbody           = document.getElementById("student-tbody");
const skeleton        = document.getElementById("skeleton");
const tableWrap       = document.getElementById("table-wrap");
const emptyState      = document.getElementById("empty-state");
const resultCount     = document.getElementById("result-count");
const activeFilters   = document.getElementById("active-filters");
const toastEl         = document.getElementById("toast");
const modalBackdrop   = document.getElementById("modal-backdrop");
const modalBody       = document.getElementById("modal-body");
const modalConfirm    = document.getElementById("modal-confirm");
const modalCancel     = document.getElementById("modal-cancel");

/* ── State ─────────────────────────────────────────────────── */
let deleteTargetId   = null;   // ID queued for deletion
let searchDebounce   = null;   // Timer for live search debounce
let activeSearchTerm = "";     // Current search query
let activeMarkFilter = "";     // Current marks-above filter

// ── Utility: Grade helpers ─────────────────────────────────── */

/**
 * Derive a letter grade from a numeric marks value.
 * @param {number} marks
 * @returns {{ letter: string, cls: string, colour: string }}
 */
function gradeInfo(marks) {
  if (marks >= 90) return { letter: "O",  cls: "grade-o", colour: "#f59e0b" };
  if (marks >= 75) return { letter: "A",  cls: "grade-a", colour: "#22c55e" };
  if (marks >= 60) return { letter: "B",  cls: "grade-b", colour: "#2dd4bf" };
  if (marks >= 45) return { letter: "C",  cls: "grade-c", colour: "#818cf8" };
  return              { letter: "F",  cls: "grade-f", colour: "#ef4444" };
}

/* ── Utility: Toast notifications ────────────────────────────── */
let toastTimer = null;

/**
 * Show a brief notification toast.
 * @param {string} message  Text to display
 * @param {"success"|"error"|"info"} type
 */
function showToast(message, type = "info") {
  toastEl.textContent = message;
  toastEl.className   = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3000);
}

/* ── Utility: Modal helpers ────────────────────────────────── */

/** Show the delete-confirmation modal for a student */
function openModal(id, name) {
  deleteTargetId  = id;
  modalBody.textContent = `"${name}" will be permanently removed from the system.`;
  modalBackdrop.style.display = "grid";
}

/** Hide the delete-confirmation modal */
function closeModal() {
  deleteTargetId = null;
  modalBackdrop.style.display = "none";
}

/* ── Utility: Loading & empty states ─────────────────────────── */

function showSkeleton() {
  skeleton.style.display  = "flex";
  tableWrap.style.display = "none";
  emptyState.style.display = "none";
}

function showTable() {
  skeleton.style.display   = "none";
  tableWrap.style.display  = "block";
  emptyState.style.display = "none";
}

function showEmpty() {
  skeleton.style.display   = "none";
  tableWrap.style.display  = "none";
  emptyState.style.display = "block";
}

/* ── Utility: Filter chips UI ─────────────────────────────── */

/** Re-render the "active filter" chips strip */
function renderFilterChips() {
  activeFilters.innerHTML = "";

  if (activeSearchTerm) {
    const chip = buildChip(`Name: "${activeSearchTerm}"`, () => {
      inpSearch.value  = "";
      activeSearchTerm = "";
      renderFilterChips();
      fetchStudents();
    });
    activeFilters.appendChild(chip);
  }

  if (activeMarkFilter !== "") {
    const chip = buildChip(`Marks > ${activeMarkFilter}`, () => {
      inpMarksFilter.value = "";
      activeMarkFilter     = "";
      renderFilterChips();
      fetchStudents();
    });
    activeFilters.appendChild(chip);
  }
}

function buildChip(label, onRemove) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.innerHTML = `${label} <span class="chip-remove" title="Remove">✕</span>`;
  chip.querySelector(".chip-remove").addEventListener("click", onRemove);
  return chip;
}

/* ── Stats bar helpers ─────────────────────────────────────── */

/** Update the four stat cards from the current student list */
function updateStats(students) {
  const total  = students.length;
  const avg    = total ? students.reduce((s, st) => s + st.marks, 0) / total : 0;
  const maxM   = total ? Math.max(...students.map(s => s.marks)) : 0;
  const passN  = students.filter(s => s.marks >= 35).length;
  const passR  = total ? Math.round((passN / total) * 100) : 0;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-avg").textContent   = avg.toFixed(1);
  document.getElementById("stat-top").textContent   = maxM;
  document.getElementById("stat-pass").textContent  = `${passR}%`;

  // Animate stat bars
  requestAnimationFrame(() => {
    document.getElementById("bar-avg").style.width  = `${avg}%`;
    document.getElementById("bar-pass").style.width = `${passR}%`;
  });
}

/* ── Build a single table row ──────────────────────────────── */

/**
 * Create a <tr> element for one student.
 * @param {object} student
 * @param {number} index  1-based display index
 */
function buildRow(student, index) {
  const tr = document.createElement("tr");
  const { id, name, rollNo, marks } = student;
  const { letter, cls, colour } = gradeInfo(marks);

  tr.innerHTML = `
    <td class="td-num">${index}</td>
    <td class="td-name">${escapeHtml(name)}</td>
    <td class="td-roll">${escapeHtml(rollNo)}</td>
    <td>
      <div class="marks-wrap">
        <span class="marks-val">${marks}</span>
        <div class="marks-bar-bg">
          <div class="marks-bar-fill" data-width="${marks}" style="width:0;background:${colour}"></div>
        </div>
      </div>
    </td>
    <td><span class="grade-badge ${cls}">${letter}</span></td>
    <td class="td-actions">
      <button class="btn btn-icon-edit" data-id="${id}">✎ Edit</button>
      <button class="btn btn-icon-del"  data-id="${id}" data-name="${escapeHtml(name)}">✕ Delete</button>
    </td>
  `;

  // Attach event listeners to action buttons
  tr.querySelector(".btn-icon-edit").addEventListener("click", () => startEdit(student));
  tr.querySelector(".btn-icon-del").addEventListener("click", () => openModal(id, name));

  return tr;
}

/** Naive HTML-escape to prevent XSS from API data */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Animate marks bars after rows are in DOM ─────────────── */
function animateMarksBars() {
  // Small delay so the row animation plays first
  setTimeout(() => {
    document.querySelectorAll(".marks-bar-fill[data-width]").forEach(bar => {
      bar.style.width = `${bar.dataset.width}%`;
    });
  }, 100);
}

/* ═══════════════════════════════════════════════════════════
   API FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/* ── GET — Fetch all (with optional filters) ──────────────── */

/**
 * Fetch students from the API and render them.
 * Reads the current activeSearchTerm / activeMarkFilter state.
 */
async function fetchStudents() {
  showSkeleton();

  // Build query string from active filters
  const params = new URLSearchParams();
  if (activeSearchTerm) params.append("search", activeSearchTerm);
  if (activeMarkFilter !== "") params.append("marksAbove", activeMarkFilter);

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  try {
    const res  = await fetch(url);

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const json = await res.json();
    const students = json.data ?? [];

    // Update stats (always use the full unfiltered list for stats accuracy)
    updateStats(students);

    // Render rows
    tbody.innerHTML = "";
    if (students.length === 0) {
      showEmpty();
      resultCount.textContent = "(0 results)";
    } else {
      students.forEach((s, i) => tbody.appendChild(buildRow(s, i + 1)));
      showTable();
      animateMarksBars();
      resultCount.textContent = `(${students.length} record${students.length !== 1 ? "s" : ""})`;
    }

  } catch (err) {
    showEmpty();
    showToast(`Could not reach the server. Is it running on port 5001?`, "error");
    console.error("fetchStudents error:", err);
  }
}

/* ── POST — Add a new student ─────────────────────────────── */

async function addStudent(name, rollNo, marks) {
  const res = await fetch(BASE_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, rollNo, marks }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to add student");
  return json;
}

/* ── PUT — Update an existing student ────────────────────── */

async function updateStudent(id, name, rollNo, marks) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, rollNo, marks }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update student");
  return json;
}

/* ── DELETE — Remove a student ───────────────────────────── */

async function deleteStudent(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete student");
  return json;
}

/* ═══════════════════════════════════════════════════════════
   FORM LOGIC — Add & Edit
   ═══════════════════════════════════════════════════════════ */

/** Reset form to "Add" mode */
function resetForm() {
  inpName.value      = "";
  inpRoll.value      = "";
  inpMarks.value     = "";
  editIdInput.value  = "";
  formTitle.textContent  = "Add Student";
  formBadge.textContent  = "NEW";
  btnLabel.textContent   = "Add Student";
  btnSubmit.querySelector(".btn-icon").textContent = "＋";
  btnCancel.style.display = "none";
  inpName.focus();
}

/**
 * Pre-fill the form for editing an existing student.
 * @param {object} student
 */
function startEdit(student) {
  editIdInput.value    = student.id;
  inpName.value        = student.name;
  inpRoll.value        = student.rollNo;
  inpMarks.value       = student.marks;
  formTitle.textContent  = "Edit Student";
  formBadge.textContent  = "EDIT";
  btnLabel.textContent   = "Save Changes";
  btnSubmit.querySelector(".btn-icon").textContent = "✓";
  btnCancel.style.display = "inline-flex";

  // Scroll form into view smoothly
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  inpName.focus();
}

/* ── Form submit handler ─────────────────────────────────── */
btnSubmit.addEventListener("click", async () => {
  const name  = inpName.value.trim();
  const rollNo = inpRoll.value.trim();
  const marks  = parseFloat(inpMarks.value);
  const editId = editIdInput.value;

  // ── Client-side validation
  if (!name) {
    showToast("Please enter a student name.", "error");
    inpName.focus();
    return;
  }
  if (!rollNo) {
    showToast("Please enter a roll number.", "error");
    inpRoll.focus();
    return;
  }
  if (isNaN(marks) || marks < 0 || marks > 100) {
    showToast("Marks must be a number between 0 and 100.", "error");
    inpMarks.focus();
    return;
  }

  // Disable button during request
  btnSubmit.disabled = true;
  btnSubmit.style.opacity = "0.7";

  try {
    if (editId) {
      // ── UPDATE existing student
      await updateStudent(Number(editId), name, rollNo, marks);
      showToast(`${name} updated successfully!`, "success");
    } else {
      // ── CREATE new student
      await addStudent(name, rollNo, marks);
      showToast(`${name} added successfully!`, "success");
    }

    resetForm();
    fetchStudents();   // Refresh table

  } catch (err) {
    showToast(err.message, "error");
    console.error("Form submit error:", err);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.style.opacity = "";
  }
});

/* ── Cancel edit ─────────────────────────────────────────── */
btnCancel.addEventListener("click", resetForm);

/* ── Refresh button ──────────────────────────────────────── */
btnRefresh.addEventListener("click", () => {
  btnRefresh.style.transform = "rotate(360deg)";
  btnRefresh.style.transition = "transform 0.5s ease";
  setTimeout(() => { btnRefresh.style.transform = ""; }, 600);
  fetchStudents();
});

/* ═══════════════════════════════════════════════════════════
   SEARCH & FILTER
   ═══════════════════════════════════════════════════════════ */

/* Live search — debounced by 350ms so we don't spam the API */
inpSearch.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    activeSearchTerm = inpSearch.value.trim();
    renderFilterChips();
    fetchStudents();
  }, 350);
});

/* Marks filter — trigger on Enter or after 400ms of no typing */
let marksDebounce = null;
inpMarksFilter.addEventListener("input", () => {
  clearTimeout(marksDebounce);
  marksDebounce = setTimeout(() => {
    const v = inpMarksFilter.value.trim();
    activeMarkFilter = v === "" ? "" : v;
    renderFilterChips();
    fetchStudents();
  }, 400);
});

inpMarksFilter.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(marksDebounce);
    const v = inpMarksFilter.value.trim();
    activeMarkFilter = v === "" ? "" : v;
    renderFilterChips();
    fetchStudents();
  }
});

/* Clear all filters */
btnClearFilters.addEventListener("click", () => {
  inpSearch.value      = "";
  inpMarksFilter.value = "";
  activeSearchTerm     = "";
  activeMarkFilter     = "";
  renderFilterChips();
  fetchStudents();
  showToast("Filters cleared", "info");
});

/* ═══════════════════════════════════════════════════════════
   DELETE MODAL
   ═══════════════════════════════════════════════════════════ */

modalCancel.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (e) => {
  // Close if clicking the dark backdrop (not the modal box itself)
  if (e.target === modalBackdrop) closeModal();
});

modalConfirm.addEventListener("click", async () => {
  if (!deleteTargetId) return;

  modalConfirm.disabled = true;
  modalConfirm.textContent = "Deleting…";

  try {
    const json = await deleteStudent(deleteTargetId);
    showToast(`Student deleted successfully.`, "success");
    closeModal();
    fetchStudents();
  } catch (err) {
    showToast(err.message, "error");
    console.error("Delete error:", err);
  } finally {
    modalConfirm.disabled = false;
    modalConfirm.textContent = "Delete";
  }
});

/* ── Keyboard: Escape closes modal ─────────────────────────── */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ── Allow pressing Enter in form inputs to submit ─────────── */
[inpName, inpRoll, inpMarks].forEach(inp => {
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnSubmit.click();
  });
});

/* ═══════════════════════════════════════════════════════════
   INIT — Load students on page ready
   ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  fetchStudents();
});


