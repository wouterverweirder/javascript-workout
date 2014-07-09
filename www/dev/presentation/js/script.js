(function(){

	var presentation;

	function init() {
		if($('#presentation').length > 0) {
			var Presentation = require('./classes/Presentation');
			presentation = new Presentation();
		}
	}

	init();

})();