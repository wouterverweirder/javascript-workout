module.exports = (function(){
	var Class = require('core/Class');

	var Slide = Class.extend({
		init: function(data) {
			this.data = data;
			this.name = this.data.name;
		},
		attachToIframe: function(iframe, src) {
			$(iframe).attr('name', this.name);
			if(src !== $(iframe).attr('src')) {
				$(iframe).attr('src', src);
			}
		}
	});

	return Slide;

})();