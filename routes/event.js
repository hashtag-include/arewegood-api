var r = require('rethinkdb');
var restify = require('restify');

var Event = require('../models/Event');
var Route = require('./Route');

// instance of a Route that responds for /event/:eventName
var event = new Route("/event/:eventName", function (req, res) {
	var db = this._db;
	var tb = this._config["RETHINK_EVENT_TB"];
	var logger = this.log;
	
	var evt = req.params.eventName;
	var optionalData = req.body;
	
	r.table(tb).insert(new Event(evt, optionalData)).run(db, function (err, result) {
		if (err) {
			logger.trace({err: err.stack, eventName: evt, dbName: tb}, "event db issue");
			return res.send(new restify.InternalError("Failed to write event/"+evt));
		} else {
			res.send(200, result);
		}
	});
}, "post");

module.exports = event;