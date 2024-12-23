const express = require("express");
const qualityCheckingRouter = express.Router();
const {
  getAllMachines,
  getMachineById,
  createMachine,
  deleteMachine,
  updateMachine,
} = require("../controllers/QualityChecking.controller");

qualityCheckingRouter.get("/", getAllMachines);
qualityCheckingRouter.get("/get/:id", getMachineById);
qualityCheckingRouter.post("/create", createMachine);
qualityCheckingRouter.put("/update/:id", updateMachine);
qualityCheckingRouter.delete("/delete/:id", deleteMachine);

module.exports = qualityCheckingRouter;
