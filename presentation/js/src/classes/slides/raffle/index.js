module.exports = (function(){

	var Constants = require('Constants');
	var ContentBase = require('../ContentBase');

	function Raffle() {
		ContentBase.call(this, 'raffle');
		console.log("[Raffle] init");
		$('.btn').on('click', this.pickTweetHandler.bind(this));
	}

	Raffle.prototype = Object.create(ContentBase.prototype);

	Raffle.prototype.onStateChanged = function() {
		if(this.state === Constants.STATE_ACTIVE) {
			//ask for tweets
			this.postMessage({action: Constants.GET_ALL_TWEETS});
		}
	};

	Raffle.prototype.handleMessage = function(data) {
		if(data.action === Constants.GET_ALL_TWEETS_RESULT) {
			this.tweets = data.tweets;
			$('.btn').toggle((this.tweets.length > 0));
		}
	};

	Raffle.prototype.pickTweetHandler = function() {
		if(this.tweets.length > 0) {
			var random = Math.floor(Math.random() * this.tweets.length);
			var winningTweet = this.tweets[random];
			this.displayTweet(winningTweet);
			this.tweets.splice(random, 1);
		}
		$('.btn').toggle((this.tweets.length > 0));
	};

	Raffle.prototype.displayTweet = function(tweet) {
		console.log($('.winning-tweet-image'), tweet.image);
		$('.winning-tweet-image').css('background-image', 'url(' + tweet.image + ')');
		$('.winning-tweet-user-name').text(tweet.name);
		$('.winning-tweet-user-nick').text(tweet.user);
		$('.winning-tweet-text').text(tweet.text);
		$('.winning-tweet').show();
	};

	return Raffle;

})();