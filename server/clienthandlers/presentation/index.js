var Clienthandler = require('../ClientHandler'),
	util = require('util');

function PresentationClientHandler(socket) {
	Clienthandler.call(this, socket);
	socket.on('setCurrentSlideIndex', this.setCurrentSlideIndexHandler.bind(this));
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

module.exports = PresentationClientHandler;