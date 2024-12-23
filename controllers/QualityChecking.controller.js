const Machine = require("../models/QualityChecking.model");

// Get all machines
exports.getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.find();
    res
      .status(200)
      .json({ message: "Machines retrieved successfully", machines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single machine by ID
exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    res
      .status(200)
      .json({ message: "Machine retrieved successfully", machine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new machine
exports.createMachine = async (req, res) => {
  const { machineName, quantity, avgWeight, moldName } = req.body;
  try {
    const newMachine = await Machine.create({
      machineName,
      quantity,
      avgWeight,
      moldName,
    });
    res
      .status(201)
      .json({ message: "Machine created successfully", newMachine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a machine
exports.updateMachine = async (req, res) => {
  const { machineName, quantity, avgWeight, moldName } = req.body;
  try {
    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      { machineName, quantity, avgWeight, moldName },
      { new: true }
    );
    if (!updatedMachine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    res
      .status(200)
      .json({ message: "Machine updated successfully", updatedMachine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a machine
exports.deleteMachine = async (req, res) => {
  try {
    const deletedMachine = await Machine.findByIdAndDelete(req.params.id);
    if (!deletedMachine) {
      return res.status(404).json({ message: "Machine not found" });
    }
    res.status(200).json({ message: "Machine deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
