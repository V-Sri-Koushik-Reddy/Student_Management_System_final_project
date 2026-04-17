# 🎓 Student Management System — Backend API

A clean, beginner-friendly REST API built with **Node.js** and **Express**.  
No database needed — data is stored in-memory.

---

## 📁 Project Structure

```
student-management-backend/
├── server.js                  # Entry point — starts the Express server
├── package.json               # Dependencies & scripts
├── routes/
│   └── studentRoutes.js       # Route definitions (URL → controller mapping)
├── controllers/
│   └── studentController.js   # Request/response handling & business logic
└── models/
    └── studentModel.js        # In-memory data store & helper functions
```

---

## ⚙️ Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server

**Production mode:**
```bash
npm start
```

**Development mode (auto-restarts on file changes):**
```bash
npm run dev
```

The server runs on **http://localhost:5000**

---

## 📡 API Endpoints

### Base URL: `http://localhost:5000`

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/students`           | Get all students             |
| GET    | `/students?search=`   | Search students by name      |
| GET    | `/students?marksAbove=`| Filter by marks threshold   |
| POST   | `/students`           | Add a new student            |
| PUT    | `/students/:id`       | Update a student             |
| DELETE | `/students/:id`       | Delete a student             |

---

## 📋 Request & Response Examples

### GET `/students`
```json
{
  "success": true,
  "count": 5,
  "data": [
    { "id": 1, "name": "Alice Johnson", "rollNo": "CS101", "marks": 88 },
    ...
  ]
}
```

### GET `/students?search=alice&marksAbove=75`
Returns students whose name includes "alice" AND have marks > 75.

---

### POST `/students`
**Request body:**
```json
{
  "name": "John Doe",
  "rollNo": "CS106",
  "marks": 91
}
```
**Response:**
```json
{
  "success": true,
  "message": "Student added successfully",
  "data": { "id": 6, "name": "John Doe", "rollNo": "CS106", "marks": 91 }
}
```

---

### PUT `/students/1`
**Request body (any subset of fields):**
```json
{
  "marks": 95
}
```
**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": { "id": 1, "name": "Alice Johnson", "rollNo": "CS101", "marks": 95 }
}
```

---

### DELETE `/students/2`
**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": { "id": 2, "name": "Bob Smith", "rollNo": "CS102", "marks": 73 }
}
```

---

## 🔎 Extra Features

| Query Param      | Example                              | Behaviour                          |
|------------------|--------------------------------------|------------------------------------|
| `search`         | `/students?search=alice`             | Case-insensitive name search       |
| `marksAbove`     | `/students?marksAbove=80`            | Students with marks > 80           |
| combined         | `/students?search=a&marksAbove=70`   | Both filters applied together      |

---

## ❌ Error Responses

| Scenario            | Status | Message example                        |
|---------------------|--------|----------------------------------------|
| Missing fields      | 400    | "All fields are required: name, rollNo, marks" |
| Invalid marks value | 400    | "marks must be a number between 0 and 100"     |
| Student not found   | 404    | "Student with ID 99 not found"         |
| Invalid ID          | 400    | "ID must be a valid number"            |
| Unknown route       | 404    | "Route GET /foo not found"             |

---

## 🔌 Connecting to a Frontend

Set your frontend's API base URL to `http://localhost:5000`.

Example with `fetch`:
```javascript
// Get all students
const res  = await fetch("http://localhost:5000/students");
const data = await res.json();
console.log(data.data);   // array of student objects

// Add a student
await fetch("http://localhost:5000/students", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({ name: "Jane", rollNo: "CS110", marks: 88 }),
});
```
