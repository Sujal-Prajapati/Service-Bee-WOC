const express = require('express');

const consumerRouter = express.Router();

const consumerAuth = require('../controllers/consumer/consumerAuthController');

const consumerService =  require('../controllers/consumer/consumerServiceController');

const consumerComplaint = require('../controllers/consumer/consumerComplaintController');

const authConsumer = require('../middlewares/authConsumer');



consumerRouter.post('/register',consumerAuth.postConsumerRegister);

consumerRouter.post('/login',consumerAuth.postConsumerLogin);

consumerRouter.post('/logout',authConsumer,consumerAuth.postConsumerLogout);

consumerRouter.post('/refresh-token',authConsumer,consumerAuth.refreshAccessToken);

consumerRouter.get('/service',authConsumer,consumerService.getConsumerServices);

consumerRouter.put('/service/:id',authConsumer,consumerService.getServiceDetail);

consumerRouter.post('/complaint/:serviceId',authConsumer,consumerComplaint.postAddComplaint);

consumerRouter.get('/complaint',authConsumer,consumerComplaint.getAllComplaints);

consumerRouter.put('/complaint/delete/:compId',authConsumer,consumerComplaint.deleteConsumerComplaint);

module.exports = consumerRouter;