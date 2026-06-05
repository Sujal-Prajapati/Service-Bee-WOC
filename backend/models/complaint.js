const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    consumer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Consumer',
        required : true
    },
    company : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Company',
        required : true
    },
    service : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Service',
        required : true
    },
    status : {
        type : String,
        enum : ['pending','accepted','rejected','completed'],
        default : 'pending'
    },
    description : {
        type : String,
    },
    address : {
        type : String,
        required : true
    },
    pincode : {
        type : Number,
        required : true
    }
},{timestamps:true});

const Complaint = mongoose.model("Complaint",complaintSchema);

module.exports = Complaint;