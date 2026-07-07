const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    consumer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Consumer",
        required : true
    },
    company : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Company",
        required : false
    },
    recipientType: {
        type: String,
        enum: ['consumer', 'company'],
        required: true,
    },
    request : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Request",
        required : true
    },
    // type : {
    //     type : String,
    //     enum : ['status_update','new_request','review_received','technician_assigned','request_accepted'],
    //     default : 'status_update'
    // },
    title : {
        type : String,
        // required : true
    },
    message : {
        type : String,
        // required : true
    },
    isRead : {
        type : Boolean,
        default : false
    }
},{timestamps : true});

const Notification = mongoose.model("Notification",notificationSchema);

module.exports = Notification;