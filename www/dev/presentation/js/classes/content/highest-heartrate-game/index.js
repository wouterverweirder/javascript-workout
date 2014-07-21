module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var HighestHeartrateGame = ContentBase.extend({
		init: function() {
			this._super();
			console.log("[HighestHeartrateGame] init");

			this.socket = io.connect('/', {
				query: 'token=' + this.token + "&slide=highest-heartrate-game"
			});

			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);
			this._socketDisconnectHandler = $.proxy(this.socketDisconnectHandler, this);
			this._setSubstateHandler = $.proxy(this.setSubstateHandler, this);

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on('disconnect', this._socketDisconnectHandler);
			this.socket.on(Constants.SET_SUBSTATE, this._setSubstateHandler);

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
		}
	});

	return HighestHeartrateGame;

})();