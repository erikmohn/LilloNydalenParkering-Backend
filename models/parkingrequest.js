var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ParkeringRequestSchema = new Schema({
    requestUser: [{type: Schema.Types.ObjectId, ref: 'ParkingUser'}],
    offerParkingUser: [{type: Schema.Types.ObjectId, ref: 'ParkingUser'}],
    regNr: String,
    startTime: Date,
    endTime: Date,
    phoneNumber: String,
    answered: Boolean,
    parkingLot: String,
    canceled: Boolean,
    registred: Date
});

module.exports = mongoose.model('ParkingRequest', ParkeringRequestSchema);