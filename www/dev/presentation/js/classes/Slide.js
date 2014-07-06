module.exports = (function(){
	var Class = require('core/Class');

	var Slide = Class.extend({
		init: function(data) {
			console.log("[Slide] init");
			this.data = data;
			this.name = this.data.name;
		},
	});

	return Slide;

})();