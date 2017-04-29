var ParkingUser = require('../models/user');
var ParkingRequest = require('../models/parkingrequest');
var FreeParking = require('../models/freeparking');
var MessageThread = require('../models/messagethread');
var Message = require('../models/message');
var Pusher = require('pusher');
var Pushwoosh = require('pushwoosh-client');
var Moment = require('moment-timezone');

var pusher = new Pusher({
	appId: '323709',
	key: 'b3268785e53213585357',
	secret: '0e34a2e3fdc069b66f01',
	cluster: 'eu',
	encrypted: true
});

var ENABLE_PUSH = false;

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
			parking.registredDate = req.body.registredDate;
			parking.requestMessage = req.body.requestMessage;
			parking.save(function(err) {
				if (err) {
					res.send(err);
				} else {
					if (ENABLE_PUSH) {
						var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);

						String.prototype.capitalizeFirstLetter = function() {
							return this.charAt(0).toUpperCase() + this.slice(1);
						}

						var message = user.userName + " spør etter parkering: \n" +
							"Fra: " + Moment(parking.startTime).tz("Europe/Oslo").locale("nb").format(" dddd HH:mm").capitalizeFirstLetter() + " " +
							"Til: " + Moment(parking.endTime).tz("Europe/Oslo").locale("nb").format(" dddd HH:mm").capitalizeFirstLetter();

						client.sendMessage(message, function(error, response) {
							if (error) {
								console.log('Some error occurs: ', error);
							}
						});



					}

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


exports.registerFreeParking = function(req, res) {
	ParkingUser.findOne({
		'_id': req.body.userId
	}, function(err, user) {
		if (err) {
			res.send(err);
		} else {
			var parking = new FreeParking();
			parking.owner = user;
			parking.parkingSpace = req.body.parkingSpace;
			parking.startTime = req.body.starTime;
			parking.endTime = req.body.endTime;
			parking.canceled = false;
			parking.registredDate = req.body.registredDate;
			parking.save(function(err) {
				if (err) {
					res.send(err);
				} else {
					res.json({
						message: 'Ledig parkering registrert!',
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
				.populate("requestUser")
				.exec(function(err, parking) {
					if (err) {
						res.status(500).send(err);
					} else {
						if (parking.answered) {
							res.send({
								'alreadyAnswered': true
							});
						} else {

							ParkingRequest.find({
									'_id': {
										$ne: req.body.parkingId
									},
									'offerParkingUser': user,
									'canceled': false,
									'done': false,
									'$and': [{
										'$or': [{
												'startTime': {
													$lt: parking.startTime
												},
												'startTime': parking.startTime
											}

										]
									}, {
										'$or': [{
											'endTime': {
												$gt: parking.endTime
											},
											'endTime': parking.endTime
										}]
									}]
								})
								.exec(function(onGoingErr, ongoingParking) {
									if (onGoingErr) {
										console.log("FAILED!!!! " + onGoingErr);
										//res.status(500).send(onGoingErr);
									}
									console.log(ongoingParking.length > 0);
									if (ongoingParking.length > 0) {
										res.send({
											'ongoingParking': true
										});
									} else {
										var requestMessage = new Message();
										requestMessage.sender = parking.requestUser._id;
										requestMessage.date = parking.registredDate;
										requestMessage.message = parking.requestMessage;

										requestMessage.save(function(err, newMessage) {
											if (err)
												console.log("message: " + err);
											var messageThread = new MessageThread();
											messageThread.messages.push(newMessage);
											messageThread.save(function(err, newMessageThread) {
												if (err)
												console.log("messageThread: " + err);
												parking.messages = newMessageThread;
												parking.answered = true;
												parking.offerParkingUser = user;
												parking.parkingLot = req.body.parkingLot;
												parking.answeredDate = req.body.answeredDate;
												parking.save(function(err, savedParking) {
													if (err)
														console.log("parking: " + err);
													var freeParking = new FreeParking();
													freeParking.owner = user._id;
													freeParking.parkingSpace = req.body.parkingLot;
													freeParking.startTime = parking.startTime;
													freeParking.endTime = parking.endTime;
													freeParking.canceled = false;
													freeParking.registredDate = req.body.registredDate;
													freeParking.parkingRequests.set(0, parking);

													freeParking.save(function(err, updatedParking) {
														if (err) {
															console.log("freePArking: " + err);
															res.send(err)
														}

														pusher.trigger("USER-" + parking.requestUser[0]._id, 'parking-offer', {
															"message": "Update current requests",
															"parkingAnswered": true
														});
														pusher.trigger("global-request-channel", 'request-update', {});

														var pushToken = parking.requestUser[0].pushToken;
														if (ENABLE_PUSH && pushToken) {
															var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);
															client.sendMessage('Du har mottatt et svar på din parkeringsforespørsel', pushToken, function(error, response) {
																if (error) {
																	console.log('Some error occurs: ', error);
																}
															});
														}

														res.send(parking);
													});

												});
											});
										});
									}
								})
						}
					}
				});
		}
	});
};

exports.getValidRequestForUser = function(req, res) {
	ParkingUser.findOne({
		'_id': req.body.userId
	}, function(err, user) {
		if (err) {
			return res.send(err);
		} else {
			ParkingRequest
				.find({
					'requestUser': user,
					'canceled': false,
					'done': false,
					'endTime': {
						$gt: req.body.now
					}
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
		.populate("requestUser")
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

					if (parking.offerParkingUser[0]) {
						pusher.trigger("USER-" + parking.offerParkingUser[0]._id, 'parking-offer', {
							"message": "Update current requests",
							"parkingCanceled": true,
							"msg": parking.requestUser[0].userName + " har avbrutt bruken av din parkeringsplass"
						});
						var pushToken = parking.offerParkingUser[0].pushToken;
						if (ENABLE_PUSH && pushToken) {
							var client = new Pushwoosh(PUSH_APP_CODE, PUSH_AUTH_CODE);
							client.sendMessage('Din utlånte parkering er avbrutt', pushToken, function(error, response) {
								if (error) {
									console.log('Some error occurs: ', error);
								}
							});
						}
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
		.populate("requestUser")
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

					pusher.trigger("USER-" + parking.offerParkingUser[0]._id, 'parking-offer', {
						"message": "Update current requests",
						"parkingDone": true,
						"msg": parking.requestUser[0].userName + " er ferdig med parkeringsplassen din"
					});

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
					.find({
						'$or': [{
							'requestUser': user
						}, {
							'offerParkingUser': user
						}]
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