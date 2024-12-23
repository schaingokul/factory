const express = require("express");
const operatorRoute = express.Router();
const {
  createQuality,
  deleteQuality,
  getAllQualities,
  getQualityById,
  updateQuality,
} = require("../controllers/Operator.controller");

// Routes
operatorRoute.get("/get", getAllQualities);
operatorRoute.get("/get-one/:id", getQualityById);
operatorRoute.post("/create", createQuality);
operatorRoute.put("/update/:id", updateQuality);
operatorRoute.delete("/delete/:id", deleteQuality);

module.exports = operatorRoute;
