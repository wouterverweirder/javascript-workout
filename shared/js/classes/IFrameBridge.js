module.exports = (function(){
	function getIframeWindow(iframe_object) {
		var doc;

		if (iframe_object.contentWindow) {
			return iframe_object.contentWindow;
		}

		if (iframe_object.window) {
			return iframe_object.window;
		} 

		if (!doc && iframe_object.contentDocument) {
			doc = iframe_object.contentDocument;
		} 

		if (!doc && iframe_object.document) {
			doc = iframe_object.document;
		}

		if (doc && doc.defaultView) {
		 return doc.defaultView;
		}

		if (doc && doc.parentWindow) {
			return doc.parentWindow;
		}

		return undefined;
	}

	function IFrameBridge(data) {
		this.data = data;
		this.name = this.data.name;
	}

	IFrameBridge.prototype.isAlreadyCorrectlyAttached = function(iframe, src) {
		return (this.iframe === iframe && $(iframe).attr('name') === this.name && $(iframe).attr('src') === src);
	};

	IFrameBridge.prototype.attachToIframe = function(iframe, src, cb) {
		this.iframe = iframe;
		$(iframe).off('load');
		$(iframe).attr('name', this.name);
		if(src !== $(iframe).attr('src')) {
			$(iframe).on('load', (function(event){
				this.tryToPostMessage({
					action: 'setState',
					state: this.state
				});
				cb();
			}).bind(this));
			$(iframe).attr('src', src);
		}
	};

	IFrameBridge.prototype.setState = function(state) {
		this.state = state;
		this.tryToPostMessage({
			action: 'setState',
			state: this.state
		});
	};

	IFrameBridge.prototype.tryToPostMessage = function(message) {
		if(!this.iframe) {
			return;
		}
		var w = getIframeWindow(this.iframe);
		if(w) {
			w.postMessage(message, "*");
		}
	};

	return IFrameBridge;
})();