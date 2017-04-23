var ParkingUser = require('../models/user');
var ParkingSpace = require('../models/parkingspace');

exports.saveUser = function(req, res) {
    ParkingUser.findOne({
        '_id': req.body.userId
    }, function(err, user) {
        if (user) {
            ParkingUser.findOne({
                '_id': {
                    $ne: req.body.userId
                },
                'epost': req.body.epost.toLowerCase()
            }, function(err, userWithEmail) {
                if (err) {
                    res.send(err);
                }
                if (!userWithEmail) {
                    user.firstName = req.body.firstName;
                    user.lastName = req.body.lastName;
                    user.phoneNumber = req.body.phoneNumber;
                    user.epost = req.body.epost
                    user.save(function(err) {
                        if (err)
                            res.send(err);
                        res.json({
                            message: 'User saved!',
                            user: user
                        });
                    })
                } else {
                    res.json({
                        message: 'Another user with same email already exists',
                        userAlreadyExists: true
                    });
                }
            });
        } else {
            res.json({
                message: 'Bruker ikke funnet!'
            });
        }
    });
};

exports.resetPassword = function(req, res) {
    ParkingUser.findOne({
        'epost': req.body.epost
    }, function(err, user) {
        if (err) {
            res.send(err);
        }
        if (user) {
            res.send({
                newPassword: Math.random().toString(36).slice(-8),
                passwordReset: true

            });
        } else {
            res.send({
                passwordReset: false
            });
        }
    });
}

exports.getUserByEmail = function(req, res) {
    ParkingUser.findOne({
        'epost': req.body.epost
    }, function(err, user) {
        if (err) {
            res.send(err);
        }
        if (user) {
            res.send({
                message: "User with same email already existis",
                userAlreadyExists: true
            });
        } else {
            res.send({
                message: "No user with same email found",
                userAlreadyExists: false
            });
        }
    });
};

exports.newUser = function(req, res) {
    ParkingUser.findOne({
        'epost': req.body.epost
    }, function(err, user) {
        if (user) {
            res.send({
                message: "User with same email already existis",
                userAlreadyExists: true
            });

        } else {
            user = new ParkingUser();
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName
            user.phoneNumber = req.body.phoneNumber
            user.parkingSpace = req.body.parkingSpace;
            user.regnr = req.body.regnr;
            user.epost = req.body.epost.toLowerCase();
            user.hasParkingspace = req.body.hasParkingspace;
            user.needsParkingspace = req.body.needsParkingspace;
            user.wantsPush = req.body.wantsPush;
            user.pushToken = req.body.pushToken;
            user.password = req.body.password;
            user.activated = true;

            user.save(function(err) {
                if (err)
                    res.send(err);
                res.json({
                    message: 'User saved! ' + user.id,
                    user: user
                });
            })
        }

    });
};

exports.getUser = function(req, res) {
    ParkingUser.findOne({
        '_id': req.params.userId
    }, function(err, user) {
        if (err)
            return res.send(err);
        res.json(user);
    });
};

exports.authenticateUser = function(req, res) {
    ParkingUser
        .findOne({
            'epost': req.body.username.toLowerCase(),
            'password': req.body.password
        })
        .exec(function(err, user) {
            if (err)
                res.send(err);
            if (user) {
                res.json(user);
            } else {
                res.json({
                    notAuthenticated: true
                })
            }

        });
};



exports.changePassword = function(req, res) {
    ParkingUser
        .findOne({
            '_id': req.body.userId,
            'password': req.body.oldPassword,
        })
        .exec(function(err, user) {
            if (err)
                res.send(err);
            if (user) {
                user.password = req.body.newPassword
                user.save(function(err) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json({
                            message: 'Password updated ' + user.id,
                            passwordChanged: true
                        });
                    }
                })
            } else {
                res.json({
                    passwordChanged: false
                })
            }

        });
};

exports.getUserParkingSpaces = function(req, res) {
    ParkingUser.findOne({
            '_id': req.params.userId
        })
        .populate({
            path: 'parkingSpaces',
            model: 'ParkingSpace'
        })
        .exec(function(err, user) {
            if (err)
                return res.send(err);
            res.json(user.parkingSpaces);
        });
};

exports.saveUserParkingSpaces = function(req, res) {
    ParkingUser.findOne({
            '_id': req.body.userId
        })
        .populate({
            path: 'parkingSpaces',
            model: 'ParkingSpace'
        })
        .exec(function(err, user) {
            if (err)
                return res.send(err);
            var shouldAdd = [];
            var shouldRemove = [];
            if (req.body.parkingSpaces) {
                req.body.parkingSpaces.forEach(function(newParkingSpace, index) {
                    var shouldAddItem = true;
                    user.parkingSpaces.forEach(function(oldParkingSpace) {
                        if (newParkingSpace.parkingSpace == oldParkingSpace.parkingSpace) {
                            shouldAddItem = false;
                        }
                    })
                    if (shouldAddItem) {
                        shouldAdd.push(index);
                    }
                });
            }

            user.parkingSpaces.forEach(function(oldParkingSpace, index) {
                var shouldDeleteItem = true;
                if (req.body.parkingSpaces) {
                    req.body.parkingSpaces.forEach(function(newParkingSpace) {
                        if (newParkingSpace.parkingSpace == oldParkingSpace.parkingSpace) {
                            shouldDeleteItem = false;
                        }
                    })
                }
                if (shouldDeleteItem) {
                    shouldRemove.push(index);
                }
            });
            console.log("Should add:");
            console.log(shouldAdd);
            console.log("Should remove:");
            console.log(shouldRemove);

            var itemsToSave = [];
            shouldAdd.forEach(function(index) {
                var item = req.body.parkingSpaces[index]
                var parkingSpace = new ParkingSpace();
                parkingSpace.parkingSpace = item.parkingSpace;
                itemsToSave.push(parkingSpace);
            });

            var itemsToDelete = [];
            shouldRemove.forEach(function(index) {
                var parkingSpace = user.parkingSpaces[index];
                itemsToDelete.push(parkingSpace);
            });

            var num = shouldRemove.length + shouldAdd.length;
            var i = 0;

            if (num == 0) {
                finalizeParkingSpaceSave(user, res, itemsToDelete, itemsToSave);
            }

            //Actually save and delete stuff now!
            console.log("Should save:");
            console.log(itemsToSave);
            console.log("Should delete:");
            console.log(itemsToDelete);
            itemsToSave.forEach(function(item) {
                item.save(function(err) {
                    if (err)
                        return res.send(err);
                    user.parkingSpaces.push(item);
                    i++;
                    if (i == num) {
                        finalizeParkingSpaceSave(user, res, itemsToDelete, itemsToSave);
                    }
                })
            });

            itemsToDelete.forEach(function(item) {
                user.parkingSpaces.forEach(function(parking, index) {
                    if (parking.parkingSpace == item.parkingSpace) {
                        user.parkingSpaces.splice(index, 1);
                    }
                });
                item.remove(function(err) {
                    if (err)
                        return res.send(err);

                    i++;
                    if (i == num) {
                        finalizeParkingSpaceSave(user, res, itemsToDelete, itemsToSave);
                    }
                });
            });
        });
}

function finalizeParkingSpaceSave(user, res, itemsToDelete, itemsToSave) {
    user.save(function(err) {
        if (err) {
            return res.send(err);
        }
        res.json({
            message: "Done, removed: " + itemsToDelete.length + ", and added: " + itemsToSave.length + " new items",
            saved: true
        });
    })
}