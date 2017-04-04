var express = require('express');
//var Pusher = require('pusher');
var app = express();
app.set('port', (process.env.PORT || 5000));

var config = require('./config');
var bodyParser = require('body-parser');
var morgan = require('morgan')
var mongoose   = require('mongoose');

//Data models
var ParkingUser = require('./models/user');
var ParkingRequest = require('./models/parkingrequest');

//Routes
var parking = require('./routes/parking');
var users = require('./routes/users');

console.log("Connecting to MongoDB: " + config.mongodb.url);

mongoose.connect(config.mongodb.url);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('combined'))

var router = express.Router();

router.post('/user/save', users.saveUser);
router.get('/user/:userId', users.getUser);

router.post('/parking/request', parking.requestParking);
router.post('/parking/offer', parking.offerParking);
router.post('/parking/cancle', parking.cancleParking);
router.post('/parking', parking.getParkingById);


router.get('/parking/requests', parking.getValidRequests);

router.get('/parking/user/:userId', parking.getValidRequestForUser);
//router.get('/parking/my/offers/:userId', parking.getMyValidRequests);

app.get('/', function(request, response) {
/*	console.log("Will push Hello World message!");
  var pusher = new Pusher({
	  appId: '323709',
	  key: 'b3268785e53213585357',
	  secret: '0e34a2e3fdc069b66f01',
	  cluster = "eu"
	});
  pusher.trigger('my-channel', 'my-event', {"message": "hello world"});*/
});

app.use('', router);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
