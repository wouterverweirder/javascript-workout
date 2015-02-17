module.exports = (function(){
	
	var Constants = {
		GO_TO_PREVIOUS_SLIDE : 'goToPreviousSlide',
		GO_TO_NEXT_SLIDE : 'goToNextSlide',
		SET_SLIDES : 'setSlides',
		SET_CURRENT_SLIDE_INDEX : 'setCurrentSlideIndex',

		MESSAGE : 'message',
		SOCKET_SEND : 'socketSend',
		SOCKET_RECEIVE : 'socketReceive',
		JOIN_SLIDE_ROOM : 'joinSlideRoom',
		LEAVE_SLIDE_ROOM : 'leaveSlideRoom',

		ROLE_PRESENTATION : 'presentation',
		ROLE_MOBILE : 'mobile',

		STATE_ACTIVE : 'active',
		STATE_INACTIVE : 'inactive',

		SET_SUBSTATE : 'setSubstate',

		SHAKE_YOUR_PHONES_INTRO : 'shakeYourPhonesIntro',
		SHAKE_YOUR_PHONES_GAME : 'shakeYourPhonesGame',
		SHAKE_YOUR_PHONES_FINISHED : 'shakeYourPhonesFinished',

		SHAKE_YOUR_PHONES_CLIENT_ADDED : 'shakeYourPhonesClientAdded',
		SHAKE_YOUR_PHONES_CLIENT_REMOVED : 'shakeYourPhonesClientRemoved',
		SHAKE_YOUR_PHONES_CLIENT_LIST : 'shakeYourPhonesClientList',
		SHAKE_YOUR_PHONES_CLIENT_UPDATE : 'shakeYourPhonesClientUpdate',

		HIGHEST_HEARTRATE_GAME_INTRO : 'highestHeartrateGameIntro',
		HIGHEST_HEARTRATE_GAME_GAME : 'highestHeartrateGameGame',
		HIGHEST_HEARTRATE_GAME_FINISHED : 'highestHeartrateGameFinished',

		LOWEST_HEARTRATE_GAME_INTRO : 'lowestHeartrateGameIntro',
		LOWEST_HEARTRATE_GAME_GAME : 'lowestHeartrateGameGame',
		LOWEST_HEARTRATE_GAME_FINISHED : 'lowestHeartrateGameFinished',

		REACT_PHONES_INTRO : 'reactPhonesIntro',
		REACT_PHONES_GAME : 'reactPhonesGame',
		REACT_PHONES_FINISHED : 'reactPhonesFinished',

		REACT_PHONES_CLIENT_ADDED : 'reactPhonesClientAdded',
		REACT_PHONES_CLIENT_REMOVED : 'reactPhonesClientRemoved',
		REACT_PHONES_CLIENT_LIST : 'reactPhonesClientList',
		REACT_PHONES_CLIENT_UPDATE : 'reactPhonesClientUpdate',

		DANCE_PAD_GAME_INTRO : 'dancePadGameIntro',
		DANCE_PAD_GAME_GAME : 'dancePadGameGame',
		DANCE_PAD_GAME_FINISHED : 'dancePadGameFinished',

		UPDATE_MAXIMUM_MOTION : 'updateMaximumMotion',
		UPDATE_REACTION_SPEED : 'updateReactionSpeed',
		HEART_RATE_POLAR : 'heartRatePolar',
		HEART_RATE_SPARK : 'heartRateSpark',
		SELECT_WINNER : 'selectWinner',
		BLINK : 'blink',

		TWEET : 'tweet',
		GET_ALL_TWEETS : 'getAllTweets',
		GET_ALL_TWEETS_RESULT : 'getAllTweetsResult',

		CHILD_APP_SAVE_CODE : 'childAppSaveCode',
		CHILD_APP_RUN_CODE : 'childAppRunCode',
		OPEN_COMMAND_LINE: 'openCommandLine',
		OPEN_CAMERA: 'openCamera'
	};

	return Constants;

})();