var events = require('events'),
	util = require('util'),
	SlideHandler = require('../SlideHandler'),
	Constants = require('../../../../../shared/Constants');

function IntroPosterSlideHandler(slideName, socket) {
	SlideHandler.call(this, slideName, socket);
	//send heart rate info to the client
	console.log('[IntroPosterSlideHandler] constructor');
}

util.inherits(IntroPosterSlideHandler, SlideHandler);

module.exports = IntroPosterSlideHandler;