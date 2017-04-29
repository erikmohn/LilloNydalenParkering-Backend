var express = require('express');
//var Pusher = require('pusher');
var app = express();
app.set('port', (process.env.PORT || 5000));

var config = require('./config');
var bodyParser = require('body-parser');
var morgan = require('morgan')
var mongoose = require('mongoose');

//Data models
var ParkingUser = require('./models/user');

var Car = require('./models/car');
var ParkingSpace = require('./models/parkingspace');
var NotificationToken = require('./models/notificationtoken');
var MessageThread = require('./models/messagethread');
var Message = require('./models/message');
var FreeParking = require('./models/freeparking');
var ParkingRequest = require('./models/parkingrequest');

//Routes
var parking = require('./routes/parking');
var users = require('./routes/users');

console.log("Connecting to MongoDB: " + config.mongodb.url);
mongoose.connect(config.mongodb.url);

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(morgan('combined'))

var router = express.Router();

router.post('/user/authenticate', users.authenticateUser);
router.post('/user/password/change', users.changePassword);
router.post('/user/password/reset', users.resetPassword);

router.get('/user/:userId', users.getUser);

router.get('/user/parkingSpaces/:userId', users.getUserParkingSpaces);
router.post('/user/parkingSpaces/save', users.saveUserParkingSpaces);
router.get('/user/cars/:userId', users.getUserCars);
router.post('/user/cars/save', users.saveUserCars);

router.get('/messages/:threadId', messages.getMessageThread);

router.post('/user/save', users.saveUser);
router.post('/user/new', users.newUser);
router.post('/user/email', users.getUserByEmail)

router.post('/parking', parking.getParkingById);
router.post('/parking/request', parking.requestParking);
router.post('/parking/requests', parking.getValidRequests);
router.post('/parking/requests/past', parking.getPastRequests);

router.post('/parking/offer', parking.offerParking);

router.post('/parking/free', parking.registerFreeParking);


router.post('/parking/cancle', parking.cancleParking);
router.post('/parking/done', parking.doneParking);

router.post('/parking/user', parking.getValidRequestForUser);



app.get('/', function(request, response) {});

app.use('', router);

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});