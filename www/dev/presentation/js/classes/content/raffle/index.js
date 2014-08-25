module.exports = (function(){
	var ContentBase = require('../ContentBase');
	var Constants = require('Constants');

	var Raffle = ContentBase.extend({
		tweets: [],
		init: function(name) {
			this._super(name);
			console.log("[Raffle] init");
			this._socketConnectHandler = $.proxy(this.socketConnectHandler, this);

			$('.btn').on('click', $.proxy(this.pickTweetHandler, this));

			this.socket.on('connect', this._socketConnectHandler);
			this.socket.on(Constants.GET_ALL_TWEETS_RESULT, $.proxy(this.getTweetsResultHandler, this));
		},

		socketConnectHandler: function() {
			this.socket.emit(Constants.GET_ALL_TWEETS);
		},

		getTweetsResultHandler: function(tweets) {
			this.tweets = tweets;
			$('.btn').toggle((this.tweets.length > 0));
		},

		pickTweetHandler: function() {
			if(this.tweets.length > 0) {
				var random = Math.floor(Math.random() * this.tweets.length);
				var winningTweet = this.tweets[random];
				this.displayTweet(winningTweet);
				this.tweets.splice(random, 1);
			}
			$('.btn').toggle((this.tweets.length > 0));
		},

		displayTweet: function(tweet) {
			console.log($('.winning-tweet-image'), tweet.image);
			$('.winning-tweet-image').css('background-image', 'url(' + tweet.image + ')');
			$('.winning-tweet-user-name').text(tweet.name);
			$('.winning-tweet-user-nick').text(tweet.user);
			$('.winning-tweet-text').text(tweet.text);
			$('.winning-tweet').show();
		}
	});

	return Raffle;

})();