module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	function ChildAppEditor(name, type) {
		ContentBase.call(this, name);
		this.type = type;

		this.slideControlEnabled = false;
		console.log("[ChildAppEditor] init");

		this.codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
			lineNumbers: true,
			mode: "javascript",
			extraKeys: {"Ctrl-Space": "autocomplete"}
	    });

	    $('.btn-save').on('click', $.proxy(this.saveClickHandler, this));
	    $('.btn-run').on('click', $.proxy(this.runClickHandler, this));
	}

	ChildAppEditor.prototype = Object.create(ContentBase.prototype);

	ChildAppEditor.prototype.saveClickHandler = function() {
		var code = this.codeMirror.getValue();
		this.postMessage({
			action: Constants.CHILD_APP_SAVE_CODE,
			code: code,
			type: this.type
		});
		this.postMessage({
			action: Constants.OPEN_COMMAND_LINE
		});
	};

	ChildAppEditor.prototype.runClickHandler = function() {
		var code = this.codeMirror.getValue();
		this.postMessage({
			action: Constants.CHILD_APP_RUN_CODE,
			code: code,
			type: this.type
		});
		this.postMessage({
			action: Constants.OPEN_CAMERA
		});
	};

	return ChildAppEditor;

})();