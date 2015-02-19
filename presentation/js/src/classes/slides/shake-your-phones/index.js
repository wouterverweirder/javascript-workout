module.exports = (function(){

	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	function ShakeYourPhones() {
		ContentBase.call(this, 'shake-your-phones');

		this.gameDuration = 10; //game lasts 10 seconds
		this.clientsMap = {};

		$('#ip').text('jsworkout.herokuapp.com');

		$('.substate-intro .btn').on('click', this.startClickHandler.bind(this));
		$('.substate-finished .btn').on('click', this.winnerClickHandler.bind(this));

		this.setSubstate(Constants.SHAKE_YOUR_PHONES_INTRO);
	}

	ShakeYourPhones.prototype = Object.create(ContentBase.prototype);

	ShakeYourPhones.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			//send substate to mobile clients
			this.postSocketMessage({
				target: {
					client: 'mobile',
					slide: 'shake-your-phones'
				},
				content: {
					action: Constants.SET_SUBSTATE,
					substate: this.substate
				}
			});
			if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
				this.resetAllMaximumMotions();
			}
			this.showCurrentState();
		}
	};

	ShakeYourPhones.prototype.receiveSocketMessage = function(message) {
		if(!message.content) {
			return;
		}
		if(message.content.action === 'updateRoomList') {
			//message.content.ids is an array with ids in this room
			var clientMapIds = _.keys(this.clientsMap);
			//which ids are new? (in message.content.ids but not in clientsMap)
			var newClientIds = _.difference(message.content.ids, clientMapIds);
			//which ids need to be removed? (in clientsMap but not in message.content.ids)
			var removeClientIds = _.difference(clientMapIds, message.content.ids);
			//update our map
			newClientIds.forEach(function(id){
				this.clientsMap[id] = {
					id: id,
					maximumMotion: 0,
					size: 10,
					$div: $('<div class="circle">').css({
						position: 'absolute',
						left: Math.random() * 100 + '%',
						top: Math.random() * 100 + '%',
						backgroundColor: 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ', 0.5)',
						width: '10px',
						height: '10px'
					})
				};
				$('.background .substate-game').append(this.clientsMap[id].$div);
			}, this);
			removeClientIds.forEach(function(id){
				if(this.clientsMap[id]) {
					this.clientsMap[id].$div.remove();
				}
				delete this.clientsMap[id];
			}, this);

			this.numClientsChanged();
		} else if(message.content.action === Constants.UPDATE_MAXIMUM_MOTION) {
			if(!message.sender) {
				return;
			}
			//message.sender.id contains the origin id
			if(!this.clientsMap[message.sender.id]) {
				return;
			}
			this.clientsMap[message.sender.id].maximumMotion = message.content.maximumMotion;
		}
	};

	ShakeYourPhones.prototype.startClickHandler = function() {
		this.setSubstate(Constants.SHAKE_YOUR_PHONES_GAME);
	};

	ShakeYourPhones.prototype.winnerClickHandler = function() {
		//get the clienthandler with the largest motion, and blink it's screen
		var winningClient = false;
		var maximumMotion = -1;
		for(var id in this.clientsMap) {
			if(!this.clientsMap[id].shakeWinner && this.clientsMap[id].maximumMotion > maximumMotion) {
				winningClient = this.clientsMap[id];
				maximumMotion = winningClient.maximumMotion;
			}
		}
		if(winningClient) {
			winningClient.shakeWinner = true;
			//send message to this client
			this.postSocketMessage({
				target: {
					client: winningClient.id
				},
				content: {
					action: Constants.BLINK,
					text: '<h1>Spectacular, You Win!</h1>',
					backgroundColor: 'red'
				}
			});
		}
	};

	ShakeYourPhones.prototype.resetAllMaximumMotions = function() {
		for(var id in this.clientsMap) {
			this.clientsMap[id].maximumMotion = 0;
			this.clientsMap[id].shakeWinner = false;
		}
	};

	ShakeYourPhones.prototype.numClientsChanged = function() {
		$('#connections span').text(_.keys(this.clientsMap).length);
	};

	ShakeYourPhones.prototype.showCurrentState = function() {
		$('.substate').removeClass('active');
		$('body').css({
			backgroundImage: 'none'
		});
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			$('.substate-game .countdown').html(this.gameDuration);
			$('.substate-game').addClass('active');
			this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, this.gameDuration - 1), 1000);
		} else if(this.substate === Constants.SHAKE_YOUR_PHONES_FINISHED) {
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
	};

	ShakeYourPhones.prototype.countDownHandler = function(timeLeft) {
		$('.substate-game .countdown').html(timeLeft);
		if(timeLeft > 0) {
			this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, timeLeft - 1), 1000);
		} else {
			this.setSubstate(Constants.SHAKE_YOUR_PHONES_FINISHED);
		}
	};

	ShakeYourPhones.prototype.drawLoop = function() {
		if(this.substate === Constants.SHAKE_YOUR_PHONES_GAME) {
			$.each(this.clientsMap, function(key, value){
				var target = 3 * Math.max(10, value.maximumMotion);
				value.size += (target - value.size) * 0.2;
				value.$div.css({
					width: value.size + 'px',
					height: value.size + 'px'
				});
			});
		}
	};

	return ShakeYourPhones;

})();