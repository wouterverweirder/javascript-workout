module.exports = (function(){
	var Class = require('core/Class');

	var ContentBase = Class.extend({
		init: function() {
			console.log("[ContentBase] init");
			this.token = $.getUrlVar('token');
			window.setState = $.proxy(this.setState, this);
		},
		setState: function(state) {
			console.log('[ContentBase] set state to', state);
		}
	});

	return ContentBase;

})();