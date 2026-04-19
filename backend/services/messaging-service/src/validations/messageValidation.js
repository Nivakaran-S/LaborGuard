const Joi = require('joi');

exports.messageSchema = Joi.object({
    senderId: Joi.string().required(),
    receiverId: Joi.string().required(),
    complaintId: Joi.string().optional(),
    type: Joi.string().valid('TEXT', 'IMAGE', 'STICKER').required(),
    content: Joi.when('type', {
        is: 'TEXT',
        then: Joi.string().min(1).required(),
        otherwise: Joi.optional()
    })
});