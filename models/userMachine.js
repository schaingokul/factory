import mongoose from "mongoose";
import moment from "moment-timezone";


// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");

const adminMachineListSchema = new mongoose.Schema({
  machines: [
      {
          id: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() }, // Generate unique ID
          name: { type: String, required: true },
          createdAt: { type: String, default: getFormattedDateTime }
      }
  ],
  molds: [
      {
          id: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() }, // Generate unique ID
          name: { type: String, required: true },
          createdAt: { type: String, default: getFormattedDateTime }
      }
  ],
  materials: [
      {
          id: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() }, // Generate unique ID
          name: { type: String, required: true },
          createdAt: { type: String, default: getFormattedDateTime }
      }
  ]
});

// Pre-save middleware to update `updatedAt`
adminMachineListSchema.pre("save", function (next) {
  this.updatedAt = getFormattedDateTime();
  next();
});

// Pre-update middleware to update `updatedAt`
adminMachineListSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: getFormattedDateTime() });
  next();
});

const userMachine = mongoose.model("factoryMachine", adminMachineListSchema);

export default userMachine;


