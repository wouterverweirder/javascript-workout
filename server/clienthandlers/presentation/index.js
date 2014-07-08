var Clienthandler = require('../ClientHandler'),
	util = require('util'),
	url = require('url'),
	Constants = require('../../../shared/Constants');

function PresentationClientHandler(socket) {
	Clienthandler.call(this, socket);

	//create a slide handler if this is a socket for a specific slide
	var qry = url.parse(socket.request.url, true).query;
	if(qry.slide) {
		//this.currentSlideHandler = SlideHandlerFactory.createSlideHandler(qry.slide, this.socket);
	}

	this._setCurrentSlideIndexHandler = this.setCurrentSlideIndexHandler.bind(this);
	this.socket.on(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.dispose = function() {
	PresentationClientHandler.super_.prototype.dispose.apply(this);
	this.socket.removeListener(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);
	if(this.currentSlideHandler) {
		//this.currentSlideHandler.dispose();
	}
};

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

module.exports = PresentationClientHandler;