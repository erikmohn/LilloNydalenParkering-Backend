var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema = new Schema({
    userName: String,
    password: String,
    phoneNumber: String,
    parkingSpace: String,
    regnr: String,
    epost: String, 
    devicePushId: String,
    activated: Boolean
});

module.exports = mongoose.model('ParkingUser', UserSchema);