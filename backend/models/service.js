const mongoose = require('mongoose');
const serviceSchema = mongoose.Schema({
    company : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Company',
        required : true
    },
    title : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required :true 
    },
    description : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true 
    },
    location : {
        type : String
    },
    image : {
        type : String
    },
    isAvailable : {
        type : Boolean,
        default : true
    }
},{timestamps:true});

const Service = mongoose.model("Service",serviceSchema);

module.exports = Service;