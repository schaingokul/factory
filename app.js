const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
const router = require('./routes/machineRoute');

const app = express();

// Enable CORS
app.use(cors({ origin: "*" }));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apis
app.use("/api", router);

// Home Route
app.get("/", (req, res) => {
  res.send("Api working..");
});

module.exports = app;
