var events = require('events'),
	util = require('util'),
	SlideHandler = require('../SlideHandler');

function ShakeYourPhonesSlideHandler(slide) {
	SlideHandler.call(this, slide);
	//send heart rate info to the client
	console.log('[ShakeYourPhonesSlideHandler] constructor');
}

util.inherits(ShakeYourPhonesSlideHandler, SlideHandler);

module.exports = ShakeYourPhonesSlideHandler;