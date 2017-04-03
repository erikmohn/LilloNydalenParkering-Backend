var config = {};
config.mongodb = {};

config.mongodb.url = process.env.MONGODB_URL || 'mongodb://localhost:27017';

module.exports = config;

