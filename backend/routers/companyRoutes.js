const express = require('express');
const authCompany = require('../middlewares/authComapny');

const companyRouter = express.Router();
const CompanyService = require('../controllers/company/companyServiceController');

const companyAuth = require('../controllers/company/companyAuthController');

const companyComplaint = require('../controllers/company/companyComplaintController');

companyRouter.post('/register',companyAuth.postCompanyRegister);
companyRouter.post('/login',companyAuth.postCompanyLogin);
companyRouter.post('/service/add',authCompany,CompanyService.postAddService);
companyRouter.put('/service/:id',authCompany,CompanyService.postEditService);

companyRouter.get('/service',authCompany,CompanyService.getCompanyServices);

companyRouter.post('/service/delete/:id',authCompany,CompanyService.postDeleteService);

companyRouter.get('/complaint',authCompany,
companyComplaint.getCompanyComplaints);

companyRouter.patch('/complaint/:compId',authCompany,
companyComplaint.patchUpdateComplaintStatus);

companyRouter.post('/refresh-token',authCompany,companyAuth.refreshAccessToken);

companyRouter.post('/logout',
    authCompany,companyAuth.postCompanyLogout
)

module.exports = companyRouter;