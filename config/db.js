import mongoose from "mongoose";
import UserDetailsModel from "../models/UserModelDetail.js";
import bcrypt from "bcrypt";  // Import bcrypt for password hashing

// MongoDB connection setup
const connectDB = async () => {
  try {
    // Connect to MongoDB using Mongoose
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure the "userId" index is unique
    await createIndexes();

    // Create admin user if not already present
    await createAdminUser();

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Function to create indexes on UserDetailsModel
const createIndexes = async () => {
  try {
      await UserDetailsModel.collection.dropIndex("userId_1"); // Drop the index by name
      console.log("Dropped existing userId index.");

    // Now create a unique index on userId
    await UserDetailsModel.collection.createIndex({ userId: 1 }, { unique: true });
    console.log("Index created for userId.");

  } catch (err) {
    console.error("Error creating index: ", err.message);
  }
};

// Function to create the default admin user
const createAdminUser = async () => {
  try {
    // Check if the admin user already exists
    const adminUser = await UserDetailsModel.findOne({ type: "admin" });

    if (!adminUser) {
      // If no admin exists, create a default admin user
      const defaultAdmin = new UserDetailsModel({
        userId: "admin123", // Custom admin userId
        name: "admin",
        Password: await bcrypt.hash("adminPassword", 10), // Hash password
        type: "admin", // Set the role of the user as 'admin'
      });

      await defaultAdmin.save();
      console.log("Default admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("Error creating admin user:", err);
  }
};

// Export the connection function
export default connectDB;