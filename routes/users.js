var ParkingUser = require('../models/user');

exports.saveUser = function(req, res) {
    ParkingUser.findOne({
        '_id': req.body.userId
    }, function(err, user) {
        if (user) {
            ParkingUser.findOne({
                'epost': req.body.epost.toLowerCase()
            }, function(err, userWithEmail) {
                if (err) {
                    res.send(err);
                }


                if (userWithEmail._id === user._id && user.email === req.body.epost) {
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