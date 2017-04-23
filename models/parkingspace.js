var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ParkingSpaceSchema = new Schema({
	parkingSpace: String
});

module.exports = mongoose.model('ParkingSpace', ParkingSpaceSchema);