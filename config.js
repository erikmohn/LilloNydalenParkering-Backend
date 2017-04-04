var config = {};
config.mongodb = {};

config.mongodb.url = process.env.MONGODB_URI || 'mongodb://localhost:27017';

module.exports = config;

