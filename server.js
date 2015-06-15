var path = require('path');

var Promise = require('promise');
var conar = require('conar');
var restify = require('restify');
var bunyan = require('bunyan');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var bodyParser = require('body-parser');
var r = require('rethinkdb');

var pkg = require('./package.json');
var User = require('./models/User');

// the awg-api version
var version = pkg.version;

// let this throw if the package.json entry is not found. this is a hard dependency
var configPath = path.normalize("./" + pkg.arewegood.config);

// parse our configuration file given configPath, env, argv, or use defaults
var config = conar()
	.defaults({
		"RETHINK_HOST": "",
		"RETHINK_DB": "arewegood",
		"RETHINK_USER_TB": "users",
		"RETHINK_EVENT_TB": "events",
		"RETHINK_PORT": 28015,
		"RETHINK_AUTH": "",
		"INSTANCE_NAME": "001",
		"GITHUB_ID": "",
		"GITHUB_SECRET": "",
		"GITHUB_CALLBACK": "",
		"PORT": 1337,
		"LOGGER_LEVEL": "info",
		"THROTTLE_BURST": 100,
		"THROTTLE_RATE": 50,
	})
	.env("PORT")
	.env("LOGGER_LEVEL")
	.env("RETHINK_USER_TB")
	.env("RETHINK_EVENT_TB")
	.env("RETHINK_DB")
	.env("RETHINK_HOST")
	.env("RETHINK_PORT")
	.env("RETHINK_AUTH")
	.env("GITHUB_ID")
	.env("GITHUB_SECRET")
	.env("GITHUB_CALLBACK")
	.env("THROTTLE_BURST")
	.env("THROTTLE_RATE")
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
	
	// store the config object on the server instance
	server._config = config;
	
	server.use(restify.acceptParser(server.acceptable));
	server.use(restify.throttle({
	  burst: config["THROTTLE_BURST"],
	  rate: config["THROTTLE_RATE"],
	  ip: true}));
	
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
	  },
	  function(accessToken, refreshToken, profile, done) {
		  r.table(config["RETHINK_USER_TB"]).insert(new User(accessToken, refreshToken, profile),{conflict: "update"}).run(server._db, function (err, user) {
			 if (err) {
				 logger.warn({err: err.stack, profile: profile, dbName: config["RETHINK_USER_TB"]}, "user db issue");
				 return done(err);
			 }
			 if (!user) {
				 logger.warn({err: err.stack, profile: profile, dbName: config["RETHINK_USER_TB"]}, "user not found");
				 return done(err);
			 }
			 return done(null, user, {scope: 'all'});
		  });
	  }
	));
	
	// use bearer strategy
	passport.use(new BearerStrategy(
	  function(token, done) {
	    r.table(config["RETHINK_USER_TB"]).get(token).run(server._db, function (err, user) {
			if (err) {
				logger.warn({err: err.stack, token: token, dbName: config["RETHINK_USER_TB"]}, "user db issue");
				return done(err);
			}
			if (!user) {
				logger.warn({token: token, dbName: config["RETHINK_USER_TB"]}, "user not found");
				return done(null, false);
			}
			return done(null, user, {scope: 'all'});
		});
	  }
	));
	
	// mount it on the server
	server.use(passport.initialize());
	
	// force auth on all endpoints
	server.use(passport.authenticate('bearer', {session: false}));
	
	// check auth on all endpoints
	server.use(function (req, res, next) {
		if (req.isAuthenticated()) { return next(); }
			res.send(401, {error: "Not Authorized"});
	});
	
	return server;
	
// parse stuff
}).then(function (server) {
	server.use(restify.queryParser());
	server.use(bodyParser.json());
	
	return server;
	
// mount routes
}).then(function (server) {
	var routes = require('./routes');
	
	// mount them all
	routes(server);
	
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