module.exports = (function(){
	
	var Constants = {
		GO_TO_PREVIOUS_SLIDE : 'goToPreviousSlide',
		GO_TO_NEXT_SLIDE : 'goToNextSlide',
		SET_CURRENT_SLIDE_INDEX : 'setCurrentSlideIndex',

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

		UPDATE_MAXIMUM_MOTION : 'updateMaximumMotion',
		HEART_RATE_POLAR : 'heartRatePolar',
		HEART_RATE_SPARK : 'heartRateSpark',
		SELECT_WINNER : 'selectWinner',
		BLINK : 'blink'
	};

	return Constants;

})();