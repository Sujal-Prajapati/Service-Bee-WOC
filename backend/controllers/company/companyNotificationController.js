const Notification = require('../../models/notification');

const getNotifications = async (req,res) => {
    try{
        const notifications = await Notification.find({
            company : req.company._id,
            recipientType : 'company',
        }).sort({ createdAt: -1 });
        res.status(200).json({
            notifications
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

const getUnreadNotifications = async (req,res) => {
    try{
        const notifications = await Notification.find({
            company : req.company._id,
            recipientType : 'company',
            isRead : false
        }).sort({ createdAt: -1 });
        res.status(200).json({
            notifications
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

// const getNotificationDetail = async (req,res) => {
//     try{
//         const {notId} = req.params;
//         const notification = await Notification.findById(notId);
//         if(!notification){
//             return res.status(404).json({
//                 message : "notification not found"
//             });
//         }
//         if(notification.company?.toString() !== req.company._id.toString()){
//             return res.status(403).json({ message: "Forbidden" });
//         }
//         if(notification.isRead == false){
//             notification.isRead = true;
//             await notification.save();
//         }
//         res.status(200).json({
//             notification
//         });
//     }
//     catch(err){
//         res.status(500).json({
//             success : false,
//             message : err.message
//         });
//     }  
// }

const patchMarkNotificationRead = async (req,res) => {
    try{
        const {notId} = req.params;
        const notification = await Notification.findOneAndUpdate({
            _id : notId,
            recipientType : 'company',
            company : req.company._id,
        },{
            $set : {isRead : true}
        },{
            new:true
        });

        if(!notification){
            return res.status(404).json({
                message : "Notification not found"
            });
        } 

        res.status(200).json({
            sucess : true,
            message : "Notification maked as read"
        });
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }

}

const patchMarkAllNotificationRead = async (req,res) => {
    try{
        const notification = await Notification.findOneAndUpdate({
            recipientType : 'company',
            company : req.company._id,
            isRead : false
        },{
            $set : {isRead : true}
        },{
            new:true
        });

        if(!notification){
            return res.status(404).json({
                message : "Notification not found"
            });
        } 

        res.status(200).json({
            sucess : true,
            message : "Notification maked as read"
        });
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }

}




module.exports = {
    getNotifications,
    getUnreadNotifications,
    // getNotificationDetail,
    patchMarkNotificationRead,
    patchMarkAllNotificationRead
}