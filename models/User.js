
function User (accessToken, refreshToken, profile) {
	this.accessToken = accessToken || "";
	this.refreshToken = refreshToken || "";
	this.profile = {};
	this.profile.username = profile.username || "";
}

User.prototype.accessToken = "";
User.prototype.refreshToken = "";
User.prototype.profile = {};
User.prototype.profile.username = "";

module.exports = User;