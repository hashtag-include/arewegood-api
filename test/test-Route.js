/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>

var assert = require('assert');

var Route = require('../routes/Route');

describe("Route", function () {
	it("should default to get", function () {
		var i = new Route("/", function(){});
		
		assert(i.method === "get", "method should be 'get' by default");
	});
});