const Notification = require('../../models/notification');

const getNotifications = async (req,res) => {
    try{
        const notifications = await Notification.find({
            company : req.company._id,
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

const getNotificationDetail = async (req,res) => {
    try{
        const {notId} = req.params;
        const notification = await Notification.findById(notId);
        if(!notification){
            return res.status(404).json({
                message : "notification not found"
            });
        }
        if(notification.company?.toString() !== req.company._id.toString()){
            return res.status(403).json({ message: "Forbidden" });
        }
        if(notification.isRead == false){
            notification.isRead = true;
            await notification.save();
        }
        res.status(200).json({
            notification
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }  
}


module.exports = {
    getNotifications,
    getUnreadNotifications,
    getNotificationDetail
}