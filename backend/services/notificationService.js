// services/notification.service.js

const Notification = require("../models/notification");

const createConsumerNotification = async (request) => {
    const status = request.status;
    const receiver = request.consumer;
    const requestId = request._id || request.id;
    let title = "Request update";
    let message = "Your request status has changed.";
    let type = 'status_update';

    switch (status) {
        case 'rejected':
            // title = 'Request Rejected';
            message = `${request.companyName || request.company || 'The company'} has rejected your request. Please open your request for details.`;
            type = 'status_update';
            break;
        case 'inProgress':
            // title = 'Request Accepted';
            message = `${request.companyName || request.company || 'The company'} has accepted your request and assigned a technician. Please check your request for details.`;
            type = 'request_accepted';
            break;
        case 'resolved':
            // title = 'Request Resolved';
            message = `${request.companyName || request.company || 'The company'} has marked your request as resolved. Please review the service.`;
            type = 'status_update';
            break;
        case 'cancelled':
            // title = 'Request Cancelled';
            message = `${request.companyName || request.company || 'The company'} has cancelled your request. Please open your request for details.`;
            type = 'status_update';
            break;
        default:
            // title = 'Request Updated';
            message = `${request.companyName || request.company || 'The company'} has updated your request.`;
    }

    return await Notification.create({
        consumer: receiver,
        company: request.company,
        recipientType : 'consumer',
        request: requestId,
        title,
        message,
        // type,
    });
};

const createCompanyNotification = async (request,consumerName) => {
    return await Notification.create({
        company : request.company,
        consumer : request.consumer,
        recipientType : 'company',
        request : request._id,
        title : "New Service Request",
        message : `You have recieved new request from ${consumerName || 'a consumer'}`
    });
}

module.exports = {  
    createConsumerNotification,
    createCompanyNotification
};