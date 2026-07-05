const express = require('express');
const authCompany = require('../middlewares/authComapny');

const companyRouter = express.Router();
const CompanyService = require('../controllers/company/companyServiceController');

const companyAuth = require('../controllers/company/companyAuthController');

const companyRequest = require('../controllers/company/companyRequestController');
const companyNotification = require('../controllers/company/companyNotificationController');

companyRouter.post('/register',companyAuth.postCompanyRegister);
companyRouter.post('/login',companyAuth.postCompanyLogin);
companyRouter.post('/complaint/add',authCompany,CompanyService.postAddService);
companyRouter.put('/complaint/:id',authCompany,CompanyService.postEditService);

companyRouter.get('/complaint',authCompany,CompanyService.getCompanyServices);

companyRouter.post('/complaint/delete/:id',authCompany,CompanyService.postDeleteService);

companyRouter.get('/request',authCompany,companyRequest.getCompanyRequests);

companyRouter.get('/request/:compId', authCompany,
companyRequest.getRequestDetail);

companyRouter.patch('/request/:compId',authCompany,
companyRequest.patchUpdateRequestStatus);

companyRouter.get('/notification',authCompany,companyNotification.getNotifications);
companyRouter.get('/notification/unread',authCompany,companyNotification.getUnreadNotifications);
companyRouter.get('/notification/:notId',authCompany,companyNotification.getNotificationDetail);

companyRouter.post('/refresh-token',authCompany,companyAuth.refreshAccessToken);

companyRouter.post('/logout',
    authCompany,companyAuth.postCompanyLogout
)

module.exports = companyRouter;