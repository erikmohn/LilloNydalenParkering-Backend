var ParkingUser = require('../models/user');
var ParkingRequest = require('../models/parkingrequest');
var Pusher = require('pusher');
var Pushwoosh = require('pushwoosh-client');
var Moment = require('moment');

var pusher = new Pusher({
	appId: '323709',
	key: 'b3268785e53213585357',
	secret: '0e34a2e3fdc069b66f01',
	cluster: 'eu',
	encrypted: true
});

var ENABLE_PUSH = true;

var PUSH_APP_CODE = "2D52E-A279A";
var PUSH_AUTH_CODE = "10kqID2h62E4Gn4Ax38TifJKxUmZtbtgbUlrQQRDWhVhNH27JqMymGtRXNv1xCbWAOKzlEJa7XZPiS6yB0Bc";


exports.requestParking = function(req, res) {
	ParkingUser.findOne({
		'_id': req.body.userId
	}, function(err, user) {
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
			parking.done = false;
			parking.registredDate = req.body.registredDate
			parking.save(function(err) {
				if (err) {
					res.send(err);
				} else {

					var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);

					String.prototype.capitalizeFirstLetter = function() {
						return this.charAt(0).toUpperCase() + this.slice(1);
					}

					var message = user.userName + " spør etter parkering: \n" +
						"Fra: " + Moment(parking.startTime).locale("nb").format(" dddd HH:mm").capitalizeFirstLetter() + " " +
						"Til: " + Moment(parking.endTime).locale("nb").format(" dddd HH:mm").capitalizeFirstLetter();
					/*
					client.sendMessage(message, function(error, response) {
					     if (error) {
					        console.log('Some error occurs: ', error);
					     }

					     console.log("Push sendt!");
					});
					*/

					pusher.trigger("global-request-channel", 'request-update', {});

					res.json({
						message: 'Parking request saved!',
						request: parking
					});
				}
			});
		}
	});
};

exports.offerParking = function(req, res) {
	ParkingUser.findOne({
		'_id': req.body.offerUserId
	}, function(err, user) {
		if (err) {
			res.send(err);
		} else {
			ParkingRequest.findOne({
					'_id': req.body.parkingId
				})
				.exec(function(err, parking) {
					if (err) {
						res.status(500).send(err);
					} else {
						if (parking.answered) {
							res.send({
								'alreadyAnswered': true
							});
						} else {
							parking.answered = true;
							parking.offerParkingUser = user;
							parking.parkingLot = req.body.parkingLot;
							parking.answeredDate = req.body.answeredDate;
							parking.save(function(err, updatedParking) {
								if (err) {
									res.send(err)
								}

								pusher.trigger("USER-" + updatedParking.requestUser, 'parking-offer', {
									"message": "Update current requests"
								});
								pusher.trigger("global-request-channel", 'request-update', {});

								var pushToken = parking.offerParkingUser[0].pushToken;
								if (ENABLE_PUSH && pushToken) {
									var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);
									client.sendMessage('Du har mottatt et svar på din parkeringsforespørsel', pushToken, function(error, response) {
										if (error) {
											console.log('Some error occurs: ', error);
										}
									});
								}

								res.send(updatedParking);
							});
						}
					}
				});
		}
	});
};

exports.getValidRequestForUser = function(req, res) {
	ParkingUser.findOne({
		'_id': req.params.userId
	}, function(err, user) {
		if (err) {
			return res.send(err);
		} else {
			ParkingRequest
				.find({
					'requestUser': user,
					'canceled': false,
					'done': false
				})
				.populate("offerParkingUser")
				.exec(function(err, parking) {
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
	ParkingRequest
		.findOne({
			'_id': req.body.parkingId
		})
		.populate("offerParkingUser")
		.exec(function(err, parking) {
			if (err) {
				res.status(500).send(err);
			} else {
				parking.canceled = true;
				parking.save(function(err, updatedParking) {
					if (err) {
						res.status(500).send(err)
					}
					pusher.trigger("global-request-channel", 'request-update', {});
					if (ENABLE_PUSH && pushToken) {
						var pushToken = parking.offerParkingUser[0].pushToken;
						var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);
						client.sendMessage('Din utlånte parkering er avbrutt', pushToken, function(error, response) {
							if (error) {
								console.log('Some error occurs: ', error);
							}
						});
					}
					res.send(updatedParking);
				});
			}
		});

};

exports.doneParking = function(req, res) {
	ParkingRequest
		.findOne({
			'_id': req.body.parkingId
		})
		.populate("offerParkingUser")
		.exec(function(err, parking) {
			if (err) {
				res.status(500).send(err);
			} else {
				parking.done = true;
				parking.save(function(err, updatedParking) {
					if (err) {
						res.status(500).send(err)
					}
					pusher.trigger("global-request-channel",
						'request-update', {});
					res.send(updatedParking);
					var pushToken = parking.offerParkingUser[0].pushToken;
					if (ENABLE_PUSH && pushToken) {
						var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);
						client.sendMessage('Din utlånte parkering er ferdigstillt', pushToken, function(error, response) {
							if (error) {
								console.log('Some error occurs: ', error);
							}
						});
					}
				});
			}
		});

};

exports.getValidRequests = function(req, res) {
	ParkingRequest
		.find({
			'canceled': false,
			'answered': false,
			'endTime': {
				$gt: req.body.now
			}
		})
		.populate("requestUser")
		.sort({
			registredDate: 'asc'
		})
		.exec(function(err, parkingRequests) {
			if (err) {
				res.send(err);
			} else {
				res.json(parkingRequests);
			}
		});
};

exports.getParkingById = function(req, res) {
	ParkingRequest
		.findOne({
			'_id': req.body.parkingId
		})
		.populate("requestUser")
		.populate("offerParkingUser")
		.exec(function(err, parkingRequests) {
			if (err)
				res.send(err);
			res.json(parkingRequests);
		});
};

exports.getPastRequests = function(req, res) {
	ParkingUser
		.findOne({
			'_id': req.body.userId
		})
		.exec(function(err, user) {
			if (err) {
				return res.send(err);
			} else {
				ParkingRequest
					.find()
					.and([{
						'requestUser': user
					}, {
						$or: [{
							'canceled': true
						}, {
							'answered': true
						}, {
							'done': true
						}]
					}])
					.populate("requestUser")
					.populate("offerParkingUser")
					.sort({
						registredDate: 'desc'
					})
					.exec(function(err, parking) {
						if (err) {
							res.send(err);
						} else {
							res.json(parking);
						}
					});
			}
		});
};

exports.getPastOffers = function(req, res) {
	ParkingUser.findOne({
		'_id': req.body.userId
	}, function(err, user) {
		if (err) {
			return res.send(err);
		} else {
			ParkingRequest
				.find({
					'offerParkingUser': user
				})
				.populate("requestUser")
				.populate("offerParkingUser")
				.sort({
					registredDate: 'desc'
				})
				.exec(function(err, parking) {
					if (err) {
						res.send(err);
					} else {
						res.json(parking);
					}
				});
		}
	});
};