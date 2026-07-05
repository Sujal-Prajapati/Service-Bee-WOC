const Company = require("../../models/company");
const jwt = require("jsonwebtoken");

const postCompanyRegister= async (req,res)=>{
    try{
        console.log(req.body);
        const {name,email,phone,password} = req.body;
        if(!name || !email || !phone || !password){
            return res.status(400).json({message : "All fields are required"});
        }

        const isExist = await Company.findOne({email});
        if(isExist){
            return res.status(409).json({
                message : "Emai; already exist" 
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format",
            });
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if(!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain 8 characters, uppercase, lowercase, number and special character",
            });
        }

        const newCompany = new Company({
            name,
            email,
            phone,
        })
        
        newCompany.setPassword(password);
        
        const accessToken = jwt.sign({
            id:newCompany._id
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn:'15m'
        });

        const refreshToken = jwt.sign({
            id:newCompany._id
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn:'7d'
        })

        newCompany.refreshToken = refreshToken;
        await newCompany.save();

        res.cookie("refreshToken",refreshToken,{
            httpOnly : true,
            secure:false, //true in production with https
            sameSite:"lax",
            maxAge:7*24*60*60*1000
        });

        const companyData = newCompany.toObject();
        delete companyData.hash;
        delete companyData.salt;
        delete companyData.refreshToken

        res.status(201).json({
            success : true,
            message : "Company registered successfully",
            companyData,
            accessToken
        });

    }catch (error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

const postCompanyLogin = async (req,res)=>{
    try{
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message : "All fields are required..."});
        }
        const company = await Company.findOne({email});
        if(!company){
            return res.status(404).json({
                message : "Company not found."
            })
        }
        const isValid = company.validatePassword(password);
        if(!isValid){
            return res.status(401).json({message:"Invalid credentials"});
        }
        const accessToken = jwt.sign({
            id:company._id
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn:'15m'
        })

        const refreshToken = jwt.sign({
            id:company._id
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn:'7d'
        });

        company.refreshToken = refreshToken;
        await company.save();

        res.cookie("refreshToken",refreshToken,{
            httpOnly : true,
            secure:false,
            sameSite:"lax",
            maxAge:7*24*60*60*1000
        });

        res.status(200).json({
            success : true,
            message : "Login successfull",
            accessToken
        });

    }catch(err){
        res.status(500).json({
            success:false,
            message : err.message
        });
    }
}

const refreshAccessToken = async (req,res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({
                message : "No refresh token found"
            });
        }
        
        const decoded = jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);

        const company = await Company.findById(decoded.id);
        
        if(!company){
            return res.status(401).json({
                message : "Comapny not found"
            });
        }

        if(company.refreshToken !== refreshToken){
            return res.status(401).json({
                message : "Invalid refresh token"
            });
        }

        const accessToken = jwt.sign(
            {
            id : company._id
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn : '15m'
            }
        );

        res.json({accessToken});
    }
    catch(err){
        res.status(401).json({
            success : false,
            message : "Invalid refresh token"
        });
    }
}

const postCompanyLogout = async (req,res) => {
    try{
        const refreshToken = req.cookies.refreshToken;

        if(refreshToken){
            const company = await Company.findOne({refreshToken});
            if(company){
                company.refreshToken = null;
                await company.save();
            }
        }

        res.clearCookie("refreshToken");

        res.json({
            success : true,
            message : "Logged out"
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}


module.exports = {
    postCompanyRegister,
    postCompanyLogin,
    refreshAccessToken,
    postCompanyLogout
};