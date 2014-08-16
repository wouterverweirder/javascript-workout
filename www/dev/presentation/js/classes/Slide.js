module.exports = (function(){
	var Class = require('core/Class');
	//var Constants = require('Constants');

	var Slide = Class.extend({
		init: function(data) {
			this.data = data;
			this.name = this.data.name;
			this._iframeLoadHandler = $.proxy(this.iframeLoadHandler, this);
		},
		attachToIframe: function(iframe, src) {
			this.iframe = iframe;
			$(iframe).off('load', this._iframeLoadHandler);
			$(iframe).attr('name', this.name);
			if(src !== $(iframe).attr('src')) {
				$(iframe).on('load', this._iframeLoadHandler);
				$(iframe).attr('src', src);
			}
		},
		setState: function(state) {
			this.state = state;
			var w = getIframeWindow(this.iframe);
			if(w && w.setState) {
				w.setState(state);
			}
		},
		setServerInfo: function(ip, port) {
			this.ip = ip;
			this.port = port;
			var w = getIframeWindow(this.iframe);
			if(w && w.setServerInfo) {
				w.setServerInfo(ip, port);
			}
		},
		iframeLoadHandler: function(event) {
			var w = getIframeWindow(this.iframe);
			if(w) {
				if(w.setState) {
					w.setState(this.state);
				}
			}
		}
	});

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

	return Slide;

})();