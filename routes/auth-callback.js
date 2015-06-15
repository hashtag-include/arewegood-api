var r = require('rethinkdb');
var restify = require('restify');
var passport = require('passport');

var Auth = require('../models/Auth');
var Route = require('./Route');

// instance of a Route that responds for /auth/callback
var event = new Route("/auth/callback", function (req, res) {
	passport.authenticate('github', {failureRedirect: "/auth/new"})(req, res, function (req, res) {
		res.redirect("/auth");
	});
});

module.exports = event;