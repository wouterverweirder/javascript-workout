var Clienthandler = require('../ClientHandler'),
	util = require('util'),
	url = require('url'),
	Constants = require('../../../shared/Constants'),
	PolarH7 = require('../../sensors/PolarH7');

function PresentationClientHandler(role, socket) {
	Clienthandler.call(this, role, socket);

	//we show my heart rate from the Polar H7 constantly, always send out this info over the socket
	this.polarH7 = PolarH7.getInstance();
	this._heartRateHandler = this.heartRateHandler.bind(this);
	this.polarH7.on(PolarH7.HEART_RATE, this._heartRateHandler);
	
	//Note: all event handlers on socket get removed in parent dispose using removeAll.
	this._setCurrentSlideIndexHandler = this.setCurrentSlideIndexHandler.bind(this);
	this.socket.on(Constants.SET_CURRENT_SLIDE_INDEX, this._setCurrentSlideIndexHandler);

	this.socket.on(Constants.SET_SUBSTATE, this.forwardEventHandler.bind(this, Constants.SET_SUBSTATE));
}

util.inherits(PresentationClientHandler, Clienthandler);

PresentationClientHandler.prototype.dispose = function() {
	PresentationClientHandler.super_.prototype.dispose.apply(this);
	this.polarH7.removeListener(PolarH7.HEART_RATE, this._heartRateHandler);
};

PresentationClientHandler.prototype.setCurrentSlideIndexHandler = function(currentSlideIndex) {
	this.appModel.setCurrentSlideIndex(currentSlideIndex);
};

PresentationClientHandler.prototype.heartRateHandler = function(heartRate) {
	this.send(Constants.HEART_RATE_POLAR, heartRate);
};

module.exports = PresentationClientHandler;