module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ShakeYourPhones = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[ShakeYourPhones] init");

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=shake-your-phones"
			});

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);
			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);

			this.socket.on(Constants.SHAKE_YOUR_PHONES_CLIENT_ADDED, $.proxy(this.clientAddedHandler, this));
			this.socket.on(Constants.SHAKE_YOUR_PHONES_CLIENT_REMOVED, $.proxy(this.clientRemovedHandler, this));
			this.socket.on(Constants.SHAKE_YOUR_PHONES_CLIENT_UPDATE, $.proxy(this.clientUpdateHandler, this));
			this.socket.on(Constants.SHAKE_YOUR_PHONES_CLIENT_LIST, $.proxy(this.clientListHandler, this));

			$('.substate-intro .btn').on('click', $.proxy(this.startClickHandler, this));

			this.showCurrentState();
		},

		socketConnectHandler: function() {
		},

		socketDisconnectHandler: function() {
		},

		setSubstateHandler: function(substate) {
			if(this.substate !== substate) {
				this.substate = substate;
				this.showCurrentState();
			}
		},

		startClickHandler: function() {
			this.socket.emit(Constants.SET_SUBSTATE, Constants.SHAKE_YOUR_PHONES_GAME);
		},

		clientAddedHandler: function(clientInfo) {
			console.log('[ShakeYourPhones] client added', clientInfo);
		},

		clientRemovedHandler: function(clientInfo) {
			console.log('[ShakeYourPhones] client removed', clientInfo);
		},

		clientUpdateHandler: function(clientInfo) {
			console.log('[ShakeYourPhones] client update', clientInfo);
		},

		clientListHandler: function(list) {
			console.log('[ShakeYourPhones] client list', list);
		},

		showCurrentState: function() {
			$('.substate').removeClass('active');
			if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
				$('.substate-game').addClass('active');
			} else if(this.substate === Constants.SHAKE_YOUR_PHONES_FINISHED) {
				$('.substate-finished').addClass('active');
			} else {
				$('.substate-intro').addClass('active');
			}
		}
	});

	return ShakeYourPhones;

})();