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
var RETHINK_DB = "test";

describe("http routes", function () {
	var server = null;
	before(function (done) {
		server = restify.createServer();
		routes(server);
		server.listen(PORT, function () { done(); });
	});
	
	it('GET / => 200 "OK"', function (done) {
		get.call(done, HOSTNAME+"/", '"OK"');
	});
	
	it('POST /event/test "DATA" => 200 ""', function (done) {
		post.call(done, HOSTNAME+"/event/test", "DATA");
	});
	
	after(function () {
		server.close();
		delete server;
	});
});

// http tester helper
function get (path, content, code) {
	code = code || 200;
	
	var done = this;
	request(path, function (err, res, body) {
		assert(err == null, err);
		assert(res.statusCode === code, res.statusCode.toString());
		assert(body == content, body);
		done();
	});
}
function post (path, content, code) {
	code = code || 200;
	
	var done = this;
	request.post(path, {json: JSON.stringify(content)}, function (err, res, body) {
		assert(err == null, err);
		assert(res.statusCode === code, res.statusCode.toString());
		assert(body == content, body);
		done();
	});
}