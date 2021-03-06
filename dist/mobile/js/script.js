require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
module.exports = self.fetch.bind(self);

},{"whatwg-fetch":2}],2:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../shared/js/Constants');

var _Presentation = require('../../../shared/js/classes/Presentation');

var _Presentation2 = _interopRequireDefault(_Presentation);

var _MobileServerBridge = require('../../../shared/js/classes/MobileServerBridge');

var _MobileServerBridge2 = _interopRequireDefault(_MobileServerBridge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Presentation = function (_PresentationBase) {
  _inherits(Presentation, _PresentationBase);

  function Presentation(data, role, settings) {
    _classCallCheck(this, Presentation);

    var _this = _possibleConstructorReturn(this, (Presentation.__proto__ || Object.getPrototypeOf(Presentation)).call(this, data, role, settings));

    _this.$overlay = $('#overlay');
    return _this;
  }

  _createClass(Presentation, [{
    key: 'createMobileServerBridge',
    value: function createMobileServerBridge() {
      return new _MobileServerBridge2.default(this, this.settings);
    }
  }, {
    key: 'handleMobileServerMessage',
    value: function handleMobileServerMessage(message) {
      if (!message.content) {
        return;
      }
      if (message.content.action === 'setCurrentSlideIndex') {
        this.setCurrentSlideIndex(message.content.currentSlideIndex);
      } else if (message.content.action === _Constants.Constants.BLINK) {
        this.blink(message.content.text, message.content.backgroundColor);
      }
    }
  }, {
    key: 'setCurrentSlideIndex',
    value: function setCurrentSlideIndex(index) {
      _get(Presentation.prototype.__proto__ || Object.getPrototypeOf(Presentation.prototype), 'setCurrentSlideIndex', this).call(this, index);
      if (this.$overlay) {
        this.$overlay.removeClass('active');
      }
      if (this.blinkInterval) {
        clearInterval(this.blinkInterval);
      }
    }
  }, {
    key: 'blink',
    value: function blink(text, backgroundColor) {
      //overlay important, blinking text
      this.$overlay.find('.content').html(text);
      this.$overlay.addClass('active');
      if (this.blinkInterval) {
        clearInterval(this.blinkInterval);
      }
      this.blinkInterval = setInterval(this.blinkToggle.bind(this, backgroundColor), 500);
    }
  }, {
    key: 'blinkToggle',
    value: function blinkToggle(backgroundColor) {
      this.$overlay.toggleClass('blink-on');
      if (this.$overlay.hasClass('blink-on')) {
        this.$overlay.css('background-color', backgroundColor);
      } else {
        this.$overlay.css('background-color', '');
      }
    }
  }]);

  return Presentation;
}(_Presentation2.default);

exports.default = Presentation;

},{"../../../shared/js/Constants":5,"../../../shared/js/classes/MobileServerBridge":7,"../../../shared/js/classes/Presentation":8}],4:[function(require,module,exports){
'use strict';

var _Presentation = require('./classes/Presentation');

var _Presentation2 = _interopRequireDefault(_Presentation);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {

  var init = function init() {
    var settings = {
      presentationPath: '/',
      mobileServerUrl: ''
    };
    //get slides by xmlhttprequest
    (0, _isomorphicFetch2.default)('/data.json?t=' + Date.now()).then(function (data) {
      return data.json();
    }).then(function (data) {
      new _Presentation2.default(data, 'mobile', settings);
    });
  };

  init();
})();

},{"./classes/Presentation":3,"isomorphic-fetch":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Constants = exports.Constants = {
  GO_TO_PREVIOUS_SLIDE: "goToPreviousSlide",
  GO_TO_NEXT_SLIDE: "goToNextSlide",
  SET_SLIDES: "setSlides",
  SET_CURRENT_SLIDE_INDEX: "setCurrentSlideIndex",

  MESSAGE: "message",
  SOCKET_SEND: "socketSend",
  SOCKET_RECEIVE: "socketReceive",
  JOIN_SLIDE_ROOM: "joinSlideRoom",
  LEAVE_SLIDE_ROOM: "leaveSlideRoom",

  ROLE_PRESENTATION: "presentation",
  ROLE_MOBILE: "mobile",

  STATE_ACTIVE: "active",
  STATE_INACTIVE: "inactive",

  SET_SUBSTATE: "setSubstate",

  CHILD_APP_SAVE_CODE: "childAppSaveCode",
  CHILD_APP_RUN_CODE: "childAppRunCode",
  CHILD_APP_STDOUT_DATA: "childAppStdoutData",
  CHILD_APP_STDERR_DATA: "childAppStderrData",

  OPEN_COMMAND_LINE: "openCommandLine",
  OPEN_CAMERA: "openCamera",

  BLINK: "blink",

  HEART_RATE_POLAR: "heartRatePolar",

  SET_TEAM: "setTeam",
  UPDATE_MOTION: "updateMotion",

  YOU_WIN: "youWin",
  YOU_LOSE: "youLose",

  SHAKE_YOUR_PHONES_INTRO: "shakeYourPhonesIntro",
  SHAKE_YOUR_PHONES_GAME: "shakeYourPhonesGame",
  SHAKE_YOUR_PHONES_FINISHED: "shakeYourPhonesFinished",

  SHAKE_YOUR_PHONES_CLIENT_ADDED: "shakeYourPhonesClientAdded",
  SHAKE_YOUR_PHONES_CLIENT_REMOVED: "shakeYourPhonesClientRemoved",
  SHAKE_YOUR_PHONES_CLIENT_LIST: "shakeYourPhonesClientList",
  SHAKE_YOUR_PHONES_CLIENT_UPDATE: "shakeYourPhonesClientUpdate",

  HIGHEST_HEARTRATE_GAME_INTRO: "highestHeartrateGameIntro",
  HIGHEST_HEARTRATE_GAME_GAME: "highestHeartrateGameGame",
  HIGHEST_HEARTRATE_GAME_FINISHED: "highestHeartrateGameFinished",

  LOWEST_HEARTRATE_GAME_INTRO: "lowestHeartrateGameIntro",
  LOWEST_HEARTRATE_GAME_GAME: "lowestHeartrateGameGame",
  LOWEST_HEARTRATE_GAME_FINISHED: "lowestHeartrateGameFinished",

  UPDATE_REACTION_SPEED: "updateReactionSpeed",

  REACT_PHONES_INTRO: "reactPhonesIntro",
  REACT_PHONES_GAME: "reactPhonesGame",
  REACT_PHONES_FINISHED: "reactPhonesFinished",

  DANCE_PAD_GAME_INTRO: "dancePadGameIntro",
  DANCE_PAD_GAME_GAME: "dancePadGameGame",
  DANCE_PAD_GAME_FINISHED: "dancePadGameFinished"
};

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('../Constants');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ContentBase = function () {
  function ContentBase($slideHolder) {
    _classCallCheck(this, ContentBase);

    this.$slideHolder = $slideHolder;
    this.slideHolder = this.$slideHolder[0];
    this.width = this.slideHolder.offsetWidth;
    this.height = this.slideHolder.offsetHeight;
    this.prevWidth = this.width;
    this.prevHeight = this.height;
    this.widthChanged = false;
    this.heightChanged = false;
    this.sizeChanged = false;
    this.src = $slideHolder.attr('data-src');
    this.name = $slideHolder.attr('data-name');
    this.settings = {};
    try {
      this.settings = JSON.parse($('#presentation').attr('data-presentation-settings'));
    } catch (e) {
      console.error(e);
    }
    this.fps = 60;
    this._animationFrameId = false;
    this._currentTime = 0;
    this._delta = 0;
    this._interval = false;
    this._lastTime = new Date().getTime();
    this.currentFrame = 0;

    this.startListeningForMessages();

    this.__drawLoop = this._drawLoop.bind(this);
    this._interval = 1000 / this.fps;

    window.requestAnimationFrame(function () {
      $slideHolder.trigger('load');
    });
  }

  _createClass(ContentBase, [{
    key: 'startListeningForMessages',
    value: function startListeningForMessages() {
      this._slideHolderMessageToSlideHandler = this.slideHolderMessageToSlideHandler.bind(this);
      this.$slideHolder.on('message-to-slide', this._slideHolderMessageToSlideHandler);
    }
  }, {
    key: 'stopListeningForMessages',
    value: function stopListeningForMessages() {
      this.$slideHolder.off('message-to-slide', this._slideHolderMessageToSlideHandler);
    }
  }, {
    key: 'slideHolderMessageToSlideHandler',
    value: function slideHolderMessageToSlideHandler(event, message) {
      this.receiveMessage({ data: message });
    }
  }, {
    key: 'receiveMessage',
    value: function receiveMessage(event) {
      if (!event.data) {
        return;
      }
      switch (event.data.action) {
        case 'setState':
          this.setState(event.data.state);
          break;
        case 'destroy':
          this.destroy();
          break;
        case _Constants.Constants.SOCKET_RECEIVE:
          this.receiveSocketMessage(event.data.message);
          break;
        default:
          this.handleMessage(event.data);
          break;
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.stopListeningForMessages();
      window.cancelAnimationFrame(this._animationFrameId);
    }
  }, {
    key: 'postMessage',
    value: function postMessage(data) {
      this.$slideHolder.trigger('message-from-slide', data);
    }
  }, {
    key: 'handleMessage',
    value: function handleMessage(data) {// eslint-disable-line no-unused-vars
    }
  }, {
    key: 'postSocketMessage',
    value: function postSocketMessage(message) {
      this.postMessage({
        action: _Constants.Constants.SOCKET_SEND,
        message: message
      });
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(message) {// eslint-disable-line no-unused-vars
    }
  }, {
    key: 'setState',
    value: function setState(state) {
      if (state !== this.state) {
        this.state = state;
        this.onStateChanged();
        if (this.state === _Constants.Constants.STATE_ACTIVE) {
          this.currentFrame = 0;
          this._drawLoop();
        } else {
          window.cancelAnimationFrame(this._animationFrameId);
        }
      }
    }
  }, {
    key: 'onStateChanged',
    value: function onStateChanged() {}
  }, {
    key: '_drawLoop',
    value: function _drawLoop() {
      this._animationFrameId = window.requestAnimationFrame(this.__drawLoop);
      this._currentTime = new Date().getTime();
      this._delta = this._currentTime - this._lastTime;
      if (this._delta > this._interval) {
        this.currentFrame++;
        this.prevWidth = this.width;
        this.prevHeight = this.height;
        this.width = this.slideHolder.offsetWidth;
        this.height = this.slideHolder.offsetHeight;
        this.widthChanged = this.width !== this.prevWidth;
        this.heightChanged = this.height !== this.prevHeight;
        this.sizeChanged = this.widthChanged || this.heightChanged;
        this.drawLoop(this._delta);
        this._lastTime = this._currentTime - this._delta % this._interval;
      }
    }
  }, {
    key: 'drawLoop',
    value: function drawLoop(delta) {// eslint-disable-line no-unused-vars
    }
  }]);

  return ContentBase;
}();

exports.default = ContentBase;

},{"../Constants":5}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MobileServerBridge = function () {
  function MobileServerBridge(presentation, settings) {
    _classCallCheck(this, MobileServerBridge);

    this.presentation = presentation;
    this.settings = settings;
    this.connect();
  }

  _createClass(MobileServerBridge, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      console.log('MobileServerBridge.connect');
      //console.warn('MobileServerBridge disabled');
      //return;
      //post to the api
      (0, _isomorphicFetch2.default)(this.settings.mobileServerUrl + '/login', {
        method: 'POST',
        body: JSON.stringify(this.getLoginCredentials()),
        headers: new Headers({ 'Content-Type': 'application/json' })
      }).then(function (response) {
        return response.json();
      }).then(function (result) {
        return _this.loginHandler(result);
      }).catch(function (e) {
        console.error(e);
        setTimeout(function () {
          return _this.connect();
        }, 1000);
      });
    }
  }, {
    key: 'getLoginCredentials',
    value: function getLoginCredentials() {
      return {
        email: this.settings.mobileServerUsername,
        password: this.settings.mobileServerPassword
      };
    }
  }, {
    key: 'loginHandler',
    value: function loginHandler(result) {
      this.token = result.token;
      this.socket = io(this.settings.mobileServerUrl, {
        query: 'token=' + this.token,
        reconnection: false,
        forceNew: true
      });
      this.socket.on('connect', this.socketConnectHandler.bind(this));
      this.socket.on('disconnect', this.socketDisconnectHandler.bind(this));
      this.socket.on('message', this.socketMessageHandler.bind(this));
    }
  }, {
    key: 'socketConnectHandler',
    value: function socketConnectHandler() {
      console.log('MobileServerBridge.socketConnectHandler');
      this.presentation.mobileServerBridgeConnected();
    }
  }, {
    key: 'socketDisconnectHandler',
    value: function socketDisconnectHandler() {
      this.connect();
    }
  }, {
    key: 'tryToSend',
    value: function tryToSend() {
      if (this.socket) {
        this.socket.emit.apply(this.socket, arguments);
      }
    }
  }, {
    key: 'socketMessageHandler',
    value: function socketMessageHandler(message) {
      this.presentation.mobileServerMessageHandler(message);
    }
  }]);

  return MobileServerBridge;
}();

exports.default = MobileServerBridge;

},{"isomorphic-fetch":1}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('../Constants');

var _SlideBridge = require('./SlideBridge');

var _SlideBridge2 = _interopRequireDefault(_SlideBridge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Presentation = function () {
  /*
   * data: json object with slides array property
   * role: mobile or presentation
   */
  function Presentation(data, role, settings) {
    _classCallCheck(this, Presentation);

    this.data = data;
    this.role = role;
    this.settings = settings;
    $('#presentation').attr('data-presentation-settings', JSON.stringify(settings));
    this.currentSlideIndex = -1;
    this.slideHolders = [];
    this.numSlideHolders = 3;
    this.slideBridges = [];
    this.slideBridgesBySlideName = {};

    this.createSlideHolders();
    this.createSlideBridges(this.data);

    this.mobileServerBridge = this.createMobileServerBridge();
    this.startListeningForMessages();

    this.setCurrentSlideIndex(0);
  }

  _createClass(Presentation, [{
    key: 'startListeningForMessages',
    value: function startListeningForMessages() {
      window.addEventListener('message', this.slideMessageHandler.bind(this), false);
    }
  }, {
    key: 'createSlideHolders',
    value: function createSlideHolders() {
      for (var i = 0; i < this.numSlideHolders; i++) {
        var $slideHolder = $('<div class="slide-frame" />');
        this.slideHolders.push($slideHolder);
        $('#presentation').append($slideHolder);
      }
    }
  }, {
    key: 'createSlideBridges',
    value: function createSlideBridges(data) {
      var numSlides = data.slides.length;
      for (var i = 0; i < numSlides; i++) {
        var slideBridge = this.createSlideBridge(data.slides[i]);
        this.slideBridges.push(slideBridge);
        this.slideBridgesBySlideName[slideBridge.name] = slideBridge;
      }
    }
  }, {
    key: 'createSlideBridge',
    value: function createSlideBridge(slide) {
      return new _SlideBridge2.default(slide);
    }
  }, {
    key: 'slideMessageHandler',
    value: function slideMessageHandler(event) {
      if (!event.data) {
        return;
      }
      switch (event.data.action) {
        case _Constants.Constants.SOCKET_SEND:
          if (this.mobileServerBridge) {
            this.mobileServerBridge.tryToSend(_Constants.Constants.MESSAGE, event.data.message);
          }
          break;
      }
    }
  }, {
    key: 'mobileServerBridgeConnected',
    value: function mobileServerBridgeConnected() {
      //join the rooms of the slideHolders
      for (var i = 0; i < this.numSlideHolders; i++) {
        this.mobileServerBridge.tryToSend(_Constants.Constants.JOIN_SLIDE_ROOM, $(this.slideHolders[i]).attr('data-name'));
      }
    }
  }, {
    key: 'mobileServerMessageHandler',
    value: function mobileServerMessageHandler(message) {
      if (message.target.slide) {
        //slide has to handle the message
        var slideBridge = this.getSlideBridgeByName(message.target.slide);
        if (slideBridge) {
          slideBridge.tryToPostMessage({
            action: _Constants.Constants.SOCKET_RECEIVE,
            message: message
          });
        }
      } else {
        //presentation has to handle the message
        this.handleMobileServerMessage(message);
      }
    }
  }, {
    key: 'handleMobileServerMessage',
    value: function handleMobileServerMessage(message) {
      console.log('[shared/Presentation] handleMobileServerMessage', message);
    }
  }, {
    key: 'getSlideBridgeByIndex',
    value: function getSlideBridgeByIndex(index) {
      if (index >= 0 && index < this.slideBridges.length) {
        return this.slideBridges[index];
      }
      return false;
    }
  }, {
    key: 'getSlideBridgeByName',
    value: function getSlideBridgeByName(slideName) {
      return this.slideBridgesBySlideName[slideName];
    }
  }, {
    key: 'getSlideHolderForSlide',
    value: function getSlideHolderForSlide(slide, slidesNotToClear) {
      if (slide) {
        var $slideHolder = $('.slide-frame[data-name="' + slide.name + '"]');
        if ($slideHolder.length > 0) {
          return $slideHolder[0];
        }
        //get a free slideHolder
        var slideNamesNotToClear = [];
        $(slidesNotToClear).each(function (index, obj) {
          slideNamesNotToClear.push(obj.name);
        });
        var $slideHolders = $('.slide-frame');
        for (var i = $slideHolders.length - 1; i >= 0; i--) {
          $slideHolder = $($slideHolders[i]);
          var name = $slideHolder.attr('data-name');
          if (!name || slideNamesNotToClear.indexOf(name) === -1) {
            return $slideHolder[0];
          }
        }
      }
      return false;
    }
  }, {
    key: 'goToPreviousSlide',
    value: function goToPreviousSlide() {
      this.setCurrentSlideIndex(this.currentSlideIndex - 1);
    }
  }, {
    key: 'goToNextSlide',
    value: function goToNextSlide() {
      this.setCurrentSlideIndex(this.currentSlideIndex + 1);
    }
  }, {
    key: 'setCurrentSlideIndex',
    value: function setCurrentSlideIndex(value) {
      value = Math.max(0, Math.min(value, this.slideBridges.length - 1));
      if (value !== this.currentSlideIndex) {
        this.currentSlideIndex = value;

        var currentSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex);
        var previousSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex - 1);
        var nextSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex + 1);

        //remove "used" class from slide holders
        $('.slide-frame').removeAttr('data-used', false);

        var currentSlideHolder = this.getSlideHolderForSlide(currentSlideBridge, [previousSlideBridge, nextSlideBridge]);
        this.setupSlideHolder(currentSlideHolder, currentSlideBridge, _Constants.Constants.STATE_ACTIVE, 0);

        var previousSlideHolder = this.getSlideHolderForSlide(previousSlideBridge, [currentSlideBridge, nextSlideBridge]);
        this.setupSlideHolder(previousSlideHolder, previousSlideBridge, _Constants.Constants.STATE_INACTIVE, '-100%');

        var nextSlideHolder = this.getSlideHolderForSlide(nextSlideBridge, [previousSlideBridge, currentSlideBridge]);
        this.setupSlideHolder(nextSlideHolder, nextSlideBridge, _Constants.Constants.STATE_INACTIVE, '100%');

        //clear attributes of unused slide frames
        $('.slide-frame').each(function (index, slideHolder) {
          if (!$(slideHolder).attr('data-used')) {
            $(slideHolder).removeAttr('data-used').removeAttr('data-name').removeAttr('data-src');
          }
        });

        //all other slideHolder bridges should be unlinked from their slideHolder
        this.slideBridges.forEach(function (slideBridge) {
          if (slideBridge === currentSlideBridge) {
            return;
          }
          if (slideBridge === previousSlideBridge) {
            return;
          }
          if (slideBridge === nextSlideBridge) {
            return;
          }
          slideBridge.slideHolder = null;
        });

        bean.fire(this, _Constants.Constants.SET_CURRENT_SLIDE_INDEX, [this.currentSlideIndex]);
      }
    }
  }, {
    key: 'setupSlideHolder',
    value: function setupSlideHolder(slideHolder, slideBridge, state, left) {
      if (slideHolder) {
        var src = 'slides/' + slideBridge.name + '.html';
        if (slideBridge.data[this.role] && slideBridge.data[this.role].url) {
          src = slideBridge.data[this.role].url;
        }
        src = this.processSlideSrc(src);
        if (slideBridge.isAlreadyCorrectlyAttached(slideHolder, src)) {
          //console.log(slideBridge.name + ' already attached');
        } else {
          this.attachToSlideHolder(slideHolder, slideBridge, src);
        }
        slideBridge.setState(state);
        $(slideHolder).css('left', left);
        $(slideHolder).attr('data-used', 1);
      }
    }
  }, {
    key: 'attachToSlideHolder',
    value: function attachToSlideHolder(slideHolder, slideBridge, src) {
      var _this = this;

      //listen for events on this slideHolder
      $(slideHolder).off('message-from-slide');
      $(slideHolder).on('message-from-slide', function (event, message) {
        _this.slideMessageHandler({ data: message });
      });
      //leave previous channel of this slideHolder
      if (this.mobileServerBridge) {
        this.mobileServerBridge.tryToSend(_Constants.Constants.LEAVE_SLIDE_ROOM, $(slideHolder).attr('data-name'));
      }
      //add the join as a callback for the onload event
      slideBridge.attachToSlideHolder(slideHolder, src, this.slideLoaded.bind(this, slideHolder, slideBridge, src));
    }
  }, {
    key: 'slideLoaded',
    value: function slideLoaded(slideHolder, slideBridge) {
      // eslint-disable-line no-unused-vars
      //join new channel
      if (this.mobileServerBridge) {
        this.mobileServerBridge.tryToSend(_Constants.Constants.JOIN_SLIDE_ROOM, $(slideHolder).attr('data-name'));
      }
    }
  }, {
    key: 'processSlideSrc',
    value: function processSlideSrc(src) {
      return src;
    }
  }, {
    key: 'createMobileServerBridge',
    value: function createMobileServerBridge() {
      //to implement in extending classes
    }
  }]);

  return Presentation;
}();

exports.default = Presentation;

},{"../Constants":5,"./SlideBridge":9}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SlideBridge = function () {
  function SlideBridge(data) {
    _classCallCheck(this, SlideBridge);

    this.data = data;
    this.name = this.data.name;
  }

  _createClass(SlideBridge, [{
    key: 'isAlreadyCorrectlyAttached',
    value: function isAlreadyCorrectlyAttached(slideHolder, src) {
      return this.slideHolder === slideHolder && $(slideHolder).attr('data-name') === this.name && $(slideHolder).attr('data-src') === src;
    }
  }, {
    key: 'attachToSlideHolder',
    value: function attachToSlideHolder(slideHolder, src, cb) {
      var _this = this;

      this.slideHolder = slideHolder;
      //notify the content it is being cleared
      this.tryToPostMessage({ action: 'destroy' });
      //clear the current content
      this.slideHolder.innerHTML = '';
      $(slideHolder).attr('data-name', this.name);
      $(slideHolder).addClass('loading');

      $(slideHolder).off('load');
      $(slideHolder).on('load', function () {
        _this.tryToPostMessage({
          action: 'setState',
          state: _this.state
        });
        $(slideHolder).off('load');
      });

      if (src !== $(slideHolder).attr('data-src')) {
        //fetch the html
        (0, _isomorphicFetch2.default)(src).then(function (result) {
          return result.text();
        }).then(function (result) {
          return $(result);
        }).then(function ($result) {
          $(slideHolder).html($result.html());
          $(slideHolder).removeClass('loading');
          cb();
        }).catch(function (err) {
          console.error(err);
          $(slideHolder).removeClass('loading');
          cb();
        });
        $(slideHolder).attr('data-src', src);
      }
    }
  }, {
    key: 'tryToPostMessage',
    value: function tryToPostMessage(message) {
      if (!this.slideHolder) {
        console.log(this.name + ' post fail');
        return;
      }
      //trigger with jquery
      $(this.slideHolder).trigger('message-to-slide', message);
    }
  }, {
    key: 'setState',
    value: function setState(state) {
      this.state = state;
      this.tryToPostMessage({
        action: 'setState',
        state: this.state
      });
    }
  }]);

  return SlideBridge;
}();

exports.default = SlideBridge;

},{"isomorphic-fetch":1}],"ReactPhonesSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ReactPhonesSlide = function (_ContentBase) {
  _inherits(ReactPhonesSlide, _ContentBase);

  function ReactPhonesSlide($slideHolder) {
    _classCallCheck(this, ReactPhonesSlide);

    var _this = _possibleConstructorReturn(this, (ReactPhonesSlide.__proto__ || Object.getPrototypeOf(ReactPhonesSlide)).call(this, $slideHolder));

    _this.totalReactionSpeed = 0;
    _this.numReactionSpeeds = 0;
    _this.numCorrectAnswers = 1;
    _this.averageReactionSpeed = 9999999;
    _this.visiblePosition = 0;
    _this.targetPosition = 0;
    _this.lastAnswerTime = new Date();
    _this.positions = [];

    _this.$game = _this.$slideHolder.find('.game');
    _this.$slidesContainer = _this.$slideHolder.find('.react-phones-slides-container');
    _this.$slide1 = _this.$slideHolder.find('.react-phones-slide-1');
    _this.$slide1text = _this.$slideHolder.find('.react-phones-slide-1 .react-phones-slide-text');
    _this.$slide2 = _this.$slideHolder.find('.react-phones-slide-2');
    _this.$slide2text = _this.$slideHolder.find('.react-phones-slide-2 .react-phones-slide-text');

    _this.$slideHolder.find('.touchbutton').on('touchstart', $.proxy(_this.onButtonTouchStart, _this));
    _this.$slideHolder.find('.touchbutton').on('touchend', $.proxy(_this.onButtonTouchEnd, _this));

    _this.$slideHolder.find('.touchbutton').on('mousedown', $.proxy(_this.onButtonTouchStart, _this));
    _this.$slideHolder.find('.touchbutton').on('mouseup', $.proxy(_this.onButtonTouchEnd, _this));

    _this.resetGame();
    return _this;
  }

  _createClass(ReactPhonesSlide, [{
    key: 'onButtonTouchStart',
    value: function onButtonTouchStart(e) {
      e.preventDefault();
      $(e.currentTarget).addClass('down');
      this.selectAnswer($(e.currentTarget).text());
    }
  }, {
    key: 'onButtonTouchEnd',
    value: function onButtonTouchEnd(e) {
      e.preventDefault();
      $(e.currentTarget).removeClass('down');
    }
  }, {
    key: 'selectAnswer',
    value: function selectAnswer(answer) {
      var now = new Date();
      var time = now.getTime() - this.lastAnswerTime.getTime();
      this.totalReactionSpeed += time;
      if (answer.toLowerCase() === this.positions[this.targetPosition].colorString.toLowerCase()) {
        //correct answer
        this.numCorrectAnswers++;
      } else {
        //penalty time
        this.totalReactionSpeed += 1000;
      }
      this.numReactionSpeeds++;
      this.lastAnswerTime = now;
      this.targetPosition++;
      this.fillPositionsWhenNeeded();
      //send to server
      this.postSocketMessage({
        target: {
          client: 'presentation',
          slide: this.name
        },
        content: {
          action: _Constants.Constants.UPDATE_REACTION_SPEED,
          reactionSpeed: this.totalReactionSpeed / this.numCorrectAnswers
        }
      });
    }
  }, {
    key: 'showCurrentState',
    value: function showCurrentState() {
      this.$slideHolder.find('.substate').removeClass('active');
      this.$game.css({
        'z-index': -1,
        opacity: 0.3,
        'pointer-events': 'none'
      });
      if (this.substate === _Constants.Constants.REACT_PHONES_GAME) {
        this.$slideHolder.find('.substate-game').addClass('active');
        this.$game.css({
          'z-index': 10,
          opacity: 1,
          'pointer-events': 'auto'
        });
      } else if (this.substate === _Constants.Constants.REACT_PHONES_FINISHED) {
        this.$slideHolder.find('.substate-finished').addClass('active');
      } else {
        this.$slideHolder.find('.substate-intro').addClass('active');
      }
    }
  }, {
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.resetGame();
      }
    }
  }, {
    key: 'resetGame',
    value: function resetGame() {
      this.lastAnswerTime = new Date();
      this.totalReactionSpeed = 0;
      this.numReactionSpeeds = 0;
      this.numCorrectAnswers = 1;
      this.averageReactionSpeed = 9999999;
      this.visiblePosition = 0;
      this.targetPosition = 0;
      this.positions = [];
      this.fillPositionsWhenNeeded();
    }
  }, {
    key: 'fillPositionsWhenNeeded',
    value: function fillPositionsWhenNeeded() {
      var numPositionsToAdd = this.numReactionSpeeds + 2 - this.positions.length;
      for (var i = 0; i < numPositionsToAdd; i++) {
        var position = {
          colorString: Math.random() > 0.5 ? 'red' : 'blue',
          bgcolor: Math.random() > 0.5 ? '#c6363d' : '#0684AF'
        };
        if (position.colorString === 'red') {
          position.color = '#c6363d';
        } else {
          position.color = '#0684AF';
        }
        this.positions.push(position);
      }
    }
  }, {
    key: 'drawLoop',
    value: function drawLoop() {
      this.visiblePosition += (this.targetPosition - this.visiblePosition) * 0.1;
      if (this.visiblePosition % 1 > 0.995) {
        this.visiblePosition = Math.round(this.visiblePosition);
      }
      this.$slidesContainer.css('left', this.visiblePosition * -100 + '%');

      var flooredVisiblePosition = Math.floor(this.visiblePosition);
      if (flooredVisiblePosition % 2 === 0) {
        this.$slide1.css({
          left: flooredVisiblePosition * 100 + '%',
          'background-color': this.positions[flooredVisiblePosition].bgcolor
        });
        this.$slide2.css({
          left: flooredVisiblePosition * 100 + 100 + '%',
          'background-color': this.positions[flooredVisiblePosition + 1].bgcolor
        });

        this.$slide1text.text(this.positions[flooredVisiblePosition].colorString);
        this.$slide2text.text(this.positions[flooredVisiblePosition + 1].colorString);
      } else {
        this.$slide2.css({
          left: flooredVisiblePosition * 100 + '%',
          'background-color': this.positions[flooredVisiblePosition].bgcolor
        });
        this.$slide1.css({
          left: flooredVisiblePosition * 100 + 100 + '%',
          'background-color': this.positions[flooredVisiblePosition + 1].bgcolor
        });

        this.$slide2text.text(this.positions[flooredVisiblePosition].colorString);
        this.$slide1text.text(this.positions[flooredVisiblePosition + 1].colorString);
      }
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(message) {
      if (!message.content) {
        return;
      }
      if (message.content.action === _Constants.Constants.SET_SUBSTATE) {
        this.setSubstate(message.content.substate);
      }
    }
  }, {
    key: 'setSubstate',
    value: function setSubstate(substate) {
      if (this.substate !== substate) {
        this.substate = substate;
        this.showCurrentState();
      }
    }
  }]);

  return ReactPhonesSlide;
}(_ContentBase3.default);

exports.default = ReactPhonesSlide;

},{"../../../../shared/js/Constants":5,"../../../../shared/js/classes/ContentBase":6}],"ShakeYourPhonesSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ShakeYourPhonesSlide = function (_ContentBase) {
  _inherits(ShakeYourPhonesSlide, _ContentBase);

  function ShakeYourPhonesSlide($slideHolder) {
    _classCallCheck(this, ShakeYourPhonesSlide);

    var _this = _possibleConstructorReturn(this, (ShakeYourPhonesSlide.__proto__ || Object.getPrototypeOf(ShakeYourPhonesSlide)).call(this, $slideHolder));

    _this.currentMotion = 0;
    _this.motion = 0;

    _this.$slideHolder.find('.slide').css('background-color', '#c6363d');

    _this.$background = _this.$slideHolder.find('.background');
    _this.$background.css('top', '100%');
    _this.$background.css('background-color', 'rgba(255, 255, 255, 0.5)');

    _this._motionUpdateHandler = _this.motionUpdateHandler.bind(_this);
    return _this;
  }

  _createClass(ShakeYourPhonesSlide, [{
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        if (window.DeviceMotionEvent) {
          window.addEventListener('devicemotion', this._motionUpdateHandler, false);
        } else {
          this.$slideHolder.find('.acceleration').text('Not supported on your device :-(');
        }
      } else {
        window.removeEventListener('devicemotion', this._motionUpdateHandler);
      }
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(message) {
      if (!message.content) {
        return;
      }
      if (message.content.action === _Constants.Constants.SET_SUBSTATE) {
        this.setSubstate(message.content.substate);
      }
      // if(message.content.action === Constants.YOU_WIN) {
      //   this.$slideHolder.find('.substate-finished h1').text('Your Team Won!');
      // }
      // if(message.content.action === Constants.YOU_LOSE) {
      //   this.$slideHolder.find('.substate-finished h1').text('Your Team Lost...');
      // }
    }
  }, {
    key: 'setSubstate',
    value: function setSubstate(substate) {
      if (this.substate !== substate) {
        this.substate = substate;
        this.showCurrentState();
      }
    }
  }, {
    key: 'motionUpdateHandler',
    value: function motionUpdateHandler(event) {
      this.currentMotion = event.interval * (Math.abs(event.acceleration.x) + Math.abs(event.acceleration.y) + Math.abs(event.acceleration.z));
    }
  }, {
    key: 'drawLoop',
    value: function drawLoop() {
      this.motion += this.currentMotion;
      this.motion *= 0.97;
      this.$background.css('top', 100 - this.motion + '%');
      if (this.currentFrame % 10 === 0) {
        this.postSocketMessage({
          target: {
            client: 'presentation',
            slide: this.name
          },
          content: {
            action: _Constants.Constants.UPDATE_MOTION,
            motion: this.motion
          }
        });
      }
    }
  }, {
    key: 'showCurrentState',
    value: function showCurrentState() {
      this.$slideHolder.find('.substate').removeClass('active');
      if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_GAME) {
        this.$slideHolder.find('.substate-game').addClass('active');
      } else if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_FINISHED) {
        this.$slideHolder.find('.substate-finished').addClass('active');
      } else {
        this.$slideHolder.find('.substate-intro').addClass('active');
      }
    }
  }]);

  return ShakeYourPhonesSlide;
}(_ContentBase3.default);

exports.default = ShakeYourPhonesSlide;

},{"../../../../shared/js/Constants":5,"../../../../shared/js/classes/ContentBase":6}]},{},[4])

//# sourceMappingURL=script.js.map
