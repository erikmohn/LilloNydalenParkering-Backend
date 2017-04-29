var MessageThread = require('../models/messagethread');
var Message = require('../models/message');

exports.getMessageThread = function (req, res) {
    MessageThread.findOne({
        '_id': req.params.threadId
    }, function(err, messageThread) {
        if (err)
            return res.send(err);
        res.json(messageThread.messages);
    });
}