const Service = require('../../models/service');
const Request = require('../../models/request')
const Consumer = require('../../models/consumer');

const { createConsumerNotification } = require("../../services/notificationService");
const Notification = require('../../models/notification');


const getCompanyRequests = async (req, res) => {
    try {
        const { status, search, page = 1 } = req.query;
        const limit = 50;
        const skip = (page - 1) * limit;

        const filter = { company: req.company._id };

        if (status && status !== 'all') {
            const statusMap = {
                'pending': 'pending',
                'inProgress': 'inProgress',
                'resolved': 'resolved',
                'rejected': 'rejected'
            };
            const mapped = statusMap[status];
            if (mapped) filter.status = mapped;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const matchingConsumers = await Consumer.find({
                name: { $regex: searchRegex }
            }).select('_id').lean();
            const consumerIds = matchingConsumers.map(c => c._id);

            const orConditions = [
                { description: { $regex: searchRegex } },
                { address: { $regex: searchRegex } }
            ];
            if (consumerIds.length) {
                orConditions.push({ consumer: { $in: consumerIds } });
            }
            filter.$or = orConditions;
        }

        const total = await Request.countDocuments(filter);

        const statusCounts = await Request.aggregate([
            { $match: { company: req.company._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const counts = {
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0
        };
        statusCounts.forEach(item => {
            counts.total += item.count;
            const key = item._id === 'inProgress' ? 'inProgress' : item._id;
            counts[key] = item.count;
        });

        const requests = await Request.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('service')
            .populate('consumer');

        res.status(200).json({
            success: true,
            requests,
            total,          
            counts          
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

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

        await Notification.updateMany({
            request : compId,
            recipientTpye : 'company',
            company : req.company._id,
            isRead : false
        },{
            $set : {isRead : true}
        });

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