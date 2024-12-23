const mongoose = require("mongoose");

// Main User Schema
const userDetailsSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      id: { type: String, required: true, unique: true },
      Password: { type: String, required: true },
      type: {type: String, enum: ["operator" , "productionhead", "quality"]},
      store:[]
    },
    { timestamps: true }
  );

  const UserDetailsModel = mongoose.model("factoryUser", userDetailsSchema);

  module.exports = { UserDetailsModel };