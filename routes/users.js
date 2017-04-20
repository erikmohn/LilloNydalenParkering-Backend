var ParkingUser = require('../models/user');

exports.saveUser = function(req, res) {
    ParkingUser.findOne({
        '_id': req.body.userId
    }, function(err, user) {
        if (!user) {
            user = new ParkingUser();
        }
        user.userName = req.body.userName;
        user.password = req.body.password;
        user.phoneNumber = req.body.phoneNumber;
        user.parkingSpace = req.body.parkingSpace;
        user.regnr = req.body.regnr;
        user.epost = req.body.epost.toLowerCase();
        user.activated = true;
        user.pushToken = req.body.pushToken;

        user.save(function(err) {
            if (err)
                res.send(err);
            res.json({
                message: 'Parking user saved! ' + user.id,
                user: user
            });
        })
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
            'password': req.body.password
        })
        .exec(function(err, user) {
            if (err)
                res.send(err);
            if (user) {

                user.password = req.body.newPassword
                user.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({
                        message: 'Parking user saved! ' + user.id,
                        user: user
                    });
                })


                res.json(user);
            } else {
                res.json({
                    notAuthenticated: true
                })
            }

        });
};