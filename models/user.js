var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	userName: String,
	password: String,
	phoneNumber: String,
	parkingSpace: String,
	regnr: String,
	epost: String,
	activated: Boolean,
	pushToken: String
});

module.exports = mongoose.model('ParkingUser', UserSchema);