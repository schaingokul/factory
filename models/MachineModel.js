import mongoose from "mongoose" ;
import moment from "moment-timezone";

// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");


const RecordSchema = mongoose.Schema(
    {
        qcId: {type: String, required: true},
        Qlty: { type: String, default: "0"},
        Wt: {type: String, default: "0"},
        update_D: { type: String},
        isApproved: {type: Boolean, default: false}
      },
      { _id: true } 
);

const EmergencySchema = mongoose.Schema(
    {
        Reason: { type: String },
        NumberOf_Prod: {type: String}
      },
      { _id: false}
);

const MachineSchema = mongoose.Schema({
    userId: {type: String, required: true},
    Set_Mc: {type: String, required: true}, // Machine
    Set_Md: {type: String, required: true}, // Mold 
    Set_Mat: {type: String, required: true}, // Material
    Start_D: { type: String},
    QC: {type: [RecordSchema],
        validate: {
            validator: function (value) {
                return value.length <= 10; // Limit the length of QC array to 10
            },
            message: 'QC array exceeds the maximum length of 10',
        },
    }, // QualityChecking
    EM: EmergencySchema, //Emergency
    Stop_D: { type: String},
    status: {type:String, enum: ["running", "shutdown"] , default: "running"},
    runtime: {type:String }
}, { timestamps: false });


MachineSchema.pre("save", function (next) {
    this.updatedAt = getFormattedDateTime();
    next();
  });
  
  MachineSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: getFormattedDateTime() });
    next();
  });

const machineModel = mongoose.model('factoryMachineRecords', MachineSchema );
export default  machineModel