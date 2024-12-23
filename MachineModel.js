const mongoose = require("mongoose") ;

const RecordSchema = mongoose.Schema(
    {
        Qlty: { type: String, default: "0"},
        Wt: {type: String, default: "0"},
        update_D: { type: String}, // Date
        update_T: { type: String}, // Time
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
    Set_Mc: {type: String, required: true}, //Machine
    Set_Md: {type: String, required: true}, // Mold
    Start_D: { type: String}, // Date
    Start_T: { type: String}, // Time
    QC: {type: [RecordSchema],
        validate: {
            validator: function (value) {
                return value.length <= 10; // Limit the length of QC array to 10
            },
            message: 'QC array exceeds the maximum length of 10',
        },
    }, // QualityChecking
    EM: EmergencySchema, //Emergency
    Stop_D: { type: String}, // Date
    Stop_T: { type: String}, // Time
}, { timestamps: true });

const machineModel = mongoose.model('Machine', MachineSchema );
module.exports = { machineModel };