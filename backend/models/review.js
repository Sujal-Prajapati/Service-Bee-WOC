const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    consumer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Consumer",
        required : true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      unique: true
    },
    rating : {
        type : Number,
        required : true,
        min : 1,
        max : 5
    },
    comment : {
        type : String,
        trim : true,
        defaullt : ""
    }
},{timestamps : true});

const Review = mongoose.model("Review",reviewSchema); 

module.exports = Review;