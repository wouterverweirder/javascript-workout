var events = require('events'),
	util = require('util'),
	AppModel = require('../model/AppModel');

function ClientHandler(socket) {
	events.EventEmitter.call(this);
	this.socket = socket;
	this.appModel = AppModel.getInstance();


	this._currentSlideIndexChangedHandler = this.currentSlideIndexChangedHandler.bind(this);
	this.appModel.on('currentSlideIndexChanged', this._currentSlideIndexChangedHandler);

	this.currentSlideIndexChangedHandler(this.appModel.getCurrentSlideIndex(), this.appModel.slides[this.appModel.getCurrentSlideIndex()]);
}

util.inherits(ClientHandler, events.EventEmitter);

ClientHandler.prototype.dispose = function() {
	this.appModel.removeListener('currentSlideIndexChanged', this._currentSlideIndexChangedHandler);
};

ClientHandler.prototype.currentSlideIndexChangedHandler = function(currentSlideIndex, currentSlide) {
	this.socket.emit('currentSlideIndexChanged', currentSlideIndex, currentSlide);
};

module.exports = ClientHandler;