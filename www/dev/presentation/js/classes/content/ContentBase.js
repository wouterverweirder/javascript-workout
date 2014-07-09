module.exports = (function(){
	var Class = require('core/Class');

	var ContentBase = Class.extend({
		init: function() {
			this.token = $.getUrlVar('token');
			window.setState = $.proxy(this.setState, this);
		},
		setState: function(state) {
			if(state !== this.state) {
				this.state = state;
				this.onStateChanged();
			}
		},
		onStateChanged: function() {
		}
	});

	return ContentBase;

})();