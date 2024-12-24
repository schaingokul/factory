const mongoose = require("mongoose");
const moment = require("moment-timezone");

// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");


// Main User Schema
const userDetailsSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      userId: { type: String, required: true, unique: true },
      Password: { type: String, required: true },
      type: {type: String, enum: ["operator" , "productionhead", "quality"]},
      createdAt: { type: String, default: getFormattedDateTime },
      updatedAt: { type: String, default: getFormattedDateTime },
    },
    { timestamps: false }
  );

  userDetailsSchema.pre("save", function (next) {
    this.updatedAt = getFormattedDateTime();
    next();
  });
  
  userDetailsSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: getFormattedDateTime() });
    next();
  });

  const UserDetailsModel = mongoose.model("factoryUser", userDetailsSchema);

  module.exports = { UserDetailsModel };