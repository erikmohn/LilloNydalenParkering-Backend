var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

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

console.log("Connection to MongoDB: " + config.mongodb.url);

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


app.use('', router);

//console.log('Listening on port %s...', port);
//app.listen(port);

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});