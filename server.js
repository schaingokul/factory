import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv"; 
dotenv.config();
import cors from "cors";
import machinerouter from './routes/machineRoute.js';
import connectDB from "./config/db.js";

const app = express();

// Connect to the database


// Enable CORS
app.use(cors({ origin: "*" }));

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apis
app.use("/api", machinerouter);

// Home Route
app.get("/", (req, res) => {
  res.send("Api working..");
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  try {
    connectDB();
    
  console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    
  console.log(`Server is error on http://localhost:${PORT}: ${error.message}`);
  }
});
