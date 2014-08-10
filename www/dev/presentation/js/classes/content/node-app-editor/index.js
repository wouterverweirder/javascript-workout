module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var NodeAppEditor = ContentBase.extend({
		init: function(name) {
			this._super(name);
			this.slideControlEnabled = false;
			console.log("[NodeAppEditor] init");

			this.codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
				lineNumbers: true,
				mode: "javascript",
				extraKeys: {"Ctrl-Space": "autocomplete"}
		    });

		    $('.btn').on('click', $.proxy(this.runClickHandler, this));
		},

		runClickHandler: function() {
			//send the content to nodejs for execution
			var code = this.codeMirror.getValue();
			this.socket.emit(Constants.CHILD_APP_RUN_CODE, code);
		}
	});

	return NodeAppEditor;

})();