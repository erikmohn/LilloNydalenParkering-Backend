var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationTokenSchema = new Schema({
	device: String,
	pushToken: String
});

module.exports = mongoose.model('NotificationToken', NotificationTokenSchema);