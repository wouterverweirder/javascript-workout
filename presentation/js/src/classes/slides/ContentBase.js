module.exports = (function(){

	var SharedContentBase = require('shared/ContentBase');
	var Constants = require('Constants');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	function ContentBase(name) {
		SharedContentBase.call(this, name);
		this.slideControlEnabled = true;
		$(window).on('keydown', this.keydownHandler.bind(this));			
	}

	ContentBase.prototype = Object.create(SharedContentBase.prototype);

	ContentBase.prototype.keydownHandler = function(event) {
		if(this.slideControlEnabled) {
			switch(event.keyCode) {
				case KEYCODE_LEFT:
					this.postMessage({action: Constants.GO_TO_PREVIOUS_SLIDE});
					break;
				case KEYCODE_RIGHT:
					this.postMessage({action: Constants.GO_TO_NEXT_SLIDE});
					break;
			}
		}
	};

	return ContentBase;

})();