const Attendances = require("../models/Attendance.model");

// Get all attendances
exports.getAllAttendances = async (req, res) => {
  try {
    const attendances = await Attendances.find();
    res
      .status(200)
      .json({ message: "Attendances retrieved successfully", attendances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendances.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res
      .status(200)
      .json({ message: "Attendance retrieved successfully", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new attendance
exports.createAttendance = async (req, res) => {
  const { operatorName, operatorid, action } = req.body;
  try {
    const newAttendance = await Attendances.create({
      operatorName,
      operatorid,
      action,
    });
    res
      .status(201)
      .json({ message: "Attendance created successfully", newAttendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an attendance
exports.updateAttendance = async (req, res) => {
  const { operatorName, operatorid, action } = req.body;
  try {
    const updatedAttendance = await Attendances.findByIdAndUpdate(
      req.params.id,
      { operatorName, operatorid, action },
      { new: true }
    );
    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res
      .status(200)
      .json({ message: "Attendance updated successfully", updatedAttendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const deletedAttendance = await Attendances.findByIdAndDelete(
      req.params.id
    );
    if (!deletedAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
