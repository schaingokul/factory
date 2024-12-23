const Operator = require("../models/Operator.model");

// Get all quality records
exports.getAllQualities = async (req, res) => {
  try {
    const qualities = await Operator.find();
    res.status(200).json({
      message: "Operator records retrieved successfully",
      data: qualities,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error retrieving quality records",
        error: err.message,
      });
  }
};

// Get a single quality record by ID
exports.getQualityById = async (req, res) => {
  try {
    const quality = await Operator.findById(req.params.id);
    if (!quality) {
      return res.status(404).json({ message: "Operator record not found" });
    }
    res.status(200).json({
      message: "Operator record retrieved successfully",
      data: quality,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving quality record", error: err.message });
  }
};

// Create a new quality record
exports.createQuality = async (req, res) => {
  const { selectTime, selectDate, selectMold, selectMachine } = req.body;
  try {
    const newQuality = await Operator.create({
      selectTime,
      selectDate,
      selectMold,
      selectMachine,
    });
    res.status(201).json({
      message: "Operator record created successfully",
      data: newQuality,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating quality record", error: err.message });
  }
};

// Update a quality record
exports.updateQuality = async (req, res) => {
  const { selectTime, selectDate, selectMold, selectMachine } = req.body;
  try {
    const updatedQuality = await Operator.findByIdAndUpdate(
      req.params.id,
      { selectTime, selectDate, selectMold, selectMachine },
      { new: true } // Return the updated document
    );
    if (!updatedQuality) {
      return res.status(404).json({ message: "Operator record not found" });
    }
    res.status(200).json({
      message: "Operator record updated successfully",
      data: updatedQuality,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating quality record", error: err.message });
  }
};

// Delete a quality record
exports.deleteQuality = async (req, res) => {
  try {
    const deletedQuality = await Operator.findByIdAndDelete(req.params.id);
    if (!deletedQuality) {
      return res.status(404).json({ message: "Operator record not found" });
    }
    res.status(200).json({
      message: "Operator record deleted successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting quality record", error: err.message });
  }
};
