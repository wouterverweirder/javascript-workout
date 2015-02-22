(function(){

	var Presentation = require('./classes/Presentation');

  function init() {
  	if($('#presentation').length > 0) {
      initPresentation();
  	}
  }

  function initPresentation() {
    function getSettings(cb) {
      $.getJSON('../settings.json')
      .done(function(result){
        settings = result;
        cb();
      })
      .error(function(err){
        cb();
      });
    }

    function getData(cb) {
      $.getJSON('../data.json')
      .done(function(result){
        console.log("data result");
        data = result;
        cb();
      })
      .error(function(err){
        cb();
      });
    }

    var settings = {};
    var data = {};

    getSettings(getData.bind(this, function(){
      new Presentation(data, 'presentation', settings);
    }));

  }

	init();

})();