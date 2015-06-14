/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/restify/restify.d.ts"/>
/// <reference path="../typings/request/request.d.ts" />


var assert = require('assert');
var restify = require('restify');
var request = require('request');

var routes = require('../routes');

var PORT = 1337;
var HOSTNAME = "http://localhost:"+PORT;

describe("http routes", function () {
	var server = null;
	before(function (done) {
		server = restify.createServer();
		routes(server);
		server.listen(PORT, function () { done(); });
	});
	
	it('HTTP / => 200 "OK"', function (done) {
		yields.call(done, HOSTNAME+"/", '"OK"');
	});
	
	after(function () {
		server.close();
		delete server;
	});
});

// http tester helper
function yields (path, content, code) {
	code = code || 200;
	
	var done = this;
	request(path, function (err, res, body) {
		assert(err == null, err);
		assert(res.statusCode === code, res.statusCode.toString());
		assert(body == content, body);
		done();
	});
}