module.exports = (function(){

	var Constants = require('Constants');

	function MobileServerBridge(presentation, url) {
		this.presentation = presentation;
		this.url = url;
		this.connect();
	}

	MobileServerBridge.prototype.connect = function() {
		console.log('MobileServerBridge.connect');
		$.post(this.url + '/login', this.getLoginCredentials()).done(this.loginHandler.bind(this))
		.fail((function() {
			//retry after one second
			setTimeout((function(){
				this.connect();
			}).bind(this), 1000);
	  }).bind(this));
	};

	MobileServerBridge.prototype.getLoginCredentials = function() {
		return {};
	};

	MobileServerBridge.prototype.loginHandler = function(result) {
		this.token = result.token;
		this.socket = io(this.url, {
			query: 'token=' + this.token,
			reconnection: false,
			forceNew: true
		});
		this.socket.on('connect', this.socketConnectHandler.bind(this));
		this.socket.on('disconnect', this.socketDisconnectHandler.bind(this));
		this.socket.on('message', this.socketMessageHandler.bind(this));
	};

	MobileServerBridge.prototype.socketConnectHandler = function() {
		console.log('MobileServerBridge.socketConnectHandler');
		this.presentation.mobileServerBridgeConnected();
	};

	MobileServerBridge.prototype.socketDisconnectHandler = function() {
		this.connect();
	};

	MobileServerBridge.prototype.tryToSend = function() {
		if(this.socket) {
			this.socket.emit.apply(this.socket, arguments);
		}
	};

	MobileServerBridge.prototype.socketMessageHandler = function(message) {
		this.presentation.mobileServerMessageHandler(message);
	};

	return MobileServerBridge;
})();