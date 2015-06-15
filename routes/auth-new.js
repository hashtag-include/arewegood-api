var r = require('rethinkdb');
var restify = require('restify');
var passport = require('passport');

var Auth = require('../models/Auth');
var Route = require('./Route');

// instance of a Route that responds for /auth/new
var event = new Route("/auth/new", passport.authenticate('github'));

module.exports = event;