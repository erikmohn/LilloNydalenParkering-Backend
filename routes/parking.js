var ParkingUser = require('../models/user');
var ParkingRequest = require('../models/parkingrequest');
var Pusher = require('pusher');

exports.push = function(req, res) {

	var pusher = new Pusher({
	  appId: '323709',
	  key: 'b3268785e53213585357',
	  secret: '0e34a2e3fdc069b66f01',
	  cluster: 'eu',
	  encrypted: true
	});

	pusher.trigger('my-channel', 'my-event', {
	  "message": "hello world"
	});

	res.json("Result of push");
}

exports.requestParking =  function(req, res) {
	ParkingUser.findOne({ '_id': req.body.userId }, function(err, user) {
        if (err) {
            res.send(err);
        } else {
		    var parking = new ParkingRequest();
		    parking.requestUser = user;
		    parking.regNr = req.body.regNr;
		    parking.startTime = req.body.starTime;
		    parking.endTime = req.body.endTime;
		    parking.phoneNumber = req.body.phoneNumber;
		    parking.answered = false;
		    parking.canceled = false;        	
		    parking.save(function(err) {
        		if(err) {
            		res.send(err);
        		} else {
	        		res.json({ 
	                    message: 'Parking request saved!',
	                    request: parking 
	                });
        		}
        	});
		   } 
	});
};

exports.offerParking =  function(req, res) {
	ParkingUser.findOne({'_id': req.body.offerUserId }, function(err, user) {
	        if (err) {
	        	res.send(err);
	        } else {
	        	ParkingRequest.findOne({'_id': req.body.parkingId}, function(err, parking) {

	        		if (err) {
        				res.status(500).send(err);
        			} else {
        				parking.answered = true;
        				parking.offerParkingUser = user;
        				parking.parkingLot = req.body.parkingLot;
        				parking.save(function (err, updatedParking) {
				            if (err) {
				                res.status(500).send(err)
				            }
				            res.send(updatedParking);
				        });
        			}
	        	});
	        }
	    });
	};   

exports.getValidRequestForUser = function(req, res) {
    ParkingUser.findOne({ '_id' : req.params.userId }, function(err, user) {
        if (err) {
           return res.send(err);
        } else {
			ParkingRequest.find({
				'requestUser': user,
				'canceled': false
			}).populate("offerParkingUser").exec(function(err, parking) {
			        if (err) {
			            res.send(err);
			        } else {
			        	res.json(parking);	
			        }
			    });
        }
    });
};

exports.cancleParking = function(req, res) {
	ParkingRequest.findOne({'_id': req.body.parkingId}, function(err, parking) {
		if (err) {
			res.status(500).send(err);
		} else {
			parking.canceled = true;
			parking.save(function (err, updatedParking) {
	            if (err) {
	                res.status(500).send(err)
	            }
	            res.send(updatedParking);
	        });
		}
	});

};

exports.getValidRequests =  function(req, res) {
        ParkingRequest.find({
        			'canceled':false,
        			'answered':false
        	}).populate("requestUser").exec(function(err, parkingRequests) {
            if (err)
                res.send(err);
            res.json(parkingRequests);
        });
};

exports.getParkingById = function(req, res) {
ParkingRequest.findOne({
        			'_id': req.body.parkingId,
        	}).populate("requestUser")
			.populate("offerParkingUser")
			.exec(function(err, parkingRequests) {
            if (err)
                res.send(err);
            res.json(parkingRequests);
        });
};