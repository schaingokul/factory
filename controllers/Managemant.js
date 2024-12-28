import UserDetailsModel from "../models/UserModelDetail.js";
import UserAttendance from "../models/Attendance.model.js";
import bcrypt from "bcrypt";
import userMachine from "../models/userMachine.js";
import jwt from "jsonwebtoken"
import machineModel from "../models/MachineModel.js";

export const signUp = async (req, res) => {
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
            name: name.toString(),
            userId: Id,
            Password: hashPassword,
            type: type.toString()
        });
        // Save the new user and attendance record
        await newUser.save();

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // JavaScript months are 0-indexed

        // Initialize a new attendance record for this user
        const newAttendance = new UserAttendance({
            userId: Id,
            year: currentYear,
            month: currentMonth + 1, // Adjust month to be 1-indexed
            data: Array(new Date(currentYear, currentMonth + 1, 0).getDate()).fill(0) // Initialize with 0 (leave or no data) for all days
        });

        if(!newAttendance){
            return res.status(400).json({ status: false, message: 'Attendence is not created' });
        }
        console.log("newAttendance", newAttendance)
        await newAttendance.save();

        res.status(201).json({ status: true, message: `New User Created`, data: newUser });
    } catch (error) {
        res.status(500).json({ status: false, message: `Error creating user: ${error.message}` });
    }
};

export const login = async(req, res) => {
    const {type , name, Id, password} = req.body
    try {
        const user = await UserDetailsModel.findOne({name: name, userId: Id, type: type});

        if(!user){
            return res.status(404).json({status: false, message: "User not found"});
        }
        const isValidPassword = bcrypt.compare(password, user.Password);
        if(!isValidPassword){
            return res.status(400).json({status: false, message: `InValid Password`})
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
};

export const getAttendance = async (req, res) => {
    const { type, userId } = req.user; // Extract type and userId from authenticated user
    let { sd, ed, page = 1, limit = 10 } = req.query; // Extract pagination and date range from query parameters

    try {
        // Validate role
        if (!["admin", "production_head", "operator", "quality"].includes(type.toLowerCase())) {
            return res.status(403).json({ status: false, message: "Access denied." });
        }
        // Convert page and limit to integers
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        // Define date range for today if not provided
        const today = new Date();
        sd = `${sd} 00:00 AM` || `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')} 00:00 AM`;
        ed = `${ed} 11:59 PM` || `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${(today.getDate() + 1).toString().padStart(2, '0')} 11:59 PM`;

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Prepare query filter for attendance
        const filter = {
            createdAt: { $gte: sd, $lt: ed }
        };
        // Role-based access control
        if (type.toLowerCase() === "operator" || type.toLowerCase() === "quality") {
            filter.userId = userId; // Restrict to user's own attendance records
        }
        console.log(filter)
        // Fetch attendance records with pagination and sorting
        const attendanceRecords = await UserAttendance.find(filter)
        .sort({ createdAt: -1 }) // Sort by date in descending order
        .skip(skip) // Apply pagination
        .limit(limit);

        // Check if attendance records exist
        if (!attendanceRecords || attendanceRecords.length === 0) {
        return res.status(404).json({ status: false, message: "No attendance records found." });
        }

        // Fetch total record count for pagination
        const totalRecords = await UserAttendance.countDocuments(filter);

        // Send the attendance records and pagination info in the response
        res.status(200).json({
        status: true,
        message: "Attendance List",
        view: attendanceRecords,
        pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
        },
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: `Attendance List Route Causes Error: ${error.message}`,
        });
    }
};

export const addAttendance =async (req, res) => {
    const {status , id,  month, year, date } = req.query;
    const { type, userId } = req.user;
    try {
        // Find the user
        const user = await UserDetailsModel.findOne({ userId });
        if (!user) {
            return res.status(400).json({ status: false, message: "User Not Found" });
        }
        const attendanceStatus = parseInt(status, 10);
        // Validate the status input
        if (![0, 1, 2].includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid status. Allowed values are 0 (leave), 1 (present), 2 (absent)." });
        }

        // Handle leave request (status === 2)
        let leave = null;
        if (status === 2) {
            leave = {
                details: `Leave request from ${user.name} on ${year}-${month}-${date}`,
                isApproved: false
            };
        }

        // If a specific month/year/date is provided, update that attendance record
        if (month && year && date && id) {
            const attendance = await UserAttendance.findOneAndUpdate(
                { userId: id, year, month },
                {
                    $set: { [`data.${date - 1}`]: status }, // Update the specific day's status
                    $push: { status: leave ? leave : {} }, // Push leave request if it's a leave
                },
                { new: true, upsert: true }
            );

            if (attendance) {
                return res.status(200).json({
                    status: true,
                    message: `Attendance updated for ${year}-${month}-${date}`,
                    data: attendance,
                });
            }
        }

        // Default case: Update today's attendance if no specific date is given
        const today = new Date();
        const currentDay = today.getDate();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // JavaScript months are 0-indexed

        // Find or update attendance for the current month and year
        const attendance = await UserAttendance.findOneAndUpdate(
            { userId, year: currentYear, month: currentMonth },
            {
                $set: { [`data.${currentDay - 1}`]: status }, // Update the current day's status
                $push: { status: leave ? leave : {} }, // Push leave request if it's a leave
            },
            { new: true, upsert: true }
        );

        if (!attendance) {
            // Initialize a new attendance record for this user if not found
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Get number of days in the current month
            const newAttendance = new UserAttendance({
                userId,
                year: currentYear,
                month: currentMonth, // Month remains 0-indexed
                data: Array(daysInMonth).fill(0), // Initialize all days as '0' (leave or no data)
                status: leave ? [leave] : [], // If it's a leave, add it to the status
            });

            // Save the new attendance record
            await newAttendance.save();

            return res.status(200).json({
                status: true,
                message: `Attendance record created for ${currentYear}-${currentMonth + 1}-${currentDay}`,
                data: newAttendance,
            });
        }

        // Send response after updating the attendance
        res.status(200).json({
            status: true,
            message: `Attendance updated for ${currentYear}-${currentMonth + 1}-${currentDay}`,
            data: attendance,
        });

    } catch (error) {
        console.error("Error in /attend route:", error.message);
        res.status(500).json({ status: false, message: `Error updating attendance: ${error.message}` });
    }
}

// All users
export const getAllUserList = async (req, res) => {
    const { type, name } = req.body;

    try {
        // Validate the 'type' field
        if (!type) {
            return res.status(400).json({ status: false, message: "Type is required" });
        }

        // Initialize the query object
        const query = {};

        // Add 'name' to the query if provided
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }

        // Handle 'production_head' type
        if (type.toLowerCase() === "production_head") {
            query.type = { $ne: "admin" }; // Exclude admin users

            const users = await UserDetailsModel.find(query);

            if (!users || users.length === 0) {
                return res.status(404).json({ status: false, message: "User list not found", data: [] });
            }

            return res.status(200).json({ status: true, message: "User list retrieved successfully", data: users });
        }

        // Handle 'admin' type
        if (type.toLowerCase() === "admin") {
            const users = await UserDetailsModel.find(query);

            if (!users || users.length === 0) {
                return res.status(404).json({ status: false, message: "No users found", data: [] });
            }

            return res.status(200).json({ status: true, message: "User list retrieved successfully", data: users });
        }

        // Invalid type provided
        return res.status(400).json({ status: false, message: "Invalid user type provided" });

    } catch (error) {
        // Handle any errors
        res.status(500).json({ status: false, message: `Error fetching user details: ${error.message}` });
    }
};

//Create Machine
export const createMachine = async (req, res) => {
    const { machine, mold, material } = req.body; // Extract machine, mold, and material from request body

    // Validate input
    if (!machine && !mold && !material) {
        return res.status(400).json({ status: false, message: "At least one of Machine name, Mold, or Material is required." });
    }

    try {
        // Find the existing userMachine record
        let existingRecord = await userMachine.findOne({}); // Fetch the first document

        if (existingRecord) {
            // Handle case when machine is provided
            if (machine) {
                // Check if the machine already exists
                const machineExists = existingRecord.machines.some((m) => m.name === machine);
                if (machineExists) {
                    return res.status(400).json({ status: false, message: `Machine "${machine}" already exists.` });
                }
                existingRecord.machines.push({ name: machine });
            }

            // Handle case when mold is provided
            if (mold) {
                // Check if the mold already exists
                const moldExists = existingRecord.molds.some((m) => m.name === mold);
                if (moldExists) {
                    return res.status(400).json({ status: false, message: `Mold "${mold}" already exists.` });
                }
                existingRecord.molds.push({ name: mold });
            }

            // Handle case when material is provided
            if (material) {
                // Check if the material already exists
                const materialExists = existingRecord.materials.some((m) => m.name === material);
                if (materialExists) {
                    return res.status(400).json({ status: false, message: `Material "${material}" already exists.` });
                }
                existingRecord.materials.push({ name: material });
            }

            // Save the updated record
            await existingRecord.save();

            let message = "Updated successfully.";

            if (machine && mold && material) {
                message = `Machine "${machine}", mold "${mold}", and material "${material}" added successfully.`;
            } else if (machine && mold) {
                message = `Machine "${machine}" and mold "${mold}" added successfully.`;
            } else if (machine && material) {
                message = `Machine "${machine}" and material "${material}" added successfully.`;
            } else if (mold && material) {
                message = `Mold "${mold}" and material "${material}" added successfully.`;
            } else if (machine) {
                message = `Machine "${machine}" added successfully.`;
            } else if (mold) {
                message = `Mold "${mold}" added successfully.`;
            } else if (material) {
                message = `Material "${material}" added successfully.`;
            }

            return res.status(200).json({ status: true, message });
        } else {
            // If no existing record, create a new one with machine, mold, and material
            const newRecord = new userMachine({
                machines: machine ? [{ name: machine }] : [],
                molds: mold ? [{ name: mold }] : [],
                materials: material ? [{ name: material }] : []
            });

            await newRecord.save();

            return res.status(200).json({ status: true, message: `Machine "${machine}", mold "${mold}", and material "${material}" created successfully.` });
        }
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ status: false, message: `Error processing request: ${error.message}` });
    }
};

// DeleteMachine
export const deleteMachine = async (req, res) => {
    const { machine, mold, material } = req.body; // Extract machine, mold, and material from request body

    // Validate input
    if (!machine && !mold && !material) {
        return res.status(400).json({ status: false, message: "At least one of Machine name, Mold, or Material is required to delete." });
    }

    try {
        // Find the existing userMachine record
        let existingRecord = await userMachine.findOne({});

        if (!existingRecord) {
            return res.status(404).json({ status: false, message: "No record found." });
        }

        let message = "Deleted successfully.";

        // Handle case when machine is provided
        if (machine) {
            const machineIndex = existingRecord.machines.findIndex((m) => m.name === machine);
            if (machineIndex !== -1) {
                existingRecord.machines.splice(machineIndex, 1); // Remove the machine
                message = `Machine "${machine}" deleted successfully.`;
            } else {
                return res.status(400).json({ status: false, message: `Machine "${machine}" not found.` });
            }
        }

        // Handle case when mold is provided
        if (mold) {
            const moldIndex = existingRecord.molds.findIndex((m) => m.name === mold);
            if (moldIndex !== -1) {
                existingRecord.molds.splice(moldIndex, 1); // Remove the mold
                message = `Mold "${mold}" deleted successfully.`;
            } else {
                return res.status(400).json({ status: false, message: `Mold "${mold}" not found.` });
            }
        }

        // Handle case when material is provided
        if (material) {
            const materialIndex = existingRecord.materials.findIndex((m) => m.name === material);
            if (materialIndex !== -1) {
                existingRecord.materials.splice(materialIndex, 1); // Remove the material
                message = `Material "${material}" deleted successfully.`;
            } else {
                return res.status(400).json({ status: false, message: `Material "${material}" not found.` });
            }
        }

        // Save the updated record
        await existingRecord.save();

        return res.status(200).json({ status: true, message });

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ status: false, message: `Error processing request: ${error.message}` });
    }
};

export const search = async (req, res) => {
    const { name, type } = req.query; // Extract name and type from query parameters
  console.log(type)
    try {
        let result;
  
        // Case 1: If the search type is 'machine'
        if (type === 'machine') {
            if (name) {
                // Search for a specific machine by name
                result = await userMachine.find({ "machines.name": name }, { "machines.name": 1 });
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: `Machine "${name}" not found.` });
                }
  
                const machineResults = result.map(item => item.machines.filter(machine => machine.name === name)).flat();
                return res.status(200).json({
                    status: true,
                    message: `Machine "${name}" found.`,
                    data: machineResults,
                });
            } else {
                // Fetch all machines
                result = await userMachine.find({}, { "machines.name": 1 }).sort({createdAt: -1});
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: "No machines found." });
                }
  
                const machineResults = result.map(item => item.machines).flat();
                return res.status(200).json({
                    status: true,
                    message: "All machines fetched successfully.",
                    data: machineResults,
                });
            }
        }
  
        // Case 2: If the search type is 'mold'
        if (type === 'mold') {
            if (name) {
                // Search for a specific mold by name
                result = await userMachine.find({ "molds.name": name }, { "molds.name": 1 });
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: `Mold "${name}" not found.` });
                }
  
                const moldResults = result.map(item => item.molds.filter(mold => mold.name === name)).flat();
                return res.status(200).json({
                    status: true,
                    message: `Mold "${name}" found.`,
                    data: moldResults,
                });
            } else {
                // Fetch all molds
                result = await userMachine.find({}, { "molds.name": 1 }).sort({createdAt: -1});
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: "No molds found." });
                }
  
                const moldResults = result.map(item => item.molds).flat();
                return res.status(200).json({
                    status: true,
                    message: "All molds fetched successfully.",
                    data: moldResults,
                });
            }
        }
  
        // Case 3: If the search type is 'material'
        if (type === 'material') {
            if (name) {
                // Search for a specific material by name
                result = await userMachine.find({ "materials.name": name }, { "materials.name": 1 });
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: `Material "${name}" not found.` });
                }
  
                const materialResults = result.map(item => item.materials.filter(material => material.name === name)).flat();
                return res.status(200).json({
                    status: true,
                    message: `Material "${name}" found.`,
                    data: materialResults,
                });
            } else {
                // Fetch all materials
                result = await userMachine.find({}, { "materials.name": 1 }).sort({createdAt: -1});
  
                if (result.length === 0) {
                    return res.status(404).json({ status: false, message: "No materials found." });
                }
  
                const materialResults = result.map(item => item.materials).flat();
                return res.status(200).json({
                    status: true,
                    message: "All materials fetched successfully.",
                    data: materialResults,
                });
            }
        }
  
        // Case 4: If no type is provided or type is null, fetch all (machines, molds, materials)
        if (!type) {
            result = await userMachine.find({}, { "machines.name": 1, "molds.name": 1, "materials.name": 1 }).sort({createdAt: -1});
  
            if (result.length === 0) {
                return res.status(404).json({ status: false, message: "No records found." });
            }
  
            const allResults = {
                machines: result.map(item => item.machines).flat(),
                molds: result.map(item => item.molds).flat(),
                materials: result.map(item => item.materials).flat(),
            };
  
            return res.status(200).json({
                status: true,
                message: "All machines, molds, and materials fetched successfully.",
                data: allResults,
            });
        }
        // If the type is invalid
        return res.status(400).json({ status: false, message: "Invalid search type." });
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ status: false, message: `Error processing request: ${error.message}` });
    }
  }
