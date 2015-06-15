
// Represents an event in our db
function Event(name, optionalData) {
	this.name = name || "";
	this.optionalData = optionalData || null;
}

Event.prototype.name = "";
Event.prototype.optionalData = null;

module.exports = Event;