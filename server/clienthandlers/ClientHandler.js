var events = require('events'),
	util = require('util'),
	AppModel = require('../model/AppModel');

function ClientHandler(socket) {
	events.EventEmitter.call(this);
	this.socket = socket;
	this.appModel = AppModel.getInstance();

	this.appModel.on('currentSlideIndexChanged', this.currentSlideIndexChangedHandler.bind(this));
	this.currentSlideIndexChangedHandler(this.appModel.getCurrentSlideIndex(), this.appModel.slides[this.appModel.getCurrentSlideIndex()]);
}

util.inherits(ClientHandler, events.EventEmitter);

ClientHandler.prototype.currentSlideIndexChangedHandler = function(currentSlideIndex, currentSlide) {
	this.socket.emit('currentSlideIndexChanged', currentSlideIndex, currentSlide);
};

module.exports = ClientHandler;