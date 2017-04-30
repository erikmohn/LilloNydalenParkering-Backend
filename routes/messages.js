var MessageThread = require('../models/messagethread');
var Message = require('../models/message');

exports.getMessageThread = function(req, res) {
	MessageThread.findOne({
		'_id': req.params.threadId
	})
	.populate('messages')
	.populate('sender')
	.exec(function(err, messageThread) {
		if (err)
			return res.send(err);
		res.json(messageThread.messages);
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
			newMessage.save(function(err, savedMessage) {
				if (err) {
					return res.send(err);
				}
				messageThread.messages.push(savedMessage);
				messageThread.save(function(err, savedMessageThread) {
					if (err) {
						return res.send(err);
					}

					//TODO Implement pusher for message Thread update

					return res.send({
						result: "Message sendt!"
					});
				});
			});


			res.json(user);
		});
	});
}