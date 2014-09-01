module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var ReactPhones = ContentBase.extend({
		gameDuration: 11, //game lasts 11 seconds
		init: function(name) {
			this._super(name);
			console.log("[ReactPhones] init");

			this.clientsMap = {};
			this.music = $('#music')[0];

			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);

			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);

			this.socket.on(Constants.REACT_PHONES_CLIENT_ADDED, $.proxy(this.clientAddedHandler, this));
			this.socket.on(Constants.REACT_PHONES_CLIENT_REMOVED, $.proxy(this.clientRemovedHandler, this));
			this.socket.on(Constants.REACT_PHONES_CLIENT_UPDATE, $.proxy(this.clientUpdateHandler, this));
			this.socket.on(Constants.REACT_PHONES_CLIENT_LIST, $.proxy(this.clientListHandler, this));

			$('.substate-intro .btn').on('click', $.proxy(this.startClickHandler, this));
			$('.substate-finished .btn').on('click', $.proxy(this.winnerClickHandler, this));

			this.showCurrentState();
		},

		setServerInfo: function(ip, port) {
			this._super(ip, port);
			$('#ip').text('http://' + ip);
		},

		setSubstateHandler: function(substate) {
			if(this.substate !== substate) {
				this.substate = substate;
				this.showCurrentState();
			}
		},

		startClickHandler: function() {
			this.socket.emit(Constants.SET_SUBSTATE, Constants.REACT_PHONES_GAME);
		},

		winnerClickHandler: function() {
			this.socket.emit(Constants.SELECT_WINNER);
		},

		clientAddedHandler: function(clientInfo) {
			console.log('[ReactPhones] client added', clientInfo);
			this.clientsMap[clientInfo.id] = clientInfo;
			this.numClientsChanged();
		},

		clientRemovedHandler: function(clientInfo) {
			console.log('[ReactPhones] client removed', clientInfo);
			this.clientsMap[clientInfo.id].$div.remove();
			delete this.clientsMap[clientInfo.id];
			this.numClientsChanged();
		},

		clientUpdateHandler: function(clientInfo) {
			//console.log('[ReactPhones] client update', clientInfo);
			$.extend(this.clientsMap[clientInfo.id], clientInfo);
		},

		clientListHandler: function(list) {
			console.log('[ReactPhones] client list', list);
			this.clientsMap = {};
			for (var i = list.length - 1; i >= 0; i--) {
				this.clientsMap[list[i].id] = list[i];
			}
			this.numClientsChanged();
		},

		numClientsChanged: function() {
			var numClients = 0;
			$.each(this.clientsMap, function(key, value){
				numClients++;
			});
			console.log('[ReactPhones] num clients:', numClients);
			$('#connections span').text(numClients);
		},

		showCurrentState: function() {
			$('.substate').removeClass('active');
			$('body').css({
				backgroundImage: 'none'
			});
			if(this.substate === Constants.REACT_PHONES_GAME) {
				this.music.play();
				$('.substate-game .countdown').html(this.gameDuration);
				$('.substate-game').addClass('active');
				this.countDownTimeout = setTimeout($.proxy(this.countDownHandler, this, this.gameDuration - 1), 1000);
			} else if(this.substate === Constants.REACT_PHONES_FINISHED) {
				$('.substate-finished').addClass('active');
			} else {
				$('body').css({
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'contain',
					backgroundPosition: 'center center',
					backgroundImage: 'url(images/iphone-connections.png)'
				});
				$('.substate-intro').addClass('active');
			}
		},

		countDownHandler: function(timeLeft) {
			$('.substate-game .countdown').html(timeLeft);
			if(timeLeft > 0) {
				this.countDownTimeout = setTimeout($.proxy(this.countDownHandler, this, timeLeft - 1), 1000);
			} else {
				this.socket.emit(Constants.SET_SUBSTATE, Constants.REACT_PHONES_FINISHED);
			}
		},

		drawLoop: function() {
			if(this.substate === Constants.REACT_PHONES_GAME) {
				/*
				$.each(this.clientsMap, function(key, value){
					var target = 3 * Math.max(10, value.maximumMotion);
					value.size += (target - value.size) * 0.2;
					value.$div.css({
						width: value.size + 'px',
						height: value.size + 'px'
					});
				});
				*/
			}
		},
	});

	return ReactPhones;

})();