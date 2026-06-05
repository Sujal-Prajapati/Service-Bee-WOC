const Service = require('../../models/service');

const getConsumerServices = async (req,res)=>{
    try{
        const services = await Service.find().populate('company','name');
        res.status(200).json({
            success:true,
            services
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }   
}

const getServiceDetail = async (req,res)=>{
    try{
        const {id} = req.params;
        const existingService = await Service.findById(id);
        if(!existingService){
            return res.status(404).json({
                message : "Service does not exist..."
            });
        }

        res.status(200).json({
            success : true,
            existingService
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }

}

module.exports={
    getConsumerServices,
    getServiceDetail
}