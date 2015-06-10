// constructor for a route
// path - string - endpoint identifier
// handler - function - the endpoint handler, called with this=server,arg1=req,arg2=res,arg3=next
// optionalMethod - string - the endpoint method, defaults to get
function Route (path, handler, optionalMethod) {
	this.method = optionalMethod || "get";
	this.path = path;
	this.handler = handler;
}

Route.prototype.method = "";
Route.prototype.path = "";
Route.prototype.handler = null;

module.exports = Route;