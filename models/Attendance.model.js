const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  operatorName: { type: String, required: true },
  operatorid: { type: String, required: true , unique: true},
  action: { type: Boolean, required: true }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = { Attendance };
