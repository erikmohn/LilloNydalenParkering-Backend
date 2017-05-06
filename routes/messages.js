var MessageThread = require('../models/messagethread');
var Message = require('../models/message');
var Pusher = require('pusher');
var ParkingUser = require('../models/user');

var pusher = new Pusher({
	appId: '323709',
	key: 'b3268785e53213585357',
	secret: '0e34a2e3fdc069b66f01',
	cluster: 'eu',
	encrypted: true
});

exports.getMessageThread = function(req, res) {
	Message.find({
			'messageThread': req.params.threadId
		})
		.populate('sender')
		.sort({
			date: 'asc'
		})
		.exec(function(err, messages) {
			if (err)
				return res.send(err);
			res.json(messages);
		});
};

exports.getNumberOfMessages = function(req, res) {
	Message.find({
			'messageThread': req.params.threadId
		})
		.exec(function(err, messages) {
			if (err)
				return res.send(err);
			res.json({
				numberOfMessages: messages.length,
				id: req.params.threadId
			});
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
				pusher.trigger("MESSAGE-" + req.body.threadId, 'newMessage', {
					"newMessage": savedMessage._id,
					"id": req.body.threadId
				});

				return res.send({
					result: "Message sendt!",
				});
			});
		});
	});
}