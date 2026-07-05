const Notification = require('../../models/notification');

const getNotifications = async (req,res) => {
    try{
        const notifications = await Notification.find({
            consumer : req.consumer._id,
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



module.exports = {
    getNotifications,
    getUnreadNotifications,
    patchMarkNotificationRead
}