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
			FreeParking.find({
					'canceled': false,
					//'ownder': {$ne: user},
					/*'$and': [{
						'$or': [{
								'startTime': {
									$lt: req.body.starTime
								},
								'startTime': req.body.starTime
							}

						]
					}, {
						'$or': [{
							'endTime': {
								$gt: req.body.endTime
							},
							'endTime': req.body.endTime
						}]
					}]*/

				})
				.populate('parkingRequests')
				.exec(function(err, freeParkings) {
					console.log("Found free parking");
					console.log(freeParkings);
					var elligbleParking = [];
					var start = Moment(new Date(req.body.starTime));
					var end = Moment(new Date(req.body.endTime));

					freeParkings.forEach(function(freeParking) {
						console.log("See if this parking can be used in timeframe?");
						var canUse = true;
						freeParking.parkingRequests.forEach(function(existing) {
							console.log("Check if other parking has taken time slot");
							var eStart = Moment(existing.startTime);
							var eEnd = Moment(existing.endTime);
							if ((eStart.isBefore(start) || eStart.isSame(start)) && ((eEnd.isAfter(end) || eEnd.isSame(end)))) {
								if (!existing.canceled) {
									canUse = false;
									console.log("This time slot is taken, find another free parking");
								}
							}
						});
						if (canUse) {
							console.log("Found parking where timeslot is open");
							elligbleParking.push(freeParking);
						}
					});


					var neededMinutes = start.diff(end, 'minutes');
					var leastOccupying = 0;
					var parkingToUse;

					elligbleParking.forEach(function(elligble) {
						var eStart = Moment(elligble.startTime);
						var eEnd = Moment(elligble.endTime);

						var availableMinutes = eStart.diff(eEnd, 'minutes');

						elligble.parkingRequests.forEach(function(reduceBy) {
							var rStart = Moment(reduceBy.startTime);
							var rEnd = Moment(reduceBy.endTime);

							var reduceTime = rStart.diff(rEnd, 'minutes');
							availableMinutes = availableMinutes - reduceTime;
						});

						var usePercentage = (neededMinutes / availableMinutes) * 100;

						if (usePercentage > leastOccupying) {
							console.log("found parking with more accurate fit, with usage %: " + usePercentage);
							leastOccupying = usePercentage;
							parkingToUse = elligble;
						}
					});



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

					if (parkingToUse) {
						console.log("Will allocate parking directly");
						parking.messages = new MessageThread();
						parking.answered = true;
						parking.offerParkingUser = parkingToUse.owner;
						parking.parkingLot = parkingToUse.parkingSpace;
						parking.answeredDate = req.body.registredDate;
					}

					parking.save(function(err, savedParking) {
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

							if (parkingToUse) {
								parkingToUse.parkingRequests.push(savedParking);

								parkingToUse.save(function(err, savedFreeParking) {
									res.json({
										message: 'Parking request saved!',
										request: savedParking
									});
								})
							} else {
								res.json({
									message: 'Parking request saved!',
									request: savedParking
								});
							}

						}
					});

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

exports.getFreeParking = function(req, res) {
	FreeParking.findOne({
			'_id': req.body.freeId
		})
		.populate('parkingRequests')
		.exec(function(err, freeParking) {
			if (err) {
				res.send(err);
			} else {
				ParkingUser.populate(freeParking, {
					path: 'parkingRequests.requestUser'
				}, function(err, result) {
					res.json(result);
				});
			}
		})
}

exports.getMyAvailableParking = function(req, res) {
	FreeParking.find({
			'owner': req.body.userId
		})
		.populate('owner')
		.populate('singleParkingRequest')
		.populate('parkingRequests')
		.exec(function(err, freeParkings) {
			if (err) {
				res.send(err);
			} else {
				ParkingUser.populate(freeParkings, {
					path: 'singleParkingRequest.requestUser'
				}, function(err, result) {
					res.json(result);
				});
			}
		});
};


exports.cancleFreeParking = function(req, res) {
	FreeParking.findOne({
			'freeParkingId': req.body.freeParkingId
		})
		.exec(function(err, freeParking) {
			if (err) {
				res.send(err);
			} else {
				freeParking.canceled = true;
				freeParking.save(function(err, savedParking) {
					res.json({
						message: "Canceled free parking!"
					});
				})
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
					if (err || !parking) {
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
										res.status(500).send(onGoingErr);
									}

									if (ongoingParking.length > 0) {
										res.send({
											'ongoingParking': true
										});
									} else {

										var messageThread = new MessageThread();

										messageThread.save(function(err, newMessageThread) {
											if (err) {
												res.status(500).json({
													'msg': "Failed"
												});
											}

											var requestMessage = new Message();
											requestMessage.sender = parking.requestUser[0]._id;
											requestMessage.date = parking.registredDate;
											requestMessage.message = parking.requestMessage;
											if (parking.requestMessage.length > 0) {
												requestMessage.messageThread = newMessageThread._id;
											}
											requestMessage.save(function(err, newMessage) {

												if (err) {
													console.log("message: " + err);
													res.status(500).json({
														'msg': "Failed"
													});
												}
												parking.messages = newMessageThread;
												parking.answered = true;
												parking.offerParkingUser = user;
												parking.parkingLot = req.body.parkingLot;
												parking.answeredDate = req.body.answeredDate;
												parking.save(function(err, savedParking) {
													if (err) {
														console.log("parking: " + err);
														res.status(500).json({
															'msg': "Failed"
														});
													} else {
														var freeParking = new FreeParking();
														freeParking.owner = user;
														freeParking.parkingSpace = req.body.parkingSpace;
														freeParking.startTime = savedParking.starTime;
														freeParking.endTime = savedParking.endTime;
														freeParking.canceled = false;
														freeParking.registredDate = req.body.answeredDate;
														freeParking.singleParkingRequest = savedParking;
														freeParking.save(function(err, savedFreeParking) {
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
													}
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

exports.getPastOffers = function(req, res) {
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