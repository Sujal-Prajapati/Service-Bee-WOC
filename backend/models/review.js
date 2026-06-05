const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    consumer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Consumer",
        required : true
    },
    service : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Service",
        required : true
    },
    rating : {
        type : Number,
        min : 1,
        max : 5

    },
    review : {
        type : String,
        trim : true
    }
},{timestamps : true});

const Review = mongoose.model("Review",reviewSchema); 

module.exports = Review;