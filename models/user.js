var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	firstName: String,
	lastName: String,
	phoneNumber: String,
	parkingSpace: String,
	regnr: String,
	epost: String,
	hasParkingspace: Boolean,
	needsParkingspace: Boolean,
	wantsPush: Boolean,
	pushToken: String,
	password: String,
	activated: Boolean
});

module.exports = mongoose.model('ParkingUser', UserSchema);