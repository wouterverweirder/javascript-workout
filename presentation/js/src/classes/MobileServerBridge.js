module.exports = (function(){

	var MobileServerBridgeBase = require('shared/MobileServerBridge');

	var Config = require('./config');
	var Constants = require('Constants');

	function MobileServerBridge(presentation, url) {
		MobileServerBridgeBase.call(this, presentation, url);
		bean.on(this.presentation, Constants.SET_CURRENT_SLIDE_INDEX, this.currentSlideIndexChanged.bind(this));
	}

	MobileServerBridge.prototype = Object.create(MobileServerBridgeBase.prototype);

	MobileServerBridge.prototype.getLoginCredentials = function() {
		return {
			email: Config.mobileServerUsername,
			password: Config.mobileServerPassword,
		};
	};

	MobileServerBridge.prototype.socketConnectHandler = function() {
		MobileServerBridgeBase.prototype.socketConnectHandler.call(this);
		this.tryToSend(Constants.MESSAGE, {
			target: {
				client: 'mobile',
			},
			content: {
				action: Constants.SET_CURRENT_SLIDE_INDEX,
				currentSlideIndex: this.presentation.currentSlideIndex
			}
		});
	};

	MobileServerBridge.prototype.currentSlideIndexChanged = function(currentSlideIndex) {
		this.tryToSend(Constants.MESSAGE, {
			target: {
				client: 'mobile',
			},
			content: {
				action: Constants.SET_CURRENT_SLIDE_INDEX,
				currentSlideIndex: currentSlideIndex
			}
		});
	};

	return MobileServerBridge;

})();