(function(){

	function init() {
		if($('#presentation').length > 0) {
			var Presentation = require('./classes/Presentation');
			new Presentation();
		}
	}

	init();

})();