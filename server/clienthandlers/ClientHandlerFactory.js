var	ClientHandler = require('./ClientHandler'),
	PresentationClientHandler = require('./presentation'),
	url = require('url');

module.exports = {
	createClientHandler: function(socket) {
		if(socket.decoded_token && socket.decoded_token.role) {
			if(socket.decoded_token.role === 'presentation') {
				return new PresentationClientHandler(socket);
			}
		}
		return new ClientHandler(socket);
	}
};