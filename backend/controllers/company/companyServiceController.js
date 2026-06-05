const Service = require('../../models/service');
const Company = require('../../models/company');
const postAddService = async (req,res)=>{
    try{
        const {company,title,category,description,price,location,image,isAvailable} = req.body;
        
        if(!company || !title || !category || !description || !price){
            return res.status
            (400).json({message : "Fill all required fields"});
        }

        const existingCompany = await Company.findById(company);
        if(!existingCompany){
            return res.status(404).json({message : "Company not found"});
        }

        const newService = Service.create({
            company,
            title,
            category,
            description,
            price,
            location,
            image,
            isAvailable,
        });

        res.status(201).json({
            success : true,
            message : "Service added successfully"
        });
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        });
    }

};


const postEditService = async (req,res)=>{
    try{
        const {id} = req.params;
        const {
            title,
            category,
            description,
            price,
            location,
            image,
            isAvailable
        } = req.body;

        var existingService = await Service.findById(id);
        if(!existingService){
            return res.status(404).json({
                message:"Service not found"
            });
        }
        existingService.title = title || existingService.title;
        existingService.category = category || existingService.category;
        existingService.description = description || existingService.description;
        existingService.price = price || existingService.price;
        existingService.location = location || existingService.location;
        existingService.image = image || existingService.image;
        existingService.isAvailable = isAvailable || existingService.isAvailable;

        await existingService.save();

        res.status(200).json({
            success : true,
            message : "Service updated successfuly.",
            existingService
        });

    }
    catch(err){
        res.status(500).json({
            seccess:true,
            message: err.message
        });
    }
}

const postDeleteService = async (req,res)=>{
    try{
        const {id} = req.params;
        

        var existingService = await Service.findById(id);
        if(!existingService){
            return res.status(404).json({
                message:"Service not found"
            });
        }
        if(existingService.company.toString() !== req.company._id.toString()){
            return res.status(403).json({message:"Unauthorized"});
        }

        await Service.findByIdAndDelete(id);

        res.status(200).json({
            success : true,
            message : "Service deleted successfuly.",
            existingService
        });

    }
    catch(err){
        res.status(500).json({
            seccess:true,
            message: err.message
        });
    }
}


const getCompanyServices = async (req,res)=>{
    try{
        const services = await Service.find({company : req.company._id});
        res.json({
            success:true,
            services
        })
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}


module.exports = {
    postAddService,
    postEditService,
    getCompanyServices,
    postDeleteService
};