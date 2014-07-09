var	ClientHandler = require('./ClientHandler'),
	PresentationClientHandler = require('./presentation'),
	Constants = require('../../shared/Constants'),
	url = require('url');

module.exports = {
	createClientHandler: function(socket) {
		if(socket.decoded_token && socket.decoded_token.role) {
			if(socket.decoded_token.role === Constants.ROLE_PRESENTATION) {
				return new PresentationClientHandler(Constants.ROLE_PRESENTATION, socket);
			}
		}
		return new ClientHandler(Constants.ROLE_MOBILE, socket);
	}
};