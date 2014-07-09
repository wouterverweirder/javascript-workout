var Clienthandler = require('../ClientHandler'),
	util = require('util'),
	url = require('url'),
	Constants = require('../../../shared/Constants');

function PresentationClientHandler(role, socket) {
	Clienthandler.call(this, role, socket);

	//create a slide handler if this is a socket for a specific slide
	var qry = url.parse(socket.request.url, true).query;
	if(qry.slide) {
	}

	//all event handlers on socket get removed in parent dispose using removeAll.

	this._setCurrentSlideIndexHandler = this.setCurrentSlideIndexHandler.bind(this);
	this.socket.on(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);

	this.socket.on(Constants.SET_SUBSTATE, this.forwardEventHandler.bind(this, Constants.SET_SUBSTATE));
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

module.exports = PresentationClientHandler;