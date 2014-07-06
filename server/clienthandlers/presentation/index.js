var Clienthandler = require('../ClientHandler'),
	util = require('util');

function PresentationClientHandler(socket) {
	Clienthandler.call(this, socket);

	this._setCurrentSlideIndexHandler = this.setCurrentSlideIndexHandler.bind(this);
	this.socket.on('setCurrentSlideIndex', this._setCurrentSlideIndexHandler);
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.dispose = function() {
	PresentationClientHandler.super_.prototype.dispose.apply(this);
	this.socket.removeListener('setCurrentSlideIndex', this._setCurrentSlideIndexHandler);
};

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

module.exports = PresentationClientHandler;