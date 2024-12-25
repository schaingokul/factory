const express = require("express");
const {machineModel} = require('../models/MachineModel.js');
const {UserAttendance } = require("../models/Attendance.model.js");
const {UserDetailsModel}  = require("../models/UserModelDetail.js");
const bcrypt = require("bcrypt");
const authenticate = require('../routes/ProtectRoute.js');
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken")

const router = express.Router();

// Helper to get formatted IST datetime
const getFormattedDateTime = () => moment().tz("Asia/Kolkata").format("YYYY-MM-DD hh:mm A");

// Signup Route for Creating User and Attendance
router.post('/signup', async (req, res) => {
    const { type, name, Id, password } = req.body;

    try {
         // Extract and verify authorization token
         const authHeader = req.headers.authorization;
         if (!authHeader) {
             return res.status(401).json({ status: false, message: "Authorization header missing" });
         }

        if (!Id || Id.trim() === '') {
            return res.status(400).json({ status: false, message: `User ID must be provided.` });
        }

        // Check if userId already exists
        const existingUser = await UserDetailsModel.findOne({ userId: Id });
        if (existingUser) {
            return res.status(400).json({ status: false, message: 'User with this userId already exists.' });
        }
        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new UserDetailsModel({
            name: name,
            userId: Id,
            Password: hashPassword,
            type: type
        });
        // Save the new user and attendance record
        await newUser.save();

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // JavaScript months are 0-indexed

        // Initialize a new attendance record for this user
        const newAttendance = new UserAttendance({
            userId: newUser.id,
            year: currentYear,
            month: currentMonth + 1, // Adjust month to be 1-indexed
            data: Array(new Date(currentYear, currentMonth + 1, 0).getDate()).fill(0) // Initialize with 0 (leave or no data) for all days
        });
        await newAttendance.save();

        res.status(201).json({ status: true, message: `New User Created`, data: newUser });
    } catch (error) {
        res.status(500).json({ status: false, message: `Error creating user: ${error.message}` });
    }
});

router.post('/login', async(req, res) => {
    const {type , name, Id} = req.body
    try {
        const user = await UserDetailsModel.findOne({name: name, userId: Id, type: type});

        if(!user){
            return res.status(404).json({status: false, message: "User not found"});
        }

        const payload = {
            userId: user.userId,
            name: user.name,
            type: user.type
        };

        const token = jwt.sign(payload, "secretKey"); 
       
        res.status(200).json({status: true, message: `Login Successfully`, data: token,});

    } catch (error) {
        res.status(500).json({status: false, message: `Login error: ${error.message}`})
    }
});

router.get('/machine', authenticate, async (req, res) => {
    const { type, userId, name } = req.user;
    const { limit, start_D, Stop_D, fullList } = req.query;  // Using query parameters instead of params for more flexibility

    try {
        // Validate user
        const user = await UserDetailsModel.findOne({ name: name, userId: userId, type: type });
        if (!user) {
            return res.status(400).json({ status: false, message: "User Not Found" });
        }

        // Validate user type
        if (!type || (type.toLowerCase() !== "quality" && type.toLowerCase() !== "production_head")) {
            return res.status(400).json({ status: false, message: `Only Quality or Production Head can access this` });
        }

        // Default to today's records if no other filter is applied
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Midnight of today
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // Midnight of the next day

        // Build the query object
        let query = { userId: userId };

        // Apply filters based on query parameters
        if (fullList) {
            // If fullList is true, get all records without time filtering
            delete query.createdAt;
        } else {
            // Default behavior: get today's records
            query.createdAt = { $gte: startOfDay, $lt: endOfDay };
        }

        // Additional filters based on start_D, Stop_D, and EmgStop
        if (start_D) {
            query.start_D = { $gte: new Date(start_D) };  // Assuming start_D is a date string
        }

        if (Stop_D) {
            query.Stop_D = { $lte: new Date(Stop_D) };  // Assuming Stop_D is a date string
        }

        // Fetch the data with optional limit
        const view = await machineModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit ? parseInt(limit) : 8);  // Default limit to 8 if not provided

        // Handle response
        const message = view.length > 0 ? "List of Machines" : "No List is found";
        res.status(200).json({ status: true, message: message, view });

    } catch (error) {
        res.status(500).json({ status: false, message: `Error fetching machines: ${error.message}` });
    }
});

router.post('/start', authenticate, async (req, res) => {
        const { Set_Mc, Set_Md } = req.body;
        const { type, userId } = req.user;
    
        try {
            // Validate user
            const user = await UserDetailsModel.findOne({ userId: userId });
            if (!user) {
                return res.status(400).json({ status: false, message: "User Not Found" });
            }
    
            // Check if user is an operator
            if (!type || type.toLowerCase() !== "operator") {
                return res.status(400).json({ status: false, message: `Only an Operator can start the machine` });
            }
    
            // Validate required fields
            if (!Set_Mc || !Set_Md) {
                return res.status(400).json({ status: false, message: "Machine (Set_Mc) and Mold (Set_Md) are required." });
            }
    
            // Create new machine record
            const newMac = new machineModel({
                userId: userId,
                Set_Mc: Set_Mc,
                Set_Md: Set_Md,
                Start_D: getFormattedDateTime(), // Set start date and time
            });
    
            // Save the machine record
            await newMac.save();
    
            res.status(200).json({ status: true, message: `Machine has started successfully`, data: newMac, });
        } catch (error) {
            console.error("Error starting machine:", error.message);
            res.status(500).json({ status: false, message: `Error starting machine: ${error.message}` });
        }
    });
    
router.post('/qc/:id',authenticate,  async(req, res) => {
    const {qlty, Wt } = req.body;
    const { type, userId: qcid } = req.user
    const {id} = req.params;
    try {
        const user = await UserDetailsModel.find({userId: qcid});
        if(!user) {
            return res.status(400).json({status: false, message: "User Not Found"});
        }

        if (!type || type.toLowerCase() !== "quality") {
            return res.status(400).json({ status: false, message: `Only Quality can update records` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        const newRecord = {
            qcId: qcid,
            Qlty: qlty,
            Wt: Wt,
            update_D: getFormattedDateTime()
        }

       await machine.QC.push(newRecord);
       await machine.save();
        res.status(200).json({status: true, message: `Add QC Records`, newRecord });

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
    }
});

router.post('/qcstatus/:id', authenticate, async (req, res) => {
    const { qid, isApproved } = req.body;
    const { type , userId} = req.user
    const { id } = req.params; // MachineID

    try {
        const user = await UserDetailsModel.find({userId: userId});
        if(!user) {
            return res.status(400).json({status: false, message: "User Not Found"});
        }

        // Validate user type
        if (!type || type.toLowerCase() !== "quality") {
            return res.status(400).json({ status: false, message: `Only Quality can update records` });
        }

        // Find machine by ID
        const machine = await machineModel.findById(id);
        if (!machine) {
            return res.status(404).json({ status: false, message: `Machine not found` });
        }

        // Check if the machine is stopped
        if (machine.Stop_D && machine.Stop_T) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        // Update QC status in the array
        const updatedMachine = await machineModel.findOneAndUpdate(
            { _id: id, "QC._id": qid }, // Match machine ID and QC with the given qid
            { $set: { "QC.$.isApproved": isApproved } }, // Update the specific QC field
            { new: true } // Return the updated document
        );

        if (!updatedMachine) {
            return res.status(404).json({ status: false, message: `QC record with qid ${qid} not found` });
        }

        res.status(200).json({
            status: true,
            message: `QC status updated successfully`,
            updatedMachine,
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: `QC Status Causes Error: ${error.message}`,
        });
    }
});

router.post('/emg/:id', authenticate, async(req, res) => {
    const {Reason, NumberOf_Prod} = req.body;
    const { type , userId} = req.user
    const {id} = req.params;
    try {
        const user = await UserDetailsModel.find({userId: userId});
        if(!user) {
            return res.status(400).json({status: false, message: "User Not Found"});
        }

        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `Only an Operator can stop the machine in case of emergency` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        const stopEmergency = {
            Reason: Reason,
            NumberOf_Prod: NumberOf_Prod,
        }

       machine.Emergency = stopEmergency
       machine.Stop_D = getFormattedDateTime()
       await machine.save();
        res.status(200).json({status: true, message: `Machine Emergency Stop`, Reason : stopEmergency });

    } catch (error) {
        res.status(500).json({status: false, message: `Emergency Stop Route Causes Error message: ${error.message}`})
    }
});

router.post('/stop/:id',authenticate,  async(req, res) => {
    const { type , userId} = req.user
    const {id} = req.params;
    try {
        const user = await UserDetailsModel.find({userId: userId});
        if(!user) {
            return res.status(400).json({status: false, message: "User Not Found"});
        }

        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `Only an Operator can stop the machine` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }
        machine.Stop_D = getFormattedDateTime()
        
        await machine.save();
        res.status(200).json({status: true, message: `Machine Stopped`});

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
    }
});


router.get('/atten', authenticate, async (req, res) => {
    const { type, userId } = req.user;  // Extract type and userId from authenticated user
    try {
        // Validate user existence
        const user = await UserDetailsModel.findOne({ userId: userId });
        if (!user) {
            return res.status(400).json({ status: false, message: "User Not Found" });
        }

        // Define date range for today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Midnight of today
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // Midnight of the next day

        // If the user is a production head, fetch all today's attendance records
        let findUser;
        if (type.toLowerCase() === 'production_head') {
            findUser = await UserAttendance.find({
                createdAt: { $gte: startOfDay, $lt: endOfDay },
            }).sort({ createdAt: -1 });
        } else {
            // If the user is an operator or quality, fetch only their attendance
            findUser = await UserAttendance.find({
                userId: userId,
                createdAt: { $gte: startOfDay, $lt: endOfDay },
            }).sort({ createdAt: -1 });
        }

        // Check if attendance records are found
        if (!findUser || findUser.length === 0) {
            return res.status(500).json({ status: false, message: `Attendance records not found.` });
        }

        // Send the attendance records in the response
        res.status(200).json({
            status: true,
            message: `Attendance List`,
            view: findUser,
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: `Attendance List Route Causes Error message: ${error.message}`,
        });
    }
});

router.post('/attend', authenticate,  async (req, res) => {
    const {  year, month, status } = req.body;
    const {type, userId } = req.body;

    try {
        const user = await UserDetailsModel.find({userId: userId});
        if(!user) {
            return res.status(400).json({status: false, message: "User Not Found"});
        }

        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `This is only for production_head Attedance` });
        }

        // Validate inputs
        if (!userId || !year || !month || status === undefined) {
            return res.status(400).json({ status: false, message: "Invalid request body. Required fields: userId, year, month, status." });
        }

        if (![0, 1, 2].includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid status. Allowed values are 0 (leave), 1 (present), 2 (absent)." });
        }

        // Get today's date and validate year/month match
        const today = new Date();
        const currentDay = today.getDate();

        if (today.getFullYear() !== year || today.getMonth() + 1 !== month) {
            throw new Error("The specified year and month do not match today's date.");
        }

        // Find or update attendance
        const attendance = await UserAttendance.findOneAndUpdate(
            { userId, year, month }, // Find by userId, year, and month
            {
                $set: { [`data.${currentDay - 1}`]: status }, // Update current day status
            },
            { new: true, upsert: true } // Create if not found
        );

        // Send response
        res.status(200).json({
            status: true,
            message: `Attendance updated for ${year}-${month}-${currentDay}`,
            data: attendance,
        });

    } catch (error) {
        console.error("Error in /attend route:", error.message);
        res.status(500).json({ 
            status: false, 
            message: `Error updating attendance: ${error.message}` 
        });
    }
});

router.delete('/delete/:id', async(req, res) => {
    const {type} = req.body;
    const {id} = req.params;
    try {
        if (!type || type.toLowerCase() !== "production_head") {
            return res.status(400).json({ status: false, message: `Only Production Head can delete the machine` });
        }

        // Correct Mongoose method to delete by ID
        const machine = await machineModel.findByIdAndDelete(id);

        if (!machine) {
            return res.status(404).json({ status: false, message: `Machine not found` , data: {machine}});
        }
 
        res.status(200).json({ status: true, message: `Machine deleted`, data: machine });

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
    }
});

router.delete('/userdelete/:id', async(req, res) => {
    const {type} = req.body;
    const {id} = req.params;
    try {
        if (!type || type.toLowerCase() !== "production_head") {
            return res.status(400).json({ status: false, message: `Only Production Head can delete the machine` });
        }

        // Correct Mongoose method to delete by ID
        const user = await UserDetailsModel.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ status: false, message: `user not found` , data: user});
        }
 
        res.status(200).json({ status: true, message: `user deleted`, data: user });

    } catch (error) {
        res.status(500).json({status: false, message: `user Delete Causes Error message: ${error.message}`})
    }
});


router.get('/alluser', async(req, res) => {
    const {type} = req.body;

    try {
        if (!type || type.toLowerCase() !== "production_head") {
            return res.status(400).json({ status: false, message: `Only Production Head can delete the machine` });
        }

        const user = await UserDetailsModel.find();

        if (!user) {
            return res.status(404).json({ status: false, message: `user List not found` , data: user});
        }
 
        res.status(200).json({ status: true, message: `Alluser Details`, data: user });

    } catch (error) {
        res.status(500).json({status: false, message: `Alluser Details Causes Error message: ${error.message}`})
    }
});

module.exports = router