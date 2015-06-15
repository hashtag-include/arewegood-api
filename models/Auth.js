function Auth (accessToken) {
	this.access_token = accessToken || "";
}

Auth.prototype.access_token = "";

module.exports = Auth;