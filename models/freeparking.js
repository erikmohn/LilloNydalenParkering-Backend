var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FreeParkingSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'ParkingUser'
    },
    parkingRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'ParkingRequest'
    }],
    parkingSpace: String,
    startTime: Date,
    endTime: Date,
    canceled: Boolean,
    registred: Date,
    responseMessage: String
});

module.exports = mongoose.model('FreeParking', FreeParkingSchema);