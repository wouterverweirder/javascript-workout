module.exports = (function(){

	var Constants = require('Constants');
	var IFrameBridge = require('./IFrameBridge');

	/*
	 * data: json object with slides array property
	 * role: mobile or presentation
	 */
	function Presentation(data, role) {
		this.data = data;
		this.role = role;
		this.currentSlideIndex = -1;
		this.iframes = [];
		this.numIframes = 3;
		this.iFrameBridges = [];
		this.iFrameBridgesBySlideName = {};

		this.createIFrames();
		this.createIFrameBridges(this.data);

		this.mobileServerBridge = this.createMobileServerBridge();
		window.addEventListener("message", this.iFrameMessageHandler.bind(this), false);

		this.setCurrentSlideIndex(0);
	}

	Presentation.prototype.createIFrames = function() {
		for(var i = 0; i < this.numIframes; i++) {
			var $iframe = $('<iframe class="slide-frame" />');
			this.iframes.push($iframe);
			$('#presentation').append($iframe);
		}
	};

	Presentation.prototype.createIFrameBridges = function(data) {
		var that = this;
		var numSlides = data.slides.length;
		for(var i = 0; i < numSlides; i++) {
			var iFrameBridge = this.createIframeBridge(data.slides[i]);
			this.iFrameBridges.push(iFrameBridge);
			this.iFrameBridgesBySlideName[iFrameBridge.name] = iFrameBridge;
		}
	};

	Presentation.prototype.createIframeBridge = function(slide) {
		return new IFrameBridge(slide);
	};

	Presentation.prototype.iFrameMessageHandler = function(event) {
		if(!event.data) {
			return;
		}
		switch(event.data.action) {
			case Constants.SOCKET_SEND:
				if(this.mobileServerBridge) {
					this.mobileServerBridge.tryToSend(Constants.MESSAGE, event.data.message);
				}
				break;
		}
	};

	Presentation.prototype.mobileServerBridgeConnected = function() {
		//join the rooms of the iframes
		for(var i = 0; i < this.numIframes; i++) {
			this.mobileServerBridge.tryToSend(Constants.JOIN_SLIDE_ROOM, $(this.iframes[i]).attr('name'));
		}
	};

	Presentation.prototype.mobileServerMessageHandler = function(message) {
		if(message.target.slide) {
			//slide has to handle the message
			var iFrameBridge = this.getIFrameBridgeBySlideName(message.target.slide);
			if(iFrameBridge) {
				iFrameBridge.tryToPostMessage({
					action: Constants.SOCKET_RECEIVE,
					message: message
				});
			}
		} else {
			//presentation has to handle the message
			this.handleMobileServerMessage(message);
		}
	};

	Presentation.prototype.handleMobileServerMessage = function(message) {
		console.log('[shared/Presentation] handleMobileServerMessage', message);
	};

	Presentation.prototype.getIFrameBridgeByIndex = function(index) {
		if(index >= 0 && index < this.iFrameBridges.length) {
			return this.iFrameBridges[index];
		}
		return false;
	};

	Presentation.prototype.getIFrameBridgeBySlideName = function(slideName) {
		return this.iFrameBridgesBySlideName[slideName];
	};

	Presentation.prototype.getIFrameForSlide = function(slide, slidesNotToClear) {
		if(slide) {
			var $iframe = $('iframe[name=' + slide.name + ']');
			if($iframe.length > 0) {
				return $iframe[0];
			}
			//get a free iframe
			var slideNamesNotToClear = [];
			$(slidesNotToClear).each(function(index, obj){
				slideNamesNotToClear.push(obj.name);
			});
			var $iframes = $('iframe.slide-frame');
			for (var i = $iframes.length - 1; i >= 0; i--) {
				$iframe = $($iframes[i]);
				var name = $iframe.attr('name');
				if(!name || slideNamesNotToClear.indexOf(name) === -1) {
					return $iframe[0];
				}
			}
		}
		return false;
	};

	Presentation.prototype.goToPreviousSlide = function() {
		this.setCurrentSlideIndex(this.currentSlideIndex - 1);
	};

	Presentation.prototype.goToNextSlide = function() {
		this.setCurrentSlideIndex(this.currentSlideIndex + 1);
	};

	Presentation.prototype.setCurrentSlideIndex = function(value) {
		value = Math.max(0, Math.min(value, this.iFrameBridges.length - 1));
		if(value !== this.currentSlideIndex) {
			this.currentSlideIndex = value;

			var currentIFrameBridge = this.getIFrameBridgeByIndex(this.currentSlideIndex);
			var previousIFrameBridge = this.getIFrameBridgeByIndex(this.currentSlideIndex - 1);
			var nextIFrameBridge = this.getIFrameBridgeByIndex(this.currentSlideIndex + 1);

			var currentIframe = this.getIFrameForSlide(currentIFrameBridge, [previousIFrameBridge, nextIFrameBridge]);
			this.setupIFrame(currentIframe, currentIFrameBridge, Constants.STATE_ACTIVE, 0);

			var previousIframe = this.getIFrameForSlide(previousIFrameBridge, [currentIFrameBridge, nextIFrameBridge]);
			this.setupIFrame(previousIframe, previousIFrameBridge, Constants.STATE_INACTIVE, '-100%');

			var nextIframe = this.getIFrameForSlide(nextIFrameBridge, [previousIFrameBridge, currentIFrameBridge]);
			this.setupIFrame(nextIframe, nextIFrameBridge, Constants.STATE_INACTIVE, '100%');

			//all other iframe bridges should be unlinked from their iframe
			this.iFrameBridges.forEach(function(iFrameBridge){
				if(iFrameBridge === currentIFrameBridge) {
					return;
				}
				if(iFrameBridge === previousIFrameBridge) {
					return;
				}
				if(iFrameBridge === nextIFrameBridge) {
					return;
				}
				iFrameBridge.iframe = null;
			});

			bean.fire(this, Constants.SET_CURRENT_SLIDE_INDEX, [this.currentSlideIndex]);
		}
	};

	Presentation.prototype.setupIFrame = function(iFrame, iFrameBridge, state, left) {
		if(iFrame) {
			var src = "slides/" + iFrameBridge.name + '.html';
			if(iFrameBridge.data[this.role] && iFrameBridge.data[this.role].url) {
				src = iFrameBridge.data[this.role].url;
			}
			if(iFrameBridge.isAlreadyCorrectlyAttached(iFrame, src)) {
				//console.log(iFrameBridge.name + ' already attached');
			} else {
				//leave previous channel of this iframe
				if(this.mobileServerBridge) {
					this.mobileServerBridge.tryToSend(Constants.LEAVE_SLIDE_ROOM, $(iFrame).attr('name'));
				}
				//add the join as a callback for the onload event
				iFrameBridge.attachToIframe(iFrame, src, (function(){
					//join new channel
					if(this.mobileServerBridge) {
						this.mobileServerBridge.tryToSend(Constants.JOIN_SLIDE_ROOM, $(iFrame).attr('name'));
					}
				}).bind(this));
			}
			iFrameBridge.setState(state);
			$(iFrame).css('left', left);
		}
	};

	Presentation.prototype.createMobileServerBridge = function() {
		//to implement in extending classes
	};

	return Presentation;

})();