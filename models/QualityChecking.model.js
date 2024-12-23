const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema({
  machineName: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  avgWeight: {
    type: Number,
    required: true,
  },

  moldName: {
    type: String,
    required: true,
  },
});

const Machine = mongoose.model("Machine", machineSchema);
module.exports = Machine;
