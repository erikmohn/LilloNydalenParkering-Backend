var MessageThread = require('../models/messagethread');
var Message = require('../models/message');
var ParkingUser = require('../models/user');

exports.getMessageThread = function(req, res) {
	Message.find({
			'messageThread': req.params.threadId
		})
		.populate('sender')
		.exec(function(err, messages) {
			if (err)
				return res.send(err);
			res.json(messages);
		});
};

exports.getMessage = function(req, res) {
	Message.findOne({
			'_id': req.params.messageId
		})
		.populate('sender')
		.exec(function(err, message) {
			if (err)
				return res.send(err);
			res.json(message);
		});
};

exports.postNewMessage = function(req, res) {
	MessageThread.findOne({
		'_id': req.body.threadId
	}, function(err, messageThread) {
		if (err) {
			return res.send(err);
		}
		ParkingUser.findOne({
			'_id': req.body.userId
		}, function(err, user) {
			if (err) {
				return res.send(err);
			}
			var newMessage = new Message();
			newMessage.message = req.body.message;
			newMessage.sender = user;
			newMessage.date = req.body.sendtDate;
			newMessage.messageThread = req.body.threadId
			newMessage.save(function(err, savedMessage) {
				if (err) {
					return res.send(err);
				}
				messageThread.messages.push(savedMessage);
				messageThread.save(function(err, savedMessageThread) {
					if (err) {
						return res.send(err);
					}
					
					pusher.trigger("MESSAGE-" + req.body.threadId, 'newMessage', {
						"newMessage": savedMessage._id
					});

					return res.send({
						result: "Message sendt!"
					});
				});
			});


			res.json(user);
		});
	});
}