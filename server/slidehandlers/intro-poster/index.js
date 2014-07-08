var events = require('events'),
	util = require('util'),
	SlideHandler = require('../SlideHandler');

function IntroPosterSlideHandler(slide) {
	SlideHandler.call(this, slide);
	console.log('[IntroPosterSlideHandler] constructor');
}

util.inherits(IntroPosterSlideHandler, SlideHandler);

module.exports = IntroPosterSlideHandler;