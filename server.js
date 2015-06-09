var path = require('path');

var Promise = require('promise');
var conar = require('conar');
var restify = require('restify');
var bunyan = require('bunyan');
var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;
var bodyParser = require('body-parser');
var r = require('rethinkdb');

var pkg = require('./package.json');

// the awg-api version
var version = pkg.version;

// let this throw if the package.json entry is not found. this is a hard dependency
var configPath = path.normalize("./" + pkg.arewegood.config);

// parse our configuration file given configPath, or use defaults
var config = conar()
	.defaults({
		"RETHINK_HOST": "",
		"RETHINK_DB": "",
		"RETHINK_PORT": 28015,
		"RETHINK_AUTH": "",
		"INSTANCE_NAME": "001",
		"GITHUB_ID": "",
		"GITHUB_SECRET": "",
		"GITHUB_CALLBACK": "",
		"PORT": 1337,
		"LOGGER_LEVEL": "info"
	})
	.env("PORT")
	.env("LOGGER_LEVEL")
	.env("RETHINK_DB")
	.env("RETHINK_HOST")
	.env("RETHINK_PORT")
	.env("RETHINK_AUTH")
	.env("GITHUB_ID")
	.env("GITHUB_SECRET")
	.env("GITHUB_CALLBACK")
	.parse(configPath)
	.suppress()
	.opts();

// create a logger in this context for use below
var logger = bunyan.createLogger({
	name: "awg-api-"+config["INSTANCE_NAME"],
	level: config["LOGGER_LEVEL"]
});

// trace our configuration
logger.trace({config: config, configPath: configPath}, "configuration read");

// connect to the database
r.connect({
	host: config["RETHINK_HOST"],
	port: config["RETHINK_PORT"],
	authKey: config["RETHINK_AUTH"]
	
// build server
}).then(function (db) {
	var server = restify.createServer({
		name: "awg-api-"+config["INSTANCE_NAME"],
		version: version,
		log: logger
	});
	
	// store the warmed db connection on the server instance
	server._db = db;
	
	server.use(restify.queryParser());
	server.use(restify.acceptParser(server.acceptable));
	server.use(bodyParser.json());
	
	return server;
	
// mount authentication middleware
}).then(function (server) {
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});
	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});
	
	// use github strategy
	passport.use(new GithubStrategy({
		clientID: config["GITHUB_ID"],
		clientSecret: config["GITHUB_SECRET"],
		callbackURL: config["GITHUB_CALLBACK"]
	}, function (accessToken, refreshToken, profile, done) {
		return done(null, profile);
	}));
	
	// mount it on the server
	server.use(passport.initialize());
	
	// force auth on all endpoints
	server.use(function (req, res, next) {
		if (req.isAuthenticated()) { return next(); }
			res.send(401, {error: "Not Authorized"});
	});
	
	return server;
	
// mount routes
}).then(function (server) {
	var routes = require('./routes');
	
	// iterate all routes and mount them
	// NOTE: if you want to add routes you need to change routes/index.js too!
	for (var prop in routes) {
		if (typeof(routes[prop]) === "object") {
			var method = routes[prop].method;
			var path = routes[prop].path;
			var handler = routes[prop].handler;
			server[method](path, handler);
		}
	}
	
	return server;
	
// start listening!
}).done(function (server) {
	server.listen(config["PORT"], function () {
		logger.info({name: server.name, url: server.url}, "listening");
	});
	
// or fail out
}, function (err) {
	logger.fatal({err: err.stack}, "failed");
});