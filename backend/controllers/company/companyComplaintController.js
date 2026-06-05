const Service = require('../../models/service');
const Complaint = require('../../models/complaint');

const getCompanyComplaints = async (req,res)=>{
    try{
        const complaints = await Complaint.find({
            company : req.company._id
        }).populate('service').populate('consumer').sort({
            createdAt : -1
        });

        res.status(200).json({
            success : true,
            complaints
        })
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }

}

const patchUpdateComplaintStatus = async (req,res)=>{
    try{
        const {compId} = req.params;
        const {status} = req.body;

        const allowedStatus = ['pending','accepted','rejected','completed'];

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                success : false,
                message : "Invalid status"
            });
        }

        const complaint = await Complaint.findById(compId);

        if(!complaint){
            return res.status(404).json({
                success : false,
                message : "Complaint not found"
            });
        }

        if(req.company._id.toString()!==complaint.company.toString()){
            return res.status(403).json({
                success : false,
                message : "Forbidden"
            });
        }

        complaint.status = status;

        await complaint.save();
        res.status(200).json({
            success : true,
            message : "Status updated successfully"
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
    getCompanyComplaints,
    patchUpdateComplaintStatus
}