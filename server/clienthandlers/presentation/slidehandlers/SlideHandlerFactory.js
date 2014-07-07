var	SlideHandler = require('./SlideHandler'),
	IntroPosterSlideHandler = require('./intro-poster'),
	ShakeYourPhonesSlideHandler = require('./shake-your-phones');

module.exports = {
	createSlideHandler: function(slideName, socket) {
		switch(slideName) {
			case "intro-poster": return new IntroPosterSlideHandler(slideName, socket);
			case "shake-your-phones": return new ShakeYourPhonesSlideHandler(slideName, socket);
		}
		return new SlideHandler(slideName, socket);
	}
};