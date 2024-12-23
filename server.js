const app = require("./app");
const connectDB = require("./config/db");

// Connect to the database
connectDB();

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 