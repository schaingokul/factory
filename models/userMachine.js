import mongoose from "mongoose";
import moment from "moment-timezone";


// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");

const userMachineSchema = new mongoose.Schema(
  {
      machines:[ {name: { type: String, required: true }, createdAt: { type: String, default: getFormattedDateTime }} ], 
      molds: [{name: { type: String, required: true }, createdAt: { type: String, default: getFormattedDateTime }}],
      materials: [{name: { type: String, required: true }, createdAt: { type: String, default: getFormattedDateTime }}],
  },
  { timestamps: false }
); 

// Pre-save middleware to update `updatedAt`
userMachineSchema.pre("save", function (next) {
  this.updatedAt = getFormattedDateTime();
  next();
});

// Pre-update middleware to update `updatedAt`
userMachineSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: getFormattedDateTime() });
  next();
});

const userMachine = mongoose.model("factoryMachine", userMachineSchema);

export default userMachine;


