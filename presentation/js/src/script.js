(function(){

	var Presentation = require('./classes/Presentation');
	var data = require('../../../data.json');

  function init() {
  	if($('#presentation').length > 0) {
  		new Presentation(data, 'presentation');
  	}
  }

	init();

})();