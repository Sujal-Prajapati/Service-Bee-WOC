const Service = require('../../models/service');
const Request = require('../../models/request');
const { createConsumerNotification } = require("../../services/notificationService");


const getCompanyRequests = async (req,res)=>{
    try{
        const requests = await Request.find({
            company : req.company._id
        }).populate('service').populate('consumer').sort({
            createdAt : -1
        });

        res.status(200).json({
            success : true,
            requests
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }

}

const getRequestDetail = async (req,res)=>{
    try{
        const {compId} = req.params;
        const request = await Request.findById(compId).populate('service').populate('consumer');
        if(!request){
            return res.status(404).json({
                message : "Request not found"
            });
        }
        if(request.company.toString() !==req.company._id.toString()){
            return res.status(403).json({message:"Unauthorized"});
        }

        res.status(200).json({
            request
        });
    }
    catch(err){
        res.status(500).json({
            message : err.message
        })
    }
}

const patchUpdateRequestStatus = async (req,res)=>{
    try{
        const {compId} = req.params;
        const {status,technicianName,
        technicianPhone,
        technicianRole,
        companyExpectedDate,
        companyNote} = req.body;

        const allowedStatus = ['pending','inProgress','rejected','resolved','cancelled'];

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                success : false,
                message : "Invalid status"
            });
        }

        const request = await Request.findById(compId);
        // console.log(request);
        if(!request){
            return res.status(404).json({
                success : false,
                message : "Request not found"
            });
        }

        if(req.company._id.toString()!==request.company.toString()){
            return res.status(403).json({
                success : false,
                message : "Forbidden"
            });
        }

        if(status == request.status){
            return res.status(409).json({
                message : "Status is already set"
            });
        }

        if((request.status=='pending' && (status=='rejected' || status=='inProgress')) || (request.status=='inProgress' && (status=='resolved' || status=='cancelled'))){
            if(status=='inProgress'){
                const now = new Date();
                if(!companyExpectedDate || new Date(companyExpectedDate) < now || !technicianName || !technicianPhone || !technicianRole){
                    return res.json({
                        message : "expected date is invalid"
                    });
                }

                request.companyExpectedDate = companyExpectedDate;
                request.technicianName = technicianName;
                request.technicianPhone = technicianPhone;
                request.technicianRole = technicianRole;
                request.companyNote = companyNote;
            }
            request.status = status;
            await request.save();

            await createConsumerNotification({
                ...request.toObject(),
                companyName: req.company?.name,
            });

            return res.status(200).json({
                success : true,
                message : "Status updated successfully",
                request
            });
        }

        return res.status(409).json({  
            success : false,
            message : "Status cannot be updated to the state"
        });

    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}



module.exports = {
    getCompanyRequests,
    getRequestDetail,
    patchUpdateRequestStatus
}