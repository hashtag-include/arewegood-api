var Route = require('./Route');

// instance of a Route that responds for /
var root = new Route("/", function (req, res) {
	res.send("OK");
});

module.exports = root;