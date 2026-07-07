const Review = require('../../models/review');
const Request = require('../../models/request');

const postCreateServiceReview = async (req,res) => {
    try{
        const {reqId} = req.params;
        const {rating,comment} = req.body;
        const request = await Request.findById(reqId);
        if(!request){
            return res.status(404),json({
                message : "Request not found"
            });
        }
        
        if(req.consumer._id.toString()!==request.consumer.toString()){
            return res.status(403).json({
                message : "You cannot review not this request"
            });
        }

        if(request.status!=="resolved"){
            return res.status(400).json({
                message : "You can only review resolved request"
            });
        }

        const existingReview = await Review.findOne({
            request : reqId,
            consumer : req.consumer._id
        });

        if(existingReview){
            return res.status(400).json({
                message : "You hve already reviewed this request"
            });
        }

        const review = await Review.create({
            consumer : req.consumer._id,
            company : request.company,
            service : request.service,
            request: reqId,
            rating,
            comment
        });

        return res.status(201).json({
            success : true,
            message : "Review Created seccessfully.",
            review
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

const getRequestReview = async (req,res) => {
    try{
        const {reqId} = req.params;
        const review = await Review.findOne({
            request : reqId,
            consumer : req.consumer._id
        });
        // if(!review){
        //     return res.status(404).json({
        //         message : "Review not found"
        //     });
        // }
        res.status(200).json({
            review
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}

module.exports= {
    postCreateServiceReview,
    getRequestReview
}