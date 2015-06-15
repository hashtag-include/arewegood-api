// array of all routes we want our application
// to use.
var routes = [
	require('./root'),
	require('./event')
];


// export a mounter, that takes an express style instance 'server'
module.exports = function (server) {
	// iterate all routes and mount them
	// NOTE: if you want to add routes you need to change routes/index.js too!
	for (var i = 0 ; i < routes.length; i++) {
		if (typeof(routes[i]) === "object") {
			var method = routes[i].method;
			var path = routes[i].path;
			var handler = routes[i].handler;
			server[method](path, handler.bind(server));
		}
	}	
};