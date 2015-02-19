module.exports = (function(){

	var Constants = require('Constants');
	var ContentBase = require('../ContentBase');

	function ReactPhones() {
		ContentBase.call(this, 'react-phones');

		this.gameDuration = 11;
		this.clientsMap = {};
		this.music = $('#music')[0];

		$('#ip').text('jsworkout.herokuapp.com');

		$('.substate-intro .btn').on('click', this.startClickHandler.bind(this));
		$('.substate-finished .btn').on('click', this.winnerClickHandler.bind(this));

		this.setSubstate(Constants.REACT_PHONES_INTRO);
	}

	ReactPhones.prototype = Object.create(ContentBase.prototype);

	ReactPhones.prototype.setSubstate = function(substate) {
		if(this.substate !== substate) {
			this.substate = substate;
			//send substate to mobile clients
			this.postSocketMessage({
				target: {
					client: 'mobile',
					slide: 'react-phones'
				},
				content: {
					action: Constants.SET_SUBSTATE,
					substate: this.substate
				}
			});
			if(this.substate === Constants.REACT_PHONES_GAME) {
				this.resetAllReactionSpeeds();
			}
			this.showCurrentState();
		}
	};

	ReactPhones.prototype.receiveSocketMessage = function(message) {
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
					reactionSpeed: 99999999999
				};
			}, this);
			removeClientIds.forEach(function(id){
				if(this.clientsMap[id]) {
					//this.clientsMap[id].$div.remove();
				}
				delete this.clientsMap[id];
			}, this);

			this.numClientsChanged();
		} else if(message.content.action === Constants.UPDATE_REACTION_SPEED) {
			if(!message.sender) {
				return;
			}
			//message.sender.id contains the origin id
			if(!this.clientsMap[message.sender.id]) {
				return;
			}
			this.clientsMap[message.sender.id].reactionSpeed = message.content.reactionSpeed;
		}
	};

	ReactPhones.prototype.startClickHandler = function() {
		this.setSubstate(Constants.REACT_PHONES_GAME);
	};

	ReactPhones.prototype.winnerClickHandler = function() {
		//get the clienthandler with the largest motion, and blink it's screen
		var winningClient = false;
		var reactionSpeed = 99999999999;
		for(var id in this.clientsMap) {
			if(!this.clientsMap[id].speedWinner && this.clientsMap[id].reactionSpeed < reactionSpeed) {
				winningClient = this.clientsMap[id];
				reactionSpeed = winningClient.reactionSpeed;
			}
		}
		if(winningClient) {
			winningClient.speedWinner = true;
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

	ReactPhones.prototype.resetAllReactionSpeeds = function() {
		for(var id in this.clientsMap) {
			this.clientsMap[id].reactionSpeed = 99999999999;
			this.clientsMap[id].speedWinner = false;
		}
	};

	ReactPhones.prototype.numClientsChanged = function() {
		$('#connections span').text(_.keys(this.clientsMap).length);
	};

	ReactPhones.prototype.showCurrentState = function() {
		$('.substate').removeClass('active');
		$('body').css({
			backgroundImage: 'none'
		});
		if(this.substate === Constants.REACT_PHONES_GAME) {
			this.music.play();
			$('.substate-game .countdown').html(this.gameDuration);
			$('.substate-game').addClass('active');
			this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, this.gameDuration - 1), 1000);
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
	};

	ReactPhones.prototype.countDownHandler = function(timeLeft) {
		$('.substate-game .countdown').html(timeLeft);
		if(timeLeft > 0) {
			this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, timeLeft - 1), 1000);
		} else {
			this.setSubstate(Constants.REACT_PHONES_FINISHED);
		}
	};

	return ReactPhones;

})();