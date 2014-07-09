module.exports = (function(){
	var Class = require('core/Class');
	var Constants = require('Constants');

	var KEYCODE_LEFT = 37;
	var KEYCODE_RIGHT = 39;

	var ContentBase = Class.extend({
		init: function() {
			this.token = $.getUrlVar('token');
			window.setState = $.proxy(this.setState, this);
			$(window).on('keydown', $.proxy(this.keydownHandler, this));
		},

		setState: function(state) {
			if(state !== this.state) {
				this.state = state;
				this.onStateChanged();
			}
		},

		onStateChanged: function() {
		},

		keydownHandler: function(event) {
			switch(event.keyCode) {
				case KEYCODE_LEFT:
					parent.$('body').trigger(Constants.GO_TO_PREVIOUS_SLIDE);
					break;
				case KEYCODE_RIGHT:
					parent.$('body').trigger(Constants.GO_TO_NEXT_SLIDE);
					break;
			}
		},
	});

	return ContentBase;

})();