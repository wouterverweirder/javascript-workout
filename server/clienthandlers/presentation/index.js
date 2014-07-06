var Clienthandler = require('../ClientHandler'),
	util = require('util'),
	Constants = require('../../../shared/Constants');

function PresentationClientHandler(socket) {
	Clienthandler.call(this, socket);

	this._setCurrentSlideIndexHandler = this.setCurrentSlideIndexHandler.bind(this);
	this.socket.on(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);

	this._requestPolarH7Handler = this.requestPolarH7Handler.bind(this);
	this.socket.on(Constants.REQUEST_POLAR_H7, this._requestPolarH7Handler);

	this._polarH7HeartRateHandler = this.polarH7HeartRateHandler.bind(this);
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.dispose = function() {
	PresentationClientHandler.super_.prototype.dispose.apply(this);
	this.socket.removeListener(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);
	this.socket.removeListener(Constants.REQUEST_POLAR_H7, this._requestPolarH7Handler);
	if(this.polarH7) {
		this.polarH7.removeListener('heartRate', this._polarH7HeartRateHandler);
	}
};

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

PresentationClientHandler.prototype.requestPolarH7Handler = function() {
	//request a polar H7 instance
	this.emit(Constants.REQUEST_POLAR_H7);
	if(this.polarH7) {
		this.polarH7.on('heartRate', this._polarH7HeartRateHandler);
	}
};

PresentationClientHandler.prototype.polarH7HeartRateHandler = function(heartRate) {
	this.socket.emit('heartRate', heartRate);
};

module.exports = PresentationClientHandler;