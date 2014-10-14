var events = require('events'),
	util = require('util'),
	fs = require('fs'),
	Twit = require('twit'),
	Config = require('../config')
	Constants = require('../../shared/Constants')
	data = require('../../data.json');

var instance = false;

function AppModel() {
	events.EventEmitter.call(this);
	this._currentSlideIndex = 0;
}

util.inherits(AppModel, events.EventEmitter);

AppModel.CURRENT_SLIDE_INDEX_CHANGED = 'currentSlideIndexChanged';

AppModel.getInstance = function() {
	if(!instance) {
		instance = new AppModel();
		instance.init();
	}
	return instance;
}

AppModel.prototype.init = function() {
	this.loadSlidesData();

	this.twit = new Twit({
		consumer_key:         Config.twitterConsumerKey
	  , consumer_secret:      Config.twitterConsumerSecret
	  , access_token:         Config.twitterAccessToken
	  , access_token_secret:  Config.twitterAccessTokenSecret
	});
	this.tweets = [];
	this.stream = this.twit.stream('statuses/filter', { track: '@wouter' });
	this.stream.on('error', function(e){
		console.log('[Twit] Error', e.code);
	});
	this.stream.on('tweet', this.onTweet.bind(this));
};

AppModel.prototype.onTweet = function(origTweet) {
	var tweet = {
		user: origTweet.user.screen_name,
		name: origTweet.user.name,
		image: origTweet.user.profile_image_url,
		text: origTweet.text
	};
	this.tweets.push(tweet);
	console.log('[AppModel] emit tweet');
	this.emit(Constants.TWEET, tweet);
};

AppModel.prototype.loadSlidesData = function() {
	this.slides = data.slides;
};

AppModel.prototype.setCurrentSlideIndex = function(value) {
	value = Math.max(0, Math.min(value, this.slides.length - 1));
	if(value !== this._currentSlideIndex) {
		this._currentSlideIndex = value;
		this.emit(AppModel.CURRENT_SLIDE_INDEX_CHANGED, this._currentSlideIndex, this.slides[this._currentSlideIndex]);
	}
};

AppModel.prototype.getCurrentSlideIndex = function() {
	return this._currentSlideIndex;
};

module.exports = AppModel;