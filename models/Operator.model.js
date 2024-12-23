const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema({
  selectTime: {
    type: String,
    required: true,
  },
  selectDate: {
    type: Date,
    required: true,
  },
  selectMold: {
    type: String,
    required: true,
  },
  selectMachine: {
    type: String,
    required: true,
  },
});

const Operator = mongoose.model("Operator", operatorSchema);
module.exports = Operator;
