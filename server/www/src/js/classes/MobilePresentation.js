module.exports = (function(){

	var Constants = require('Constants');

	var PresentationBase = require('shared/Presentation');
	var MobileServerBridge = require('shared/MobileServerBridge');
	
	function MobilePresentation(data, role) {
		this.$overlay = $('#overlay');
		PresentationBase.call(this, data, role);
	}

	MobilePresentation.prototype = Object.create(PresentationBase.prototype);

	MobilePresentation.prototype.createMobileServerBridge = function() {
		return new MobileServerBridge(this, '');
	};

	MobilePresentation.prototype.handleMobileServerMessage = function(message) {
		if(!message.content) {
			return;
		}
		if(message.content.action == 'setCurrentSlideIndex') {
			this.setCurrentSlideIndex(message.content.currentSlideIndex);
		} else if(message.content.action == Constants.BLINK) {
			this.blink(message.content.text, message.content.backgroundColor);
		}
	};

	MobilePresentation.prototype.setCurrentSlideIndex = function(index) {
		PresentationBase.prototype.setCurrentSlideIndex.call(this, index);
		this.$overlay.removeClass('active');
		if(this.blinkInterval) {
			clearInterval(this.blinkInterval);
		}
	};

	MobilePresentation.prototype.blink = function(text, backgroundColor) {
		//overlay important, blinking text
		this.$overlay.find('.content').html(text);
		this.$overlay.addClass('active');
		if(this.blinkInterval) {
			clearInterval(this.blinkInterval);
		}
		this.blinkInterval = setInterval(this.blinkToggle.bind(this, backgroundColor), 500);
	};

	MobilePresentation.prototype.blinkToggle = function(backgroundColor) {
		this.$overlay.toggleClass('blink-on');
		if(this.$overlay.hasClass('blink-on')) {
			this.$overlay.css('background-color', backgroundColor);
		} else {
			this.$overlay.css('background-color', false);
		}
	};

	return MobilePresentation;

})();