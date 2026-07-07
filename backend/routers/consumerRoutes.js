const express = require('express');

const consumerRouter = express.Router();

const consumerAuth = require('../controllers/consumer/consumerAuthController');

const consumerService =  require('../controllers/consumer/consumerServiceController');

const consumerRequest = require('../controllers/consumer/consumerRequestController');

const consumerNotification = require('../controllers/consumer/consumerNotificationController');

const consumerReview = require('../controllers/consumer/consumerReviewController')

const authConsumer = require('../middlewares/authConsumer');



consumerRouter.post('/register',consumerAuth.postConsumerRegister);

consumerRouter.post('/login',consumerAuth.postConsumerLogin);

consumerRouter.post('/logout',authConsumer,consumerAuth.postConsumerLogout);

consumerRouter.post('/refresh-token',authConsumer,consumerAuth.refreshAccessToken);

consumerRouter.get('/service',authConsumer,consumerService.getConsumerServices);

consumerRouter.get('/service/:id',authConsumer,consumerService.getServiceDetail);

consumerRouter.post('/request/:serviceId',authConsumer,consumerRequest.postAddRequest);

consumerRouter.get('/request',authConsumer,consumerRequest.getAllRequests);

consumerRouter.get('/request/:requestId',authConsumer,consumerRequest.getConsumerRequestDetail);

consumerRouter.put('/request/delete/:requestId',authConsumer,consumerRequest.deleteConsumerRequest);

consumerRouter.get('/notification',authConsumer,consumerNotification.getNotifications);

consumerRouter.get('/notification/unread',authConsumer,consumerNotification.getUnreadNotifications);

consumerRouter.patch('/notification/:notId/read',authConsumer,consumerNotification.patchMarkNotificationRead);



// consumerRouter.get('/notification/:notId',authConsumer,consumerNotification.getNotificationDetail);

consumerRouter.patch('/notification/read-all',authConsumer,consumerNotification.patchMarkAllNotificationRead);

consumerRouter.post('/review/:reqId',authConsumer,consumerReview.postCreateServiceReview);

consumerRouter.post('/review/request/:reqId',authConsumer,consumerReview.getRequestReview);


module.exports = consumerRouter;