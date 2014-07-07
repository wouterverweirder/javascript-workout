var events = require('events'),
	util = require('util'),
	Constants = require('../../../../shared/Constants');

function SlideHandler(slideName, socket) {
	events.EventEmitter.call(this);
	this.slideName = slideName;
	this.socket = socket;

	this._requestPolarH7Handler = this.requestPolarH7Handler.bind(this);
	this.socket.on(Constants.REQUEST_POLAR_H7, this._requestPolarH7Handler);

	this._polarH7HeartRateHandler = this.polarH7HeartRateHandler.bind(this);
}

util.inherits(SlideHandler, events.EventEmitter);

SlideHandler.prototype.dispose = function() {
	this.socket.removeListener(Constants.REQUEST_POLAR_H7, this._requestPolarH7Handler);
	if(this.polarH7) {
		this.polarH7.removeListener('heartRate', this._polarH7HeartRateHandler);
	}
};

SlideHandler.prototype.requestPolarH7Handler = function() {
	//request a polar H7 instance
	this.emit(Constants.REQUEST_POLAR_H7);
	if(this.polarH7) {
		this.polarH7.on('heartRate', this._polarH7HeartRateHandler);
	}
};

SlideHandler.prototype.polarH7HeartRateHandler = function(heartRate) {
	this.socket.emit('heartRate', heartRate);
};

module.exports = SlideHandler;