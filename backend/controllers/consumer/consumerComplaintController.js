const Service = require('../../models/service');
const Complaint = require('../../models/complaint');

const getAllComplaints = async (req,res)=>{
    try{
        const complaints = await Complaint.find({consumer : req.consumer._id})
            .populate('service')
            .populate('company')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success : true,
            complaints
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
    
}

const postAddComplaint = async (req,res)=>{
    try{
        const {serviceId} = req.params;
        const {description,address,pincode} = req.body;

        if(!address || !pincode){
            return res.status(400).json({
                message : "Address and pincode are required."
            })
        }

        const service = await Service.findById(serviceId);

        if(!service){
            return res.status(404).json({
                message : "Service not found",
            });
        }
        const existingComplaint = await Complaint.findOne({
            consumer : req.consumer._id,
            service : service.id,
            status : 'pending',
            address
        });

        if(existingComplaint){
            return res.status(400).json({
                message : "Complaint already exist"
            });
        }

        const complaint = await Complaint.create({
            consumer : req.consumer._id,
            company : service.company,
            service : serviceId,
            description,
            address,
            pincode
        });

        res.status(201).json({
            success : true,
            message : "Complaint regestered successfully",
            complaint
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

const deleteConsumerComplaint = async (req,res)=>{
    try{
        const {compId}  = req.params;
        const complaint = await Complaint.findById(compId);

        if(!complaint){
            return res.status(404).json({
                message : "Complaint not found"
            })
        }

        if(complaint.consumer.toString() !== req.consumer._id.toString()){
            return res.status(403).json({
                success : false,
                message : "Forbidden"
            })
        }

        await Complaint.findOneAndDelete({
            _id:compId,
            consumer : req.consumer._id
        });

        res.status(200).json({
            success : true,
            message : "Complaint deleted successfully"
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}



module.exports ={
    postAddComplaint,
    getAllComplaints,
    deleteConsumerComplaint
}