


export const signUp = async (req,res, next) => {

    const {userName, Email, Password, role} = req.body;
    try {

        const isValidEmail = await UserDetails.findOne({Email_ID: Email});
        if(isValidEmail){
            return res.status(404).json({status: false, message: "Email already in use."})
        }
        
        const encryptedPassword = await bcrypt.hash(Password, 10);

        const code = Math.floor(100000+ Math.random()*900000).toString();

        var newUser = new UserDetails(
            {
            userName: userName,
            Email_ID: Email,
            Password: encryptedPassword,
            type: role,
        });
        
        const token =  generateToken({ id: newUser._id, type: newUser.role, Email_ID: newUser.Email_ID },res);
        await newUser.save();
        res.status(201).json({ status: true, message: "User registered successfully", data: token});
    
    } catch (error) {
        console.error("Sign-up error:", error.message);
        await UserDetails.findByIdAndDelete(newUser._id);
        
        res.status(500).json({status: false, message: "Sign-up Route error", errorDetails: error.message});
    }
};

export const login = async (req,res, next) => {
    const {Email, Password, type } = req.body;
    try {

        const user = await UserDetails.findOne({Email_ID: Email, type: type});
        
        if(!user){
            return res.status(404).json({status: false, message: "User not found, Please give correct EmailId or Contact Admin"})
        }

        const isPasswordValid  = await bcrypt.compare(Password, user.Password);
        
        if(!isPasswordValid ){
            return res.status(404).json({status: false, message: "Invalid Password"});
        }

        const token =  generateToken({ id: user._id, uuid: user.uuid, Email_ID: user.Email_ID }, res);
        const sendInfo = await UserDetails.findOne({ uuid: user.uuid }).select("uuid _id userInfo.Nickname userInfo.Profile_ImgURL");

        res.status(200).json({status: true, message: "login Successfully", Token: token, UserInfo: sendInfo });
    
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({status: false, message: "Login Route", errorDetails: error.message});
    }
};

export const forgetPassword = async (req, res) => {
    const {Email} = req.body;
    try {
        const user = await UserDetails.findOne({Email_ID: Email});

        if(!user){
            res.status(404).json({status: false, message: "This email has no User, Please Contact Admin"})
        }

        const code = Math.floor(100000+ Math.random()*900000).toString();

        await UserDetails.findOneAndUpdate({Email_ID: Email }, { verificationCode: code });

        const token =  generateToken({ id: user._id, uuid: user.uuid, Email_ID: user.Email_ID }, res);
        
        res.status(200).json({status: true, message: "VerificationCode is sended to mail", Token: token, Verification: code  });

    } catch (error) {
        console.error("Forget password error:", error.message);
        res.status(500).json({status: false, message: "Forget password Route error", errorDetails: error.message});
    }
};

export const resetPassword = async (req, res) => {
    const {Password} = req.body;
    const {uuid} = req.user;
    try {
        const user = await UserDetails.findOne({uuid});

        if(!user){
            // return next( new ErrorHandler(400,"User not found"));
            res.status(404).json({status: false, message: "User not found"})
        }

        const encryptPassword = await bcrypt.hash(Password, 10);
        await UserDetails.findByIdAndUpdate(user._id, { Password: encryptPassword});
       
        res.status(200).json({status: true, message: "Password reset successfully",user: { uuid: user.uuid, Email_ID: user.Email_ID }});
    } catch (error) {
        res.status(500).json({status: false, message: "Reset password Route error", errorDetails: error.message});
    }
};
