const Consumer = require("../../models/consumer");
const jwt = require('jsonwebtoken');

const postConsumerRegister= async (req,res)=>{
    try{
        const {name,email,phone,password} = req.body;
        if(!name || !email || !phone || !password){
            return res.status(400).json({message : "All fields are required"});
        }

        const isExist = await Consumer.findOne({email});
        if(isExist){
            return res.status(409).json({
                message : "email already exist"
            });
        }

        const newConsumer = await Consumer({
            name,
            email,
            phone,
        })
        
        newConsumer.setPassword(password);
        
        

        const accessToken = jwt.sign({
            id : newConsumer._id,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn : '15m'
        });

        const refreshToken = jwt.sign({
            id : newConsumer._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn : '7d'
        });

        newConsumer.refreshToken = refreshToken;
        await newConsumer.save();

        res.cookie("refreshToken",refreshToken,{
            httpOnly : true,
            secure:false,
            sameSite:"lax",
            maxAge:7*24*60*60*1000
        });

        const newConsumerData = newConsumer.toObject();

        delete newConsumer.salt;
        delete newConsumer.hash;
        delete newConsumer.refreshToken;

        res.status(201).json({
            success : true,
            message : "Consume registered successfully",
            newConsumerData,
            accessToken
        });

    }catch (error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

const postConsumerLogin = async (req,res)=>{
    try{
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message : "All fields are required..."});
        }
        const consumer = await Consumer.findOne({email});

        if(!consumer){
            return res.status(404).json({
                message : "Consumer not found."
            })
        }

        const isValid = await consumer.validatePassword(password);

        if(!isValid){
            return res.status(401).json({message:"Invalid credentials"});
        }

        const accessToken = jwt.sign({
            id : consumer._id,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn : '15m'
        });

        const refreshToken = jwt.sign({
            id : consumer._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn : '7d'
        });

        res.cookie("refreshToken",refreshToken,{
            httpOnly : true,
            secure:false,
            sameSite:"lax",
            maxAge:7*24*60*60*1000
        });

        consumer.refreshToken = refreshToken;
        await consumer.save();

        const consumerData = consumer.toObject();

        delete consumerData.hash;
        delete consumerData.salt;

        res.status(200).json({
            success : true,
            message : "Login successfull",
            consumerData,
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
                meessage : "Invalid refeshToken"
            });
        }

        const decoded = jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);

        const consumer = await Consumer.findById(decode.id);

        if(!consumer){
            return res.status(401).json({
                message : "Consumer not found"
            });
        }

        if(consumer.refreshToken !== refreshToken){
            return res.status(401).json({
                message : "Invalid refresh token"
            });
        }

        const accessToken = jwt.sign(
            {
                id : consumer._id
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn : "15m"
            }
        );

        res.json(accessToken);
    }
    catch(err){
        res.status(401).json({
            message : "Invalid token"
        });
    }
}

const postConsumerLogout = async (req,res) => {
    const refreshToken = req.cookies.refreToken;

    if(refreshToken){
        const consumer = Consumer.findOne({refreshToken});
        if(cousmer){
            consumer.refreshToken = null;
            await consumer.save();
        }
    }
    res.clearCookie("refreshToken");
    res.json({
        success : true,
        message : "Logged Out"
    });
}


module.exports = {
    postConsumerRegister,
    postConsumerLogin,
    refreshAccessToken,
    postConsumerLogout
};