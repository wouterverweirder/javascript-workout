var events = require('events'),
	util = require('util'),
	dgram = require('dgram'),
	Constants = require('../../../shared/Constants'),
	SlideHandler = require('../SlideHandler');

function HighestHeartrateGameSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[HighestHeartrateGameSlideHandler] constructor');
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

	this.substate = Constants.HIGHEST_HEARTRATE_GAME_INTRO;
}

util.inherits(HighestHeartrateGameSlideHandler, SlideHandler);

HighestHeartrateGameSlideHandler.prototype.dispose = function() {
	HighestHeartrateGameSlideHandler.super_.prototype.dispose.apply(this);
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

HighestHeartrateGameSlideHandler.prototype.udpErrorHandler = function(error) {
	console.log('[HighestHeartrateGameSlideHandler] udpErrorHandler', error);
	this.udpSocket.close();
};

HighestHeartrateGameSlideHandler.prototype.udpMessageHandler = function(message, remoteInfo) {
	var str = message.toString();
	var split = str.split(';');
	if(split.length > 2) {
		this.sendToClientsByRole(Constants.ROLE_PRESENTATION, Constants.HEART_RATE_SPARK, split[0], split[2]);
	}
};

HighestHeartrateGameSlideHandler.prototype.udpListeningHandler = function() {
	console.log('[HighestHeartrateGameSlideHandler] udpListening');
};

HighestHeartrateGameSlideHandler.prototype.onClientHandlerAdded = function(clientHandler, isAddFromInitialization) {
	clientHandler.send(Constants.SET_SUBSTATE, this.substate);
	if(clientHandler.role === Constants.ROLE_PRESENTATION) {
		clientHandler.on(Constants.SET_SUBSTATE, this._setSubstateHandler);
	}
};

HighestHeartrateGameSlideHandler.prototype.onClientHandlerRemoved = function(clientHandler) {
	clientHandler.removeListener(Constants.SET_SUBSTATE, this._setSubstateHandler);
};

HighestHeartrateGameSlideHandler.prototype.setSubstateHandler = function(clientHandler, substate) {
	this.setSubstate(substate);
};

HighestHeartrateGameSlideHandler.prototype.setSubstate = function(substate) {
	if(this.substate !== substate) {
		this.substate = substate;
		this.sendToAll(Constants.SET_SUBSTATE, substate);
		if(this.substate === Constants.HIGHEST_HEARTRATE_GAME_GAME) {
		} else if(this.substate === Constants.HIGHEST_HEARTRATE_GAME_FINISHED) {
		}
	}
};

module.exports = HighestHeartrateGameSlideHandler;