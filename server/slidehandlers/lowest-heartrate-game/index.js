var events = require('events'),
	util = require('util'),
	dgram = require('dgram'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function LowestHeartRateGameSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[LowestHeartRateGameSlideHandler] constructor');
	this._setSubstateHandler = this.setSubstateHandler.bind(this);

	//listen for datagrams
	this._udpErrorHandler = this.udpErrorHandler.bind(this);
	this._udpMessageHandler = this.udpMessageHandler.bind(this);
	this._udpListeningHandler = this.udpListeningHandler.bind(this);

	this.udpSocket = dgram.createSocket('udp4');
	this.udpSocket.on("error", this._udpErrorHandler);
	this.udpSocket.on("message", this._udpMessageHandler);
	this.udpSocket.on("listening", this._udpListeningHandler);
	this.udpSocket.bind(1234);

	this.substate = Constants.LOWEST_HEARTRATE_GAME_INTRO;
}

util.inherits(LowestHeartRateGameSlideHandler, SlideHandler);

LowestHeartRateGameSlideHandler.prototype.dispose = function() {
	LowestHeartRateGameSlideHandler.super_.prototype.dispose.apply(this);
	//remove listeners from clientHandlers
	for (var i = this.clientHandlers.length - 1; i >= 0; i--) {
		this.clientHandlers[i].removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
	};
	//close the udp socket
	this.udpSocket.removeListener("error", this._udpErrorHandler);
	this.udpSocket.removeListener("message", this._udpMessageHandler);
	this.udpSocket.removeListener("listening", this._udpListeningHandler);
	this.udpSocket.close();
};

LowestHeartRateGameSlideHandler.prototype.udpErrorHandler = function(error) {
	console.log('[LowestHeartRateGameSlideHandler] udpErrorHandler', error);
	this.udpSocket.close();
};

LowestHeartRateGameSlideHandler.prototype.udpMessageHandler = function(message, remoteInfo) {
	var str = message.toString();
	var split = str.split(';');
	if(split.length > 2) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.HEART_RATE_SPARK, split[0], split[2]);
	}
};

LowestHeartRateGameSlideHandler.prototype.udpListeningHandler = function() {
	console.log('[LowestHeartRateGameSlideHandler] udpListening');
};

LowestHeartRateGameSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
	}
};

LowestHeartRateGameSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
};

LowestHeartRateGameSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

LowestHeartRateGameSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.LOWEST_HEARTRATE_GAME_GAME) {
		} else if(this.substate === Constants.LOWEST_HEARTRATE_GAME_FINISHED) {
		}
	}
};

module.exports = LowestHeartRateGameSlideHandler;