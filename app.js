const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
// const qualityCheckingRouter = require("./routes/QualityChecking.route");
// const operatorRoute = require("./routes/Operator.route");
// const attendancesRoute = require("./routes/Attendance.route");
const router = require('./machineRoute');

const app = express();

// Enable CORS
app.use(cors({ origin: "*" }));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apis
app.use("/api", router);

// Routes
// app.use("/api/quality-checking", qualityCheckingRouter);
// app.use("/api/operator", operatorRoute);
// app.use("/api/attendance", attendancesRoute);

// Home Route
app.get("/", (req, res) => {
  res.send("Api working..");
});

module.exports = app;
