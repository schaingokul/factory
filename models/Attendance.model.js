const mongoose = require("mongoose");
const moment = require("moment-timezone");

// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");


const userAttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "FactoryUser", required: true, },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    data: {
      type: [Number],
      required: true,
      default: [], // Automatically filled with zeros if missing
      validate: {
        validator: (data) => data.every((status) => [0, 1, 2].includes(status)),
        message: "Attendance data must contain only 0, 1, or 2",
      },
    },
    createdAt: { type: String, default: getFormattedDateTime },
    updatedAt: { type: String, default: getFormattedDateTime },
  },
  { timestamps: false }
);

// Pre-save middleware to update `updatedAt`
userAttendanceSchema.pre("save", function (next) {
  this.updatedAt = getFormattedDateTime();
  next();
});

// Pre-update middleware to update `updatedAt`
userAttendanceSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: getFormattedDateTime() });
  next();
});

const UserAttendance = mongoose.model("UserAttendance", userAttendanceSchema);

module.exports = {UserAttendance};