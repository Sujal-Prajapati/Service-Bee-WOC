const jwt = require('jsonwebtoken');
const Company = require('../models/company');

const authCompany = async (req,res,next)=>{
    try{
        const token = req.headers.authorization.split(" ")[1];
        
        if(!token){
            return res.status(401).json({message:"No token found"});
        }
        const decoded = jwt.verify(token,process.env.JWT_ACCESS_SECRET);

        const company = await Company.findById(decoded.id ).lean();
        
        if(!company){
            return res.status(401).json({message:"Invalid token"});
        }

        // .lean() converts mongoDB object into plain JavaScript object
        
        delete company.hash;
        delete company.salt;

        req.company = company;

        next();
    }
    catch(err){
        res.status(401).json({message:"Unauthorized"});
    }
};

module.exports = authCompany;
