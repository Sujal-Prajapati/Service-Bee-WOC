const Review = require('../../models/review');
const Service = require('../../models/service')
const getServiceReview = (req,res)=>{
    try{
        const {serviceId} = req.params;
        const reviews = Review.find({
            company : req.company._id,
            service : serviceId 

        }).sort({createdAt : -1}).populate('consumer','name avatar').lean();

        res.status(200).json({
            reviews
        });
    }
    catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
};


const getRequestReview = async (req,res) => {
    try{
        const {reqId} = req.params;
        const request = await Request.findById(req.Id);
        if(!request){
            return res.status(404).json({
                message : "Request not found"
            });
        }
        if(request.company.toString()!==req.company._id.toString()){
            return res.statu(403).json({
                message : "YOu cannot get this review"
            });
        }

        const review = await Review.findOne({
            request : reqId,
            service : request.service,
            company : request.company
        });

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

const getAllCompanyReviews = async (req, res) => {
  try {
    const companyId = req.company._id;

    const {
      category,
      rating,            
      search,            
      page = 1,          
      limit = 50         
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratingNumber = rating ? parseInt(rating) : null;

    const matchCondition = { company: companyId };

    if (category) {
      const serviceIds = await Service.find({
        company: companyId,
        category: category
      }).distinct('_id');
      matchCondition.service = { $in: serviceIds };
    }

    if (ratingNumber && ratingNumber >= 1 && ratingNumber <= 5) {
      matchCondition.rating = ratingNumber;
    }

    if (search && search.trim().length > 0) {
      matchCondition.comment = { $regex: search.trim(), $options: 'i' };
    }

    const [overallResult] = await Review.aggregate([
      { $match: matchCondition },
      {
        $facet: {
          stats: [{ $group: { _id: null, avgRating: { $avg: "$rating" }, total: { $sum: 1 } } }],
          distribution: [{ $group: { _id: "$rating", count: { $sum: 1 } } }, { $sort: { _id: -1 } }]
        }
      }
    ]);

    const categoryRaw = await Review.aggregate([
      { $match: { company: companyId } },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service.category',
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ]);

    const categoryStats = categoryRaw.map(cat => {
      const distribution = {};
      cat.ratings.forEach(r => { distribution[r] = (distribution[r] || 0) + 1; });
      return {
        category: cat._id,
        avgRating: cat.avgRating,
        total: cat.total,
        distribution: distribution
      };
    });

    const reviews = await Review.find(matchCondition)
      .populate('consumer', 'name')
      .populate('service', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      stats: overallResult.stats[0] || { avgRating: 0, total: 0 },
      overallDistribution: overallResult.distribution || [],
      categoryStats: categoryStats,
      reviews: reviews,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        total: overallResult.stats[0]?.total || 0,
        totalPages: Math.ceil((overallResult.stats[0]?.total || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
    getServiceReview,
    getRequestReview,
    getAllCompanyReviews
}