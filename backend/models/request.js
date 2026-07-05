const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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
        enum : ['pending','inProgress','rejected','resolved','cancelled'],
        default : 'pending'
    },
    description : {
        type : String,
    },
    expectedDate : {
        type : Date,
        default : null,
    },
    address : {
        type : String,
        required : true
    },
    pincode : {
        type : Number,
        required : true
    },
    technicianName : {
        type : String,
        default :  null,
    },
    technicianPhone : {

    },
    technicianRole : {
        type : String,
        default : null
    },
    companyExpectedDate : {
        type : Date,
        default : null
    },
    consumerNote : {
        type : String,
        default : null
    }
    

},{timestamps:true});

const Request = mongoose.model("Request",requestSchema);

module.exports = Request;