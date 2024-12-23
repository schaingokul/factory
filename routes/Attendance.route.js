const express = require("express");
const attendanceRoute = express.Router();
const {
  createAttendance,
  deleteAttendance,
  getAttendanceById,
  updateAttendance,
  getAllAttendances,
} = require("../controllers/Attendance.controller");

// Routes
attendanceRoute.get("/get", getAllAttendances);
attendanceRoute.get("/get-one/:id", getAttendanceById);
attendanceRoute.post("/create", createAttendance);
attendanceRoute.put("/update/:id", updateAttendance);
attendanceRoute.delete("/delete/:id", deleteAttendance);

module.exports = attendanceRoute;
