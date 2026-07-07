const Service = require('../../models/service');
const Request = require('../../models/request');
const Notification = require('../../models/notification');
const {createCompanyNotification} = require('../../services/notificationService');

const getAllRequests = async (req,res)=>{
    try{
        const requests = await Request.find({consumer : req.consumer._id})
            .populate('service')
            .populate('company')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success : true,
            requests
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
    
}

const postAddRequest = async (req,res)=>{
    // console.log(req.body);
    // throw new Error("Controller reached");
    try{
        const {serviceId} = req.params;
        const {description,expectedDate,address,pincode} = req.body;

        if(!address || !pincode || !expectedDate){
            return res.status(400).json({
                message : "Address and pincode are required."
            });
        }
        
        const service = await Service.findById(serviceId);

        if(!service){
            return res.status(404).json({
                message : "Service not found",
            });
        }
        const existingRequest = await Request.findOne({
            consumer : req.consumer._id,
            service : service.id,
            status : 'pending',
            address,
            pincode,
            expectedDate,
        });

        if(existingRequest){
            return res.status(400).json({
                message : "Request already exists"
            });
        }

        const request = await Request.create({
            consumer : req.consumer._id,
            company : service.company,
            service : serviceId,
            description,
            expectedDate,
            address,
            pincode
        });

        await createCompanyNotification(
            {...request.toObject(),
            consumerName : req.consumer?.name
        });

        console.log(request);
        res.status(201).json({
            success : true,
            message : "Request regestered successfully",
            request
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

const deleteConsumerRequest = async (req,res)=>{
    try{
        const {requestId}  = req.params;
        const request = await Request.findById(requestId);

        if(!request){
            return res.status(404).json({
                message : "Request not found"
            })
        }

        if(request.consumer.toString() !== req.consumer._id.toString()){
            return res.status(403).json({
                success : false,
                message : "Forbidden"
            })
        }

        if(request.status=='inProgress'){
            return res.status(409).json({
                message : "request cannot be deleted after being accepted"
            })
        }

        await Request.findOneAndDelete({
            _id:requestId,
            consumer : req.consumer._id
        });

        

        res.status(200).json({
            success : true,
            message : "Request deleted successfully"
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

const getConsumerRequestDetail = async (req,res) => {
    try{
        const {requestId} = req.params;
        const request = await Request.findById(requestId);
        if(!request){
            return res.status(404).json({
                message : "Request not found"
            });
        }

        await Notification.updateMany({
            request : requestId,
            consumer : req.consumer._id,
            recipientType : 'consumer',
            isRead : false
        },{
            $set : {isRead : true}
        });

        console.log(request);
        res.status(200).json({
            success : true,
            request
        });

    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

module.exports ={
    postAddRequest,
    getAllRequests,
    deleteConsumerRequest,
    getConsumerRequestDetail
}