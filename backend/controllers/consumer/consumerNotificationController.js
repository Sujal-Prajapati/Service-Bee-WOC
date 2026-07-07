const Notification = require('../../models/notification');

const getNotifications = async (req,res) => {
    try{
        const notifications = await Notification.find({
            consumer : req.consumer._id,
            recipientType : 'consumer',
        });
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
            consumer : req.consumer._id,
            recipientType : 'consumer',
            isRead : false
        });
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

const patchMarkNotificationRead = async (req,res) => {
    try{
        const {notId} = req.params;
        const notification = await Notification.findOneAndUpdate({
            _id : notId,
            recipientType : 'consumer',
            consumer : req.consumer._id
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
        
        const notification = await Notification.updateMany({
            recipientType : 'consumer',
            consumer : req.consumer._id,
            isead : false
        },{
            $set : {isRead : true}
        },{
            new:true
        });

        if(!notification){
            return res.status(404).json({
                message : "All Notifications are already marked as read"
            });
        } 

        res.status(200).json({
            sucess : true,
            message : "All Notifications are maked as read"
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
    patchMarkNotificationRead,
    patchMarkAllNotificationRead
}