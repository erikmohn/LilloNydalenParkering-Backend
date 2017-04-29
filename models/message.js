var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
	sender: {
        type: Schema.Types.ObjectId,
        ref: 'ParkingUser'
    },
    date: Date,
	message: String
});

module.exports = mongoose.model('Message', MessageSchema);