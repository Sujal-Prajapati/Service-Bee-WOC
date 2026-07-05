const jwt = require('jsonwebtoken');
const Consumer = require('../models/consumer');

const authConsumer = async (req,res,next)=>{
    console.log("Auth middleware called");

    try{
        const token = req.headers.authorization.split(" ")[1];
        
        if(!token){
            return res.status(401).json({
                message : "token not found."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        const consumer = await Consumer.findById(decoded.id);

        if(!consumer){
            return res.status(401).json({
                message : "Consumer not found"
            });
        }

        const consumerData = consumer.toObject();
        delete consumerData.hash;
        delete consumerData.salt;

        req.consumer = consumerData;
        next();
    }
    catch(err){
        res.status(401).json({
            message : "Unauthorized"
        });
    }
}

module.exports = authConsumer;