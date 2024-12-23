const express = require("express");
const {machineModel} = require('./MachineModel.js');
const {Attendance } = require("./models/Attendance.model.js");
const {UserDetailsModel}  = require("./models/UserModelDetail");

const router = express.Router();


router.post('/signup', async(req, res) => {
    const {type , name, Id, password, Authorized} = req.body
    try {
        if (!Authorized || Authorized.toLowerCase() !== "production_head") {
            return res.status(400).json({ status: false, message: `Only Production Heads can create users` });
        }
        const newUser = new UserDetailsModel({
            name: name,
            id: Id,
            Password: password,
            type: type
        });

        await newUser.save();
        res.status(200).json({status: true, message: `New User Created`, data: newUser});

    } catch (error) {
        res.status(500).json({status: false, message: `Error creating user: ${error.message}`})
    }
});


router.post('/login', async(req, res) => {
    const {type , name, Id} = req.body
    try {
        const user = await UserDetailsModel.findOne({name: name, id: Id, type: type});
        if(!user){
            return res.status(404).json({status: false, message: "User not found"});
        }
       
        res.status(200).json({status: true, message: `Login Successfully`, data: user});

    } catch (error) {
        res.status(500).json({status: false, message: `Login error: ${error.message}`})
    }
});

router.get('/machine', async(req, res) => {
    const { type } = req.body
    try {
        if (!type || (type.toLowerCase() !== "quality" && type.toLowerCase() !== "production_head")) {
            return res.status(400).json({ status: false, message: `Only Quality or Production Head can access this` });
        }
        const view = await machineModel.find().sort({ createdAt: -1 });
        res.status(200).json({status: true, message: `Machine Running Status`, Running: view});
    } catch (error) {
        res.status(500).json({status: false, message:`Error fetching machines: ${error.message}`})
    }
});

router.post('/start', async(req, res) => {
    const {Set_Mc, Set_Md, Start_D, Start_T, type } = req.body
    try {
        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `Only an Operator can start the machine` });
        }
        const newMac = new machineModel({
            Set_Mc: Set_Mc,
            Set_Md: Set_Md,
            Start_D: Start_D,
            Start_T: Start_T
        });

        await newMac.save();
        res.status(200).json({status: true, message: `Machine Start Running`, data: newMac});

    } catch (error) {
        res.status(500).json({status: false, message: `Error starting machine: ${error.message}`})
    }
});

router.post('/qc/:id', async(req, res) => {
    const {qlty, Wt, up_D, up_T , type} = req.body;
    const {id} = req.params;
    try {
        if (!type || type.toLowerCase() !== "quality") {
            return res.status(400).json({ status: false, message: `Only Quality can update records` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D && machine.Stop_T) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        const newRecord = {
            Qlty: qlty,
            Wt: Wt,
            update_D: up_D,
            update_T: up_T
        }

       await machine.QC.push(newRecord);
       await machine.save();
        res.status(200).json({status: true, message: `Machine Stop`, RecordDetails : newRecord });

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
    }
});

router.post('/qcstatus/:id', async (req, res) => {
    const { type, qid, isApproved } = req.body;
    const { id } = req.params;

    try {
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

router.post('/emg/:id', async(req, res) => {
    const {Reason, NumberOf_Prod, Stop_D, Stop_T, type} = req.body;
    const {id} = req.params;
    try {
        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `Only an Operator can stop the machine in case of emergency` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D && machine.Stop_T) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        const stopEmergency = {
            Reason: Reason,
            NumberOf_Prod: NumberOf_Prod,
        }

       machine.Emergency = stopEmergency
       machine.Stop_D = Stop_D
       machine.Stop_T = Stop_T
       await machine.save();
        res.status(200).json({status: true, message: `Machine Emergency Stop`, Reason : stopEmergency });

    } catch (error) {
        res.status(500).json({status: false, message: `Emergency Stop Route Causes Error message: ${error.message}`})
    }
});

router.post('/stop/:id', async(req, res) => {
    const {Stop_D, Stop_T, type} = req.body;
    const {id} = req.params;
    try {
        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `Only an Operator can stop the machine` });
        }

        const machine = await machineModel.findById(id)
        if (machine.Stop_D && machine.Stop_T) {
            return res.status(400).json({ status: false, message: `Machine has already stopped`, data: machine });
        }

        machine.Stop_D = Stop_D;
        machine.Stop_T = Stop_T;
        await machine.save();
        res.status(200).json({status: true, message: `Machine Stopped`});

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
    }
});


router.get('/attend', async(req, res) => {
    const {type } = req.body;
    try {
        if (!type || type.toLowerCase() !== "production_head") {
            return res.status(400).json({ status: false, message: `This is only for production_head Attedance` });
        }

        const findUser = await Attendance.find();
        if(!findUser){
            res.status(500).json({status: false, message: `list of attendence`});
        }

        res.status(200).json({status: true, message: `attendence List`});

    } catch (error) {
        res.status(500).json({status: false, message: `attendence List Route Causes Error message: ${error.message}`})
    }
});


router.post('/attend', async(req, res) => {
    const {type, operatorName, operatorId, action} = req.body;
    try {
        if (!type || type.toLowerCase() !== "operator") {
            return res.status(400).json({ status: false, message: `This is only for Operator Attedance` });
        }

        const findUser = await UserDetailsModel.find({name: operatorName.toLowerCase(), Id: operatorId.toLowerCase()});
        if(!findUser){
            res.status(500).json({status: false, message: `Given User name and id is not found`});
        }

        const newRecord = new Attendance({
            operatorName: operatorName,
            operatorid: operatorId,
            action: action
        })

        await newRecord.save()
        res.status(200).json({status: true, message: `Add List`, newRecord});

    } catch (error) {
        res.status(500).json({status: false, message: `Stop Route Causes Error message: ${error.message}`})
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