var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageThreadSchema = new Schema({
	messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }]
});

module.exports = mongoose.model('MessageThread', MessageThreadSchema);