module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var TesselAppEditor = ContentBase.extend({
		init: function(name) {
			this._super(name);
			this.slideControlEnabled = false;
			console.log("[TesselAppEditor] init");

			this.codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
				lineNumbers: true,
				mode: "javascript",
				extraKeys: {"Ctrl-Space": "autocomplete"}
		    });

		    $('.btn-save').on('click', $.proxy(this.saveClickHandler, this));
		    $('.btn-run').on('click', $.proxy(this.runClickHandler, this));
		},

		saveClickHandler: function() {
			//send the content to nodejs to save
			var code = this.codeMirror.getValue();
			this.socket.emit(Constants.CHILD_APP_SAVE_CODE, {code: code, type: 'tessel'});
			//open the command line
			parent.$('body').trigger(Constants.OPEN_COMMAND_LINE);
		},

		runClickHandler: function() {
			//send the content to nodejs to save
			var code = this.codeMirror.getValue();
			this.socket.emit(Constants.CHILD_APP_RUN_CODE, {code: code, type: 'tessel'});
			//open the camera window
			parent.$('body').trigger(Constants.OPEN_CAMERA);
		}
	});

	return TesselAppEditor;

})();