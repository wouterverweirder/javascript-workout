module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ShakeYourPhones = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[ShakeYourPhones] init");

			this.clientsMap = {};

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
			//console.log('[ShakeYourPhones] client added', clientInfo);
			this.clientsMap[clientInfo.id] = clientInfo;
			this.clientsMap[clientInfo.id].size = 0;
			this.clientsMap[clientInfo.id].$div = $('<div class="circle">').css({
				position: 'absolute',
				left: Math.random() * 100 + '%',
				top: Math.random() * 100 + '%',
				backgroundColor: 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ', 0.5)',
				width: '10px',
				height: '10px'
			});
			$('.background .substate-game').append(this.clientsMap[clientInfo.id].$div);
		},

		clientRemovedHandler: function(clientInfo) {
			//console.log('[ShakeYourPhones] client removed', clientInfo);
			this.clientsMap[clientInfo.id].$div.remove();
			delete this.clientsMap[clientInfo.id];
		},

		clientUpdateHandler: function(clientInfo) {
			//console.log('[ShakeYourPhones] client update', clientInfo);
			$.extend(this.clientsMap[clientInfo.id], clientInfo);
		},

		clientListHandler: function(list) {
			console.log('[ShakeYourPhones] client list', list);
			this.clientsMap = {};
			$('.background .substate-game').html('');
			for (var i = list.length - 1; i >= 0; i--) {
				this.clientsMap[list[i].id] = list[i];
				this.clientsMap[list[i].id].size = 0;
				this.clientsMap[list[i].id].$div = $('<div class="circle">').css({
					position: 'absolute',
					left: Math.random() * 100 + '%',
					top: Math.random() * 100 + '%',
					backgroundColor: 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ', 0.5)',
					width: '10px',
					height: '10px'
				});
				$('.background .substate-game').append(this.clientsMap[list[i].id].$div);
			}
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
		},

		drawLoop: function() {
			$.each(this.clientsMap, function(key, value){
				var target = 3 * value.maximumMotion;
				value.size += (target - value.size) * 0.2;
				value.$div.css({
					width: value.size + 'px',
					height: value.size + 'px'
				});
			});
		},
	});

	return ShakeYourPhones;

})();