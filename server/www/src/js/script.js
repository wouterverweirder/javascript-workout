(function(){

	var MobilePresentation = require('./classes/MobilePresentation');

	function init(){
		if($('#presentation').length > 0) {
			//load the data.json
			$.get('/data.json').done(function(result){
				new MobilePresentation(result, 'mobile');
			});
		}
	}

	init();
})();