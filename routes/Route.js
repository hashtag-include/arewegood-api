// constructor for a route
function Route (path, handler, optionalMethod) {
	this.method = optionalMethod || "get";
	this.path = path;
	this.handler = handler;
}

Route.prototype.method = "";
Route.prototype.path = "";
Route.prototype.handler = null;

module.exports = Route;