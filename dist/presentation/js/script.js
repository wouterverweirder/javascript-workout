require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.0.5
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":5}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
module.exports = self.fetch.bind(self);

},{"whatwg-fetch":6}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HeartRateCanvas = function () {
  function HeartRateCanvas(canvas) {
    _classCallCheck(this, HeartRateCanvas);

    this.pixelsPerBeatAt60BPM = 100;
    this.frameNr = 0;
    this.fps = 60;
    this.numValues = 0;
    this.numValuesMargin = 9;
    this.numValuesWithMargin = 9;
    this.heartRate = 0;
    this.backgroundColor = "#fff";
    this.strokeColor = "#00f";

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this._initSizeDependedVariables();

    this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
  }

  _createClass(HeartRateCanvas, [{
    key: "resize",
    value: function resize(w, h) {
      this.width = this.canvas.width = w;
      this.height = this.canvas.height = h;
      this._initSizeDependedVariables();
    }
  }, {
    key: "_initSizeDependedVariables",
    value: function _initSizeDependedVariables() {
      this.numValues = Math.round(this.width * 0.80);
      this.numValuesWithMargin = this.numValues + this.numValuesMargin;
      if (!this.values) {
        this.values = [];
      }
      this.values.length = this.numValuesWithMargin;
      this.canvasVerticalCenter = this.height / 2;
    }
  }, {
    key: "tick",
    value: function tick() {
      this.frameNr++;

      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.canvasVerticalCenter - this.canvasVerticalCenter * this.values[0]);
      for (var i = 1; i < this.numValues; i++) {
        this.ctx.lineTo(i, this.canvasVerticalCenter - this.canvasVerticalCenter * this.values[i]);
      }
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.beginPath();
      this.ctx.arc(this.numValues - 1, this.canvasVerticalCenter - this.canvasVerticalCenter * this.values[this.numValues - 1], 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.strokeColor;
      this.ctx.fill();
      this.ctx.closePath();

      //does the tick align with a beat?
      if (this.heartRate > 0 && this.frameNr % this.heartRateTickInterval === 0) {
        this.frameNr = 0; //reset to zero
        var strength = 0.7 + Math.random() * 0.3;
        this.values[this.numValuesWithMargin - this.numValuesMargin - 1] = 0.05 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 0] = 0.1 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 1] = 0.3 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 2] = 1 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 3] = 0 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 4] = -1 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 5] = -0.3 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 6] = -0.1 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 7] = -0.05 * strength;
        this.values[this.numValuesWithMargin - this.numValuesMargin + 8] = 0 * strength;
      }

      this.values.shift();
      this.values.shift();
      this.values.push(Math.random() * 0.05 - 0.1);
      this.values.push(Math.random() * 0.05 - 0.1);
    }
  }, {
    key: "updateHeartRate",
    value: function updateHeartRate(heartRate) {
      this.heartRate = heartRate;
      if (this.heartRate > 0) {
        this.heartRateTickInterval = Math.round(this.fps * 60 / this.heartRate);
      }
    }
  }]);

  return HeartRateCanvas;
}();

exports.default = HeartRateCanvas;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _MobileServerBridge = require('../../../shared/js/classes/MobileServerBridge');

var _MobileServerBridge2 = _interopRequireDefault(_MobileServerBridge);

var _Constants = require('../../../shared/js/Constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MobileServerBridge = function (_MobileServerBridgeBa) {
  _inherits(MobileServerBridge, _MobileServerBridgeBa);

  function MobileServerBridge(presentation, settings) {
    _classCallCheck(this, MobileServerBridge);

    var _this = _possibleConstructorReturn(this, (MobileServerBridge.__proto__ || Object.getPrototypeOf(MobileServerBridge)).call(this, presentation, settings));

    bean.on(_this.presentation, _Constants.Constants.SET_CURRENT_SLIDE_INDEX, _this.currentSlideIndexChanged.bind(_this));
    return _this;
  }

  _createClass(MobileServerBridge, [{
    key: 'socketConnectHandler',
    value: function socketConnectHandler() {
      _get(MobileServerBridge.prototype.__proto__ || Object.getPrototypeOf(MobileServerBridge.prototype), 'socketConnectHandler', this).call(this);
      this.tryToSend(_Constants.Constants.MESSAGE, {
        target: {
          client: 'mobile'
        },
        content: {
          action: _Constants.Constants.SET_CURRENT_SLIDE_INDEX,
          currentSlideIndex: this.presentation.currentSlideIndex
        }
      });
    }
  }, {
    key: 'currentSlideIndexChanged',
    value: function currentSlideIndexChanged(currentSlideIndex) {
      this.tryToSend(_Constants.Constants.MESSAGE, {
        target: {
          client: 'mobile'
        },
        content: {
          action: _Constants.Constants.SET_CURRENT_SLIDE_INDEX,
          currentSlideIndex: currentSlideIndex
        }
      });
    }
  }]);

  return MobileServerBridge;
}(_MobileServerBridge2.default);

exports.default = MobileServerBridge;

},{"../../../shared/js/Constants":45,"../../../shared/js/classes/MobileServerBridge":46}],9:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var childProcess = requireNode("child_process");
var EventEmitter = requireNode("events").EventEmitter;
var path = requireNode("path");

var platform = requireNode("electron").remote.process.platform;
var isWin = /^win/.test(platform);

//kill entire process tree
//http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn
var kill = function kill(pid, signal) {
  signal = signal || "SIGKILL";
  return new Promise(function (resolve) {
    if (!isWin) {
      var psTree = requireNode("ps-tree");
      var killTree = true;
      if (killTree) {
        psTree(pid, function (err, children) {
          [pid].concat(children.map(function (p) {
            return p.PID;
          })).forEach(function (tpid) {
            try {
              process.kill(tpid, signal);
            } catch (ex) {
              console.error(ex);
            }
          });
        });
      } else {
        try {
          process.kill(pid, signal);
        } catch (ex) {
          console.error(ex);
        }
      }
      resolve();
    } else {
      childProcess.exec("taskkill /PID " + pid + " /T /F", function () {
        resolve();
      });
    }
  });
};

var NodeAppRunner = function (_EventEmitter) {
  _inherits(NodeAppRunner, _EventEmitter);

  function NodeAppRunner() {
    _classCallCheck(this, NodeAppRunner);

    return _possibleConstructorReturn(this, (NodeAppRunner.__proto__ || Object.getPrototypeOf(NodeAppRunner)).call(this));
  }

  _createClass(NodeAppRunner, [{
    key: "run",
    value: function run(applicationPath) {
      var _this2 = this;

      return this.stop().then(function () {
        _this2.cwd = path.dirname(applicationPath);
        _this2.numDataEventsReceived = 0;
        _this2.ignoreFirstEventsAmount = 0;
        if (isWin) {
          _this2.ignoreFirstEventsAmount = 2;
          _this2.runner = childProcess.spawn("cmd", ["nvmw", "use", "iojs-v2.3.1"], { cwd: _this2.cwd });
          setTimeout(function () {
            _this2.runner.stdin.write("node " + applicationPath + "\n");
          }, 500);
        } else {
          console.log("node " + applicationPath);
          _this2.runner = childProcess.spawn("node", [applicationPath], { cwd: _this2.cwd });
        }
        _this2.runner.stdout.on("data", function (data) {
          return _this2.onRunnerData(data);
        });
        _this2.runner.stderr.on("data", function (error) {
          return _this2.onRunnerError(error);
        });
        _this2.runner.on("disconnect", function () {
          return _this2.onDisconnect();
        });
        _this2.runner.on("close", function () {
          return _this2.onClose();
        });
        _this2.runner.on("exit", function () {
          return _this2.onExit();
        });
      });
    }
  }, {
    key: "onRunnerData",
    value: function onRunnerData(data) {
      this.numDataEventsReceived++;
      if (this.numDataEventsReceived <= this.ignoreFirstEventsAmount) {
        //ignore the first x-messages
        return;
      }
      data = data.toString().trim();
      if (data.indexOf(this.cwd) === 0) {
        data = data.substr(this.cwd.length);
        if (data.length === 1) {
          return;
        }
      }
      this.emit("stdout-data", data);
    }
  }, {
    key: "onRunnerError",
    value: function onRunnerError(error) {
      this.emit("stderr-data", error.toString().trim());
    }
  }, {
    key: "onDisconnect",
    value: function onDisconnect() {
      console.log("[ChildApp] runner disconnected");
      this.runner = false;
    }
  }, {
    key: "onClose",
    value: function onClose() {
      console.log("[ChildApp] runner closed");
      this.runner = false;
    }
  }, {
    key: "onExit",
    value: function onExit() {
      console.log("[ChildApp] runner exited");
      this.runner = false;
    }
  }, {
    key: "stop",
    value: function stop() {
      var _this3 = this;

      return new Promise(function (resolve) {
        if (!_this3.runner) {
          resolve();
        }
        _this3.runner.stdout.removeAllListeners();
        _this3.runner.stderr.removeAllListeners();
        _this3.runner.stdin.end();
        //listen for runner events and resolve on the one that occurs
        // const cbCalled = false;
        // this.runner.on('disconnect', () => {
        //   console.log('disconnect');
        //   if(!cbCalled) {
        //     resolve();
        //   }
        // });
        // this.runner.on('close', () => {
        //   console.log('close');
        //   if(!cbCalled) {
        //     resolve();
        //   }
        // });
        // this.runner.on('exit', () => {
        //   console.log('exit');
        //   if(!cbCalled) {
        //     resolve();
        //   }
        // });
        kill(_this3.runner.pid).then(function () {
          resolve();
        });
        _this3.runner = false;
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      return this.stop().then(function () {});
    }
  }]);

  return NodeAppRunner;
}(EventEmitter);

exports.default = NodeAppRunner;

}).call(this,require('_process'))

},{"_process":5}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('../../../shared/js/Constants');

var _Presentation = require('../../../shared/js/classes/Presentation');

var _Presentation2 = _interopRequireDefault(_Presentation);

var _SlideBridge = require('./SlideBridge');

var _SlideBridge2 = _interopRequireDefault(_SlideBridge);

var _MobileServerBridge = require('./MobileServerBridge');

var _MobileServerBridge2 = _interopRequireDefault(_MobileServerBridge);

var _PolarH = require('./sensors/PolarH7');

var _PolarH2 = _interopRequireDefault(_PolarH);

var _Webcam = require('./Webcam');

var _Webcam2 = _interopRequireDefault(_Webcam);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var path = requireNode('path');

var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;

var Presentation = function (_PresentationBase) {
  _inherits(Presentation, _PresentationBase);

  function Presentation(data, role, settings) {
    _classCallCheck(this, Presentation);

    var _this = _possibleConstructorReturn(this, (Presentation.__proto__ || Object.getPrototypeOf(Presentation)).call(this, data, role, settings));

    _this.polarH7 = new _PolarH2.default();
    _this.polarH7.on(_PolarH2.default.HEART_RATE, _this.heartRatePolarHandler.bind(_this));

    _this.webcam = new _Webcam2.default(document.getElementById('webcam-video'));

    window.onbeforeunload = function (event) {
      return _this.closeHandler(event);
    };
    $(window).on('keydown', function (event) {
      return _this.keydownHandler(event);
    });
    bean.on(_this, _Constants.Constants.SET_CURRENT_SLIDE_INDEX, _this.currentSlideIndexChangedHandler.bind(_this));

    $('body').on(_Constants.Constants.GO_TO_PREVIOUS_SLIDE, _this.goToPreviousSlide.bind(_this));
    $('body').on(_Constants.Constants.GO_TO_NEXT_SLIDE, _this.goToNextSlide.bind(_this));
    $('body').on(_Constants.Constants.OPEN_COMMAND_LINE, _this.openCommandLine.bind(_this));
    $('body').on(_Constants.Constants.OPEN_CAMERA, _this.openCamera.bind(_this));
    return _this;
  }

  _createClass(Presentation, [{
    key: 'closeHandler',
    value: function closeHandler(event) {// eslint-disable-line no-unused-vars
    }
  }, {
    key: 'currentSlideIndexChangedHandler',
    value: function currentSlideIndexChangedHandler(slideIndex) {// eslint-disable-line no-unused-vars
    }
  }, {
    key: 'createMobileServerBridge',
    value: function createMobileServerBridge() {
      return new _MobileServerBridge2.default(this, this.settings);
    }
  }, {
    key: 'toggleElevatorMusic',
    value: function toggleElevatorMusic() {
      this.elevatorMusicPlaying = !this.elevatorMusicPlaying;
      if (this.elevatorMusicPlaying) {
        this.elevatorMusic.play();
      } else {
        this.elevatorMusic.pause();
      }
    }

    //prepend urls with file:/// (faster?)

  }, {
    key: 'processSlideSrc',
    value: function processSlideSrc(src) {
      src = 'file:///' + path.resolve(this.settings.presentationPath, src);
      src = src.replace(/\\/g, '/');
      return src;
    }
  }, {
    key: 'createSlideBridges',
    value: function createSlideBridges(data) {
      _Presentation2.default.prototype.createSlideBridges.call(this, data);
      var that = this;
      var $slideMenu = $('#slideMenu');
      var numSlideBridges = this.slideBridges.length;
      for (var i = 0; i < numSlideBridges; i++) {
        var slideBridge = this.slideBridges[i];
        $slideMenu.append('<button type="button" data-slidenr="' + i + '" class="dropdown-item">' + (i + 1) + ' ' + slideBridge.name + '</button>');
      }
      $slideMenu.find('button').on('click', function (event) {
        event.preventDefault();
        that.setCurrentSlideIndex(parseInt($(this).data('slidenr')));
      });
    }
  }, {
    key: 'createSlideBridge',
    value: function createSlideBridge(slide) {
      //use our own bridge which doesn't use fetch
      return new _SlideBridge2.default(slide);
    }
  }, {
    key: 'slideMessageHandler',
    value: function slideMessageHandler(event) {
      _Presentation2.default.prototype.slideMessageHandler.call(this, event);
      if (!event.data) {
        return;
      }
      switch (event.data.action) {
        case _Constants.Constants.GO_TO_PREVIOUS_SLIDE:
          this.goToPreviousSlide();
          break;
        case _Constants.Constants.GO_TO_NEXT_SLIDE:
          this.goToNextSlide();
          break;
        case _Constants.Constants.OPEN_COMMAND_LINE:
          this.openCommandLine();
          break;
        case _Constants.Constants.OPEN_CAMERA:
          this.openCamera();
          break;
      }
    }
  }, {
    key: 'keydownHandler',
    value: function keydownHandler(event) {
      var _this2 = this;

      //one frame delay
      window.requestAnimationFrame(function () {
        if (event.isImmediatePropagationStopped()) {
          return;
        }
        switch (event.keyCode) {
          case KEYCODE_LEFT:
            _this2.goToPreviousSlide();
            break;
          case KEYCODE_RIGHT:
            _this2.goToNextSlide();
            break;
          case KEYCODE_SPACE:
            $('#presentation-controls').toggle();
            break;
        }
      });
    }
  }, {
    key: 'childAppDataHandler',
    value: function childAppDataHandler(data) {
      var currentSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex);
      if (currentSlideBridge) {
        currentSlideBridge.tryToPostMessage({
          action: _Constants.Constants.CHILD_APP_STDOUT_DATA,
          data: data
        });
      }
    }
  }, {
    key: 'childAppErrorHandler',
    value: function childAppErrorHandler(data) {
      var currentSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex);
      if (currentSlideBridge) {
        currentSlideBridge.tryToPostMessage({
          action: _Constants.Constants.CHILD_APP_STDERR_DATA,
          data: data
        });
      }
    }
  }, {
    key: 'heartRatePolarHandler',
    value: function heartRatePolarHandler(heartRate) {
      $('#global-heart-rate').text(heartRate);
      var currentSlideBridge = this.getSlideBridgeByIndex(this.currentSlideIndex);
      if (currentSlideBridge) {
        currentSlideBridge.tryToPostMessage({
          action: _Constants.Constants.HEART_RATE_POLAR,
          heartRate: heartRate
        });
      }
    }
  }, {
    key: 'openCommandLine',
    value: function openCommandLine() {
      $('#consoleModal').modal('show');
    }
  }, {
    key: 'openCamera',
    value: function openCamera() {
      $('#webcamModal').modal('show');
    }
  }, {
    key: 'handleMobileServerMessage',
    value: function handleMobileServerMessage(message) {
      if (message.content) {
        if (message.content.action === 'goToNextSlide') {
          this.goToNextSlide();
        } else if (message.content.action === 'goToPreviousSlide') {
          this.goToPreviousSlide();
        }
      }
    }
  }]);

  return Presentation;
}(_Presentation2.default);

exports.default = Presentation;

},{"../../../shared/js/Constants":45,"../../../shared/js/classes/Presentation":47,"./MobileServerBridge":8,"./SlideBridge":11,"./Webcam":12,"./sensors/PolarH7":33}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _SlideBridge = require('../../../shared/js/classes/SlideBridge');

var _SlideBridge2 = _interopRequireDefault(_SlideBridge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SlideBridge = function (_SlideBridgeBase) {
  _inherits(SlideBridge, _SlideBridgeBase);

  function SlideBridge() {
    _classCallCheck(this, SlideBridge);

    return _possibleConstructorReturn(this, (SlideBridge.__proto__ || Object.getPrototypeOf(SlideBridge)).apply(this, arguments));
  }

  _createClass(SlideBridge, [{
    key: 'attachToSlideHolder',
    value: function attachToSlideHolder(slideHolder, src, cb) {
      var _this2 = this;

      // console.log('attachToSlideHolder', src);
      // console.log(slideHolder);
      this.slideHolder = slideHolder;
      //notify the content it is being cleared
      this.tryToPostMessage({ action: 'destroy' });
      //clear the current content
      this.slideHolder.innerHTML = '';
      $(slideHolder).attr('data-name', this.name);
      $(slideHolder).addClass('loading');

      $(slideHolder).off('load');
      $(slideHolder).on('load', function () {
        _this2.tryToPostMessage({
          action: 'setState',
          state: _this2.state
        });
        $(slideHolder).off('load');
      });

      if (src !== $(slideHolder).attr('data-src')) {
        (function () {
          //create html import
          var $importEl = $('<link rel="import">');
          var importEl = $importEl[0];
          $importEl.on('load', function () {
            var template = importEl.import.querySelector('template');
            if (template) {
              var clone = document.importNode(template.content, true);
              _this2.slideHolder.appendChild(clone);
            }
            $importEl.remove();
            $(slideHolder).removeClass('loading');
            cb();
          });
          $importEl.attr('href', src);
          $(slideHolder).attr('data-src', src);
          $(slideHolder).html($importEl);
        })();
      }
    }
  }]);

  return SlideBridge;
}(_SlideBridge2.default);

exports.default = SlideBridge;

},{"../../../shared/js/classes/SlideBridge":48}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var getUserMedia = function getUserMedia(config) {
  return new Promise(function (resolve, reject) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia(config, function (stream) {
      resolve(stream);
    }, function (err) {
      return reject(err);
    });
  });
};

var getCameraConfig = function getCameraConfig(videoWidth) {
  return new Promise(function (resolve) {
    MediaStreamTrack.getSources(function (mediaSources) {
      var sourceId = void 0;
      mediaSources.forEach(function (mediaSource) {
        if (mediaSource.kind === 'video') {
          console.log(mediaSource.label.toLowerCase());
          if (!sourceId || mediaSource.label.toLowerCase().indexOf('facetime') === -1) {
            sourceId = mediaSource.id;
          }
        }
      });
      var cameraConfig = {
        video: {
          optional: [{ sourceId: sourceId }, { minWidth: videoWidth }]
        }
      };
      resolve(cameraConfig);
    });
  });
};

var Webcam = function Webcam(video) {
  var _this = this;

  _classCallCheck(this, Webcam);

  this.video = video;
  getCameraConfig(1280).then(function (config) {
    return getUserMedia(config);
  }).then(function (stream) {
    _this.video.src = window.URL.createObjectURL(stream);
    _this.video.onloadedmetadata = function () {
      _this.video.width = _this.video.videoWidth;
      _this.video.height = _this.video.videoHeight;
      _this.video.play();
    };
  });
};

exports.default = Webcam;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _HeartRateCanvas = require('../../HeartRateCanvas');

var _HeartRateCanvas2 = _interopRequireDefault(_HeartRateCanvas);

var _SparkHeartRatesPlugin = require('./SparkHeartRatesPlugin');

var _SparkHeartRatesPlugin2 = _interopRequireDefault(_SparkHeartRatesPlugin);

var _Preload = require('./states/Preload');

var _Preload2 = _interopRequireDefault(_Preload);

var _Play = require('./states/Play');

var _Play2 = _interopRequireDefault(_Play);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Game = function (_Phaser$Game) {
  _inherits(Game, _Phaser$Game);

  function Game(slideHolder, width, height, renderMode, container) {
    _classCallCheck(this, Game);

    var _this = _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this, width, height, renderMode, container, { preload: function preload() {
        return _this.preload();
      } }));

    _this.slideHolder = slideHolder;
    _this.state.add('Preload', _Preload2.default);
    _this.state.add('Play', _Play2.default);

    _this.player1HeartRateCanvas = new _HeartRateCanvas2.default(_this.slideHolder.querySelector('.player1-container canvas'));
    _this.player1HeartRateText = _this.slideHolder.querySelector('.player1-container .heartRate');
    _this.player2HeartRateCanvas = new _HeartRateCanvas2.default(_this.slideHolder.querySelector('.player2-container canvas'));
    _this.player2HeartRateText = _this.slideHolder.querySelector('.player2-container .heartRate');
    return _this;
  }

  _createClass(Game, [{
    key: 'preload',
    value: function preload() {
      var _this2 = this;

      this.sparkHeartRatesPlugin = this.plugins.add(_SparkHeartRatesPlugin2.default);
      this.onPause.add(function () {
        return _this2.manageSparkHeartRatesPluginConnection();
      });
      this.onResume.add(function () {
        return _this2.manageSparkHeartRatesPluginConnection();
      });
      this.manageSparkHeartRatesPluginConnection();
      this.state.start('Preload');
    }
  }, {
    key: 'update',
    value: function update(time) {
      _get(Game.prototype.__proto__ || Object.getPrototypeOf(Game.prototype), 'update', this).call(this, time);
      if (!this.sparkHeartRatesPlugin) {
        return;
      }
      this.player1HeartRateCanvas.tick();
      this.player1HeartRateCanvas.updateHeartRate(this.sparkHeartRatesPlugin.player1.heartRate);
      this.player1HeartRateText.innerHTML = this.sparkHeartRatesPlugin.player1.heartRate;
      this.player2HeartRateCanvas.tick();
      this.player2HeartRateCanvas.updateHeartRate(this.sparkHeartRatesPlugin.player2.heartRate);
      this.player2HeartRateText.innerHTML = this.sparkHeartRatesPlugin.player2.heartRate;
    }
  }, {
    key: 'manageSparkHeartRatesPluginConnection',
    value: function manageSparkHeartRatesPluginConnection() {
      console.log('[Game] manageSparkHeartRatesPluginConnection');
      if (this.paused) {
        this.sparkHeartRatesPlugin.close();
      } else {
        this.sparkHeartRatesPlugin.connect();
      }
    }
  }]);

  return Game;
}(Phaser.Game);

exports.default = Game;

},{"../../HeartRateCanvas":7,"./SparkHeartRatesPlugin":14,"./states/Play":18,"./states/Preload":19}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PLAYER_1_SPARK_ID = "55ff70065075555332171787"; //red one
var PLAYER_2_SPARK_ID = "53ff73065075535143191387"; //blue one

var SparkHeartRatesPlugin = function (_Phaser$Plugin) {
  _inherits(SparkHeartRatesPlugin, _Phaser$Plugin);

  function SparkHeartRatesPlugin(game, parent) {
    _classCallCheck(this, SparkHeartRatesPlugin);

    var _this = _possibleConstructorReturn(this, (SparkHeartRatesPlugin.__proto__ || Object.getPrototypeOf(SparkHeartRatesPlugin)).call(this, game, parent));

    _this.connected = false;
    return _this;
  }

  _createClass(SparkHeartRatesPlugin, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      console.log("SparkHeartRatesPlugin Plugin init");
      this.player1 = {
        sparkId: PLAYER_1_SPARK_ID,
        heartRate: 0
      };
      this.player2 = {
        sparkId: PLAYER_2_SPARK_ID,
        heartRate: 0
      };
      this._udpErrorHandler = function (error) {
        return _this2.udpErrorHandler(error);
      };
      this._udpMessageHandler = function (message, remoteInfo) {
        return _this2.udpMessageHandler(message, remoteInfo);
      };
      this._udpListeningHandler = function () {
        return _this2.udpListeningHandler();
      };
    }
  }, {
    key: "connect",
    value: function connect() {
      if (this.connected) {
        return;
      }
      console.log("SparkHeartRatesPlugin connect");
      this.connected = true;
      var dgram = void 0;
      try {
        dgram = requireNode !== null ? requireNode("dgram") : require("dgram");
      } catch (e) {
        console.error(e);
      }
      if (!dgram) {
        return;
      }
      this.udpSocket = dgram.createSocket("udp4");
      this.udpSocket.on("error", this._udpErrorHandler);
      this.udpSocket.on("message", this._udpMessageHandler);
      this.udpSocket.on("listening", this._udpListeningHandler);
      this.udpSocket.bind(1234);
    }
  }, {
    key: "close",
    value: function close() {
      if (!this.connected) {
        return;
      }
      console.log("SparkHeartRatesPlugin close");
      this.connected = false;
      if (!this.udpSocket) {
        return;
      }
      this.udpSocket.removeListener("error", this._udpErrorHandler);
      this.udpSocket.removeListener("message", this._udpMessageHandler);
      this.udpSocket.removeListener("listening", this._udpListeningHandler);
      this.udpSocket.close();
      this.udpSocket = null;
    }
  }, {
    key: "udpErrorHandler",
    value: function udpErrorHandler(error) {
      console.log("[SparkHeartRatesPlugin] udpErrorHandler", error);
      this.udpSocket.close();
    }
  }, {
    key: "udpMessageHandler",
    value: function udpMessageHandler(message, remoteInfo) {
      // eslint-disable-line no-unused-vars
      var str = message.toString();
      var split = str.split(";");
      if (split.length > 2) {
        this.setHeartRate(split[0], split[2]);
      }
    }
  }, {
    key: "udpListeningHandler",
    value: function udpListeningHandler() {
      console.log("[SparkHeartRatesPlugin] udpListening");
    }
  }, {
    key: "setHeartRate",
    value: function setHeartRate(sparkId, heartRate) {
      heartRate = parseInt(heartRate);
      if (this.player1.sparkId === sparkId) {
        this.player1.heartRate = heartRate;
        return;
      }
      if (this.player2.sparkId === sparkId) {
        this.player2.heartRate = heartRate;
        return;
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.close();
      _get(SparkHeartRatesPlugin.prototype.__proto__ || Object.getPrototypeOf(SparkHeartRatesPlugin.prototype), "destroy", this).call(this);
    }
  }]);

  return SparkHeartRatesPlugin;
}(Phaser.Plugin);

exports.default = SparkHeartRatesPlugin;

},{"dgram":1}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Button = function (_Phaser$Button) {
  _inherits(Button, _Phaser$Button);

  function Button(game, x, y, callback, callbackContext, colorName, label) {
    _classCallCheck(this, Button);

    var _this = _possibleConstructorReturn(this, (Button.__proto__ || Object.getPrototypeOf(Button)).call(this, game, x, y, "components", callback, callbackContext, colorName + "-over", colorName + "-normal", colorName + "-down"));

    _this.labelField = new Phaser.Text(game, 0, 0, "", {
      font: "36px Arial",
      fill: "#ffffff"
    });
    _this.labelField.anchor.setTo(0.5, 0.5);
    _this.addChild(_this.labelField);
    _this.label = label;
    return _this;
  }

  _createClass(Button, [{
    key: "label",
    set: function set(value) {
      this.labelField.text = value;
    },
    get: function get() {
      return this.labelField.text;
    }
  }]);

  return Button;
}(Phaser.Button);

exports.default = Button;

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Flagpole = function (_Phaser$Group) {
  _inherits(Flagpole, _Phaser$Group);

  function Flagpole(game, x, y) {
    _classCallCheck(this, Flagpole);

    var _this = _possibleConstructorReturn(this, (Flagpole.__proto__ || Object.getPrototypeOf(Flagpole)).call(this, game));

    _this.x = x;
    _this.y = y;

    _this.pole = new Phaser.Sprite(_this.game, 0, 0, "mario-graphics", "flagpole.png");
    _this.pole.anchor.setTo(0.5, 1);
    _this.add(_this.pole);

    _this.flag = new Phaser.Sprite(_this.game, 0, 0, "mario-graphics", "flag-moving1.png");
    _this.flag.anchor.setTo(0, 1);
    _this.flag.y = -_this.pole.height + _this.flag.height + 20;
    _this.flag.animations.add("moving", ["flag-moving1.png", "flag-moving2.png", "flag-moving3.png"], 10, true, true);
    _this.flag.animations.play("moving");
    _this.add(_this.flag);
    return _this;
  }

  return Flagpole;
}(Phaser.Group);

exports.default = Flagpole;

},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GameCharacter = function (_Phaser$Sprite) {
  _inherits(GameCharacter, _Phaser$Sprite);

  function GameCharacter(game, x, y, character) {
    _classCallCheck(this, GameCharacter);

    var _this = _possibleConstructorReturn(this, (GameCharacter.__proto__ || Object.getPrototypeOf(GameCharacter)).call(this, game, x, y, "mario-graphics", character + "-run-1.png"));

    _this.anchor.setTo(0.5, 1);
    _this.animations.add("stand", [character + "-run-1.png"], 10, true, true);
    _this.animations.add("run", [character + "-run-1.png", character + "-run-2.png", character + "-run-3.png", character + "-run-4.png"], 10, true, true);
    _this.animations.add("jump", [character + "-jump.png"], 10, true, true);
    _this.game.physics.arcade.enable(_this);
    _this.body.gravity.y = 1000;
    return _this;
  }

  _createClass(GameCharacter, [{
    key: "stand",
    value: function stand() {
      this.animations.play("stand");
      this.body.velocity.x = 0;
    }
  }, {
    key: "run",
    value: function run(speed) {
      this.body.velocity.x = speed;
      this.animations.play("run");
    }
  }, {
    key: "jump",
    value: function jump() {
      if (this.body.touching.down) {
        this.animations.play("jump");
        this.body.velocity.x = 100;
        this.body.velocity.y = -750;
      }
    }
  }]);

  return GameCharacter;
}(Phaser.Sprite);

exports.default = GameCharacter;

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Button = require('../objects/Button');

var _Button2 = _interopRequireDefault(_Button);

var _GameCharacter = require('../objects/GameCharacter');

var _GameCharacter2 = _interopRequireDefault(_GameCharacter);

var _Flagpole = require('../objects/Flagpole');

var _Flagpole2 = _interopRequireDefault(_Flagpole);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SUBSTATE_INTRO = 'intro';
var SUBSTATE_PLAY = 'play';
var SUBSTATE_JUMP_POLE = 'jump';
var SUBSTATE_FINISHED = 'finished';

var WINNER_DISTANCE_POLE = 100;

var Play = function (_Phaser$State) {
  _inherits(Play, _Phaser$State);

  function Play() {
    _classCallCheck(this, Play);

    return _possibleConstructorReturn(this, (Play.__proto__ || Object.getPrototypeOf(Play)).apply(this, arguments));
  }

  _createClass(Play, [{
    key: 'init',
    value: function init() {
      // if(!this.game.backgroundVideo) {
      //   this.game.backgroundVideo = this.add.video('background-video');
      //   this.game.backgroundVideo.play(true);
      // }
      // this.game.backgroundVideo.addToWorld();
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }, {
    key: 'create',
    value: function create() {
      this.createEnvironment();
      this.createPlayers();
      this.createButtons();

      this.setSubState(SUBSTATE_INTRO);
    }
  }, {
    key: 'createEnvironment',
    value: function createEnvironment() {
      this.ground = this.add.tileSprite(0, this.world.height, this.world.width, 82, 'mario-graphics', 'ground.png');
      this.ground.anchor.setTo(0, 1);
      this.physics.arcade.enable(this.ground);
      this.ground.body.immovable = true;

      this.hills = this.add.tileSprite(0, this.world.height - 82, this.world.width, 428, 'mario-graphics', 'hills.png');
      this.hills.anchor.setTo(0, 1);

      this.flagpole = new _Flagpole2.default(this.game, this.world.width - 50, this.world.height - 82);
      this.add.existing(this.flagpole);
    }
  }, {
    key: 'createPlayers',
    value: function createPlayers() {
      this.peach = this.add.existing(new _GameCharacter2.default(this.game, 30, 10, 'peach'));
      this.mario = this.add.existing(new _GameCharacter2.default(this.game, 10, 10, 'mario'));
    }
  }, {
    key: 'createButtons',
    value: function createButtons() {
      this.playButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.playClicked, this, 'blue', 'Play');
      this.playButton.anchor.setTo(0.5, 0.5);
      this.add.existing(this.playButton);

      this.stopButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.stopClicked, this, 'blue', 'Stop');
      this.stopButton.anchor.setTo(0.5, 0.5);
      this.add.existing(this.stopButton);
    }
  }, {
    key: 'update',
    value: function update() {
      this.physics.arcade.collide(this.ground, this.peach);
      this.physics.arcade.collide(this.ground, this.mario);
      if (this.subState === SUBSTATE_PLAY) {
        this.updatePlayState();
      } else if (this.subState === SUBSTATE_JUMP_POLE) {
        this.updateJumpState();
      } else if (this.subState === SUBSTATE_FINISHED) {
        this.updateFinishedState();
      }
    }
  }, {
    key: 'updatePlayState',
    value: function updatePlayState() {
      var distanceMario = this.flagpole.x - this.mario.x;
      var distancePeach = this.flagpole.x - this.peach.x;
      this.peach.run(this.game.sparkHeartRatesPlugin.player1.heartRate);
      this.mario.run(this.game.sparkHeartRatesPlugin.player2.heartRate);
      if (distanceMario < WINNER_DISTANCE_POLE || distancePeach < WINNER_DISTANCE_POLE) {
        if (distanceMario < distancePeach) {
          this.winner = this.mario;
          this.loser = this.peach;
        } else {
          this.winner = this.peach;
          this.loser = this.mario;
        }
        this.setSubState(SUBSTATE_JUMP_POLE);
      }
    }
  }, {
    key: 'updateJumpState',
    value: function updateJumpState() {
      var distanceWinner = this.flagpole.x - this.winner.x;
      if (distanceWinner <= 0) {
        this.winner.body.velocity.x = 0;
        this.setSubState(SUBSTATE_FINISHED);
      }
    }
  }, {
    key: 'updateFinishedState',
    value: function updateFinishedState() {
      this.flagpole.flag.y = this.winner.y - this.flagpole.y;
    }
  }, {
    key: 'setSubState',
    value: function setSubState(value) {
      this.subState = value;
      this.playButton.visible = false;
      this.stopButton.visible = false;
      if (this.subState === SUBSTATE_PLAY) {
        this.stopButton.visible = true;
        // this.peach.run(100);
        // this.mario.run(50);
      } else if (this.subState === SUBSTATE_JUMP_POLE) {
        this.stopButton.visible = true;
        this.loser.stand();
        this.winner.jump();
      } else if (this.subState === SUBSTATE_FINISHED) {
        this.playButton.visible = true;
      } else {
        this.playButton.visible = true;
      }
    }
  }, {
    key: 'playClicked',
    value: function playClicked() {
      this.setSubState(SUBSTATE_PLAY);
    }
  }, {
    key: 'stopClicked',
    value: function stopClicked() {
      this.state.start('Play');
    }
  }]);

  return Play;
}(Phaser.State);

exports.default = Play;

},{"../objects/Button":15,"../objects/Flagpole":16,"../objects/GameCharacter":17}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preload = function (_Phaser$State) {
  _inherits(Preload, _Phaser$State);

  function Preload() {
    _classCallCheck(this, Preload);

    return _possibleConstructorReturn(this, (Preload.__proto__ || Object.getPrototypeOf(Preload)).apply(this, arguments));
  }

  _createClass(Preload, [{
    key: "init",
    value: function init() {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.stage.backgroundColor = "#5088a0";
    }
  }, {
    key: "preload",
    value: function preload() {
      this.load.atlasJSONHash("components", "assets/mario/components.png", "assets/mario/components.json");
      this.load.atlasJSONHash("mario-graphics", "assets/mario/mario-graphics.png", "assets/mario/mario-graphics.json");
    }
  }, {
    key: "create",
    value: function create() {
      this.state.start("Play");
    }
  }]);

  return Preload;
}(Phaser.State);

exports.default = Preload;

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = requireNode("fs-promise");

var CodeElement = function () {
  function CodeElement(el, options) {
    _classCallCheck(this, CodeElement);

    this.el = el;
    this.$el = $(el);
    //options
    if (!options) {
      options = {};
    }

    var width = $(el).parent()[0].style.width || "100%";
    var height = $(el).parent()[0].style.height || "100%";

    //wrap element in a container
    this.$wrapperEl = $(el).wrap("<div class=\"live-code-element live-code-code-element\"></div>").parent();
    this.wrapperEl = this.$wrapperEl[0];

    this.id = this.$el.attr("data-id");
    this.file = this.$el.data("file");

    if (!this.id && this.file) {
      this.id = this.file;
    }
    if (!this.id) {
      this.id = "code-" + Math.round(Math.random() * 1000 * new Date().getTime());
    }
    this.$el.attr("data-id", this.id);

    this.runtime = this.$el.data("runtime");
    if (!this.runtime) {
      this.runtime = "browser";
    }

    this.console = this.$el.data("console");
    this.processor = this.$el.data("processor");

    //language is programming language - used for injecting in html
    this.language = this.$el.data("language");
    if (!this.language) {
      //default to javascript
      this.language = "javascript";
    }

    //mode is mode for codemirror
    this.mode = this.$el.data("mode");
    if (!this.mode) {
      //default to the language
      this.mode = this.language;
    }

    this.codeMirror = CodeMirror.fromTextArea(this.el, {
      lineNumbers: true,
      mode: this.mode,
      extraKeys: { "Ctrl-Space": "autocomplete" }
    });

    this.codeMirror.setSize(width, height);

    //this.$el.css('width', '100%').css('height', '100%');
    this.layout();
  }

  _createClass(CodeElement, [{
    key: "pause",
    value: function pause() {
      //no real reason to do pause / resume
    }
  }, {
    key: "resume",
    value: function resume() {
      //no real reason to do pause / resume
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.pause();
    }
  }, {
    key: "getValue",
    value: function getValue() {
      return this.codeMirror.getValue();
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      this.codeMirror.setValue(value);
    }
  }, {
    key: "saveToFile",
    value: function saveToFile(filePath) {
      return fs.writeFile(filePath, this.getValue());
    }
  }, {
    key: "readFromFile",
    value: function readFromFile(filePath) {
      var _this = this;

      return fs.readFile(filePath, "utf8").then(function (data) {
        _this.setValue(data);
        return data;
      });
    }
  }, {
    key: "layout",
    value: function layout() {
      // this.$wrapperEl.find('.CodeMirror-scroll').css('max-height', this.$wrapperEl.css('height'));
      this.codeMirror.refresh();
    }
  }]);

  return CodeElement;
}();

exports.default = CodeElement;

},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _NodeAppRunner = require('../NodeAppRunner');

var _NodeAppRunner2 = _interopRequireDefault(_NodeAppRunner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var htmlEscape = function htmlEscape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var needsJSONConversion = function needsJSONConversion(arg) {
  if (typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'boolean') {
    return false;
  }
  return true;
};

var ConsoleElement = function () {
  function ConsoleElement(el, options) {
    var _this = this;

    _classCallCheck(this, ConsoleElement);

    this.el = el;
    this.$el = $(el);

    this.nodeAppRunner = new _NodeAppRunner2.default();
    this.nodeAppRunner.on('stdout-data', function (data) {
      return _this.info([data]);
    });
    this.nodeAppRunner.on('stderr-data', function (error) {
      return _this.error([error]);
    });

    //options
    if (!options) {
      options = {};
    }
    //wrap element in a container
    this.$wrapperEl = $(el).wrap('<div class="live-code-element live-code-console-element unreset"></div>').parent();
    this.wrapperEl = this.$wrapperEl[0];

    this.id = this.$el.attr('data-id');
    if (!this.id) {
      //generate id
      this.id = 'code-' + Math.round(Math.random() * 1000 * new Date().getTime());
      this.$el.attr('data-id', this.id);
    }

    this.file = this.$el.data('file');

    this.$el.css('width', '100%').css('height', '100%');

    this.logs = [];

    this.isRunning = false;
  }

  _createClass(ConsoleElement, [{
    key: 'pause',
    value: function pause() {
      if (!this.isRunning) {
        return;
      }
      this.isRunning = false;
      this.nodeAppRunner.stop();
    }
  }, {
    key: 'resume',
    value: function resume() {
      if (this.isRunning) {
        return;
      }
      if (!this.applicationPath) {
        return;
      }
      this.nodeAppRunner.run(this.applicationPath);
      this.isRunning = true;
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.pause();
    }
  }, {
    key: 'runNodeApp',
    value: function runNodeApp(applicationPath) {
      this.pause();
      this.applicationPath = applicationPath;
      this.resume();
    }
  }, {
    key: 'info',
    value: function info(args) {
      var str = '';
      args.forEach(function (arg) {
        if (str.length > 0) {
          str += ' ';
        }
        //is it an object or a simple type?
        if (needsJSONConversion(arg)) {
          arg = JSON.stringify(arg);
        }
        str += htmlEscape(arg);
      });
      this.logs.push('<pre>' + str + '</pre>');
      while (this.logs.length > 20) {
        this.logs.shift();
      }
      var html = this.logs.join('');
      this.el.innerHTML = html;
      this.wrapperEl.scrollTop = this.wrapperEl.scrollHeight;
    }
  }, {
    key: 'error',
    value: function error(args) {
      var str = '';
      args.forEach(function (arg) {
        if (str.length > 0) {
          str += ' ';
        }
        //is it an object or a simple type?
        if (needsJSONConversion(arg)) {
          arg = JSON.stringify(arg);
        }
        str += htmlEscape(arg);
      });
      this.logs.push('<pre class="console-error">' + str + '</pre>');
      while (this.logs.length > 20) {
        this.logs.shift();
      }
      var html = this.logs.join('');
      this.el.innerHTML = html;
      this.wrapperEl.scrollTop = this.wrapperEl.scrollHeight;
    }
  }]);

  return ConsoleElement;
}();

exports.default = ConsoleElement;

},{"../NodeAppRunner":9}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TERMINAL_URL = "http://localhost:3000";

var TerminalElement = function () {
  function TerminalElement(el, options) {
    var _this = this;

    _classCallCheck(this, TerminalElement);

    this.el = el;
    this.$el = $(el);

    this._ipcMessageHandler = function (e) {
      return _this.ipcMessageHandler(e);
    };

    //options
    if (!options) {
      options = {};
    }
    //wrap element in a container
    this.$wrapperEl = $(el).wrap("<div class=\"live-code-element live-code-terminal-element\"></div>").parent();
    this.wrapperEl = this.$wrapperEl[0];

    this.id = this.$el.attr("data-id");
    if (!this.id) {
      //generate id
      this.id = "code-" + Math.round(Math.random() * 1000 * new Date().getTime());
      this.$el.attr("data-id", this.id);
    }

    this.dir = this.$el.data("dir");
    this.autorun = this.$el.data("autorun");

    this.$el.css("width", "100%").css("height", "100%");

    this.isRunning = false;
  }

  _createClass(TerminalElement, [{
    key: "pause",
    value: function pause() {
      this.isRunning = false;
      if (this.webview) {
        this.webview.parentNode.removeChild(this.webview);
        this.webview = false;
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      if (this.isRunning) {
        return;
      }
      this.isRunning = true;
      //create a webview tag
      if (this.webview) {
        this.webview.removeEventListener("ipc-message", this._ipcMessageHandler);
        this.webview.parentNode.removeChild(this.webview);
        this.webview = false;
      }
      this.webview = document.createElement("webview");
      // this.webview.addEventListener('dom-ready', () => {
      //   this.webview.openDevTools();
      // });
      this.webview.addEventListener("ipc-message", this._ipcMessageHandler);
      this.webview.style.width = "100%";
      this.webview.style.height = "100%";
      this.webview.setAttribute("nodeintegration", "");
      this.webview.setAttribute("src", TERMINAL_URL);
      this.el.appendChild(this.webview);
    }
  }, {
    key: "ipcMessageHandler",
    value: function ipcMessageHandler(e) {
      if (e.channel !== "message-from-terminal") {
        return;
      }
      if (e.args.length < 1) {
        return;
      }
      var o = e.args[0];
      if (!o.command) {
        return;
      }
      switch (o.command) {
        case "init":
          if (this.dir) {
            this.executeCommand("cd " + this.dir);
            this.executeCommand("clear");
          }
          if (this.autorun) {
            this.executeCommand(this.autorun);
          }
          break;
        default:
          console.warn("unknow command object from terminal");
          console.warn(o);
          break;
      }
    }
  }, {
    key: "executeCommand",
    value: function executeCommand(commandString) {
      this.webview.send("message-to-terminal", {
        command: "execute",
        value: commandString
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.pause();
    }
  }]);

  return TerminalElement;
}();

exports.default = TerminalElement;

},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebPreviewElement = function () {
  function WebPreviewElement(el, options) {
    _classCallCheck(this, WebPreviewElement);

    this.el = el;
    this.$el = $(el);
    //options
    if (!options) {
      options = {};
    }
    //wrap element in a container
    this.$wrapperEl = $(el).wrap("<div class=\"live-code-element live-code-web-preview-element\"></div>").parent();
    this.wrapperEl = this.$wrapperEl[0];

    this.id = this.$el.attr("data-id");
    if (!this.id) {
      //generate id
      this.id = "code-" + Math.round(Math.random() * 1000 * new Date().getTime());
      this.$el.attr("data-id", this.id);
    }

    this.file = this.$el.data("file") || this.$el.data("url");
    this.autoload = this.$el.data("autoload");

    this.console = this.$el.data("console");

    this.$el.css("width", "100%").css("height", "100%");

    this.url = false;
    this.blocks = false;
    this.isRunning = false;
    //webview gets created by calling updateUrl or updateCode
  }

  _createClass(WebPreviewElement, [{
    key: "destroy",
    value: function destroy() {
      this.pause();
    }
  }, {
    key: "pause",
    value: function pause() {
      this.isRunning = false;
      if (this.webview) {
        this.webview.removeEventListener("did-get-response-details", this._didGetResponseDetailsHandler);
        this.webview.removeEventListener("did-fail-load", this._didFailLoadHandler);
        this.webview.removeEventListener("ipc-message", this._ipcMessageHandler);
        this.webview.parentNode.removeChild(this.webview);
        this.webview = false;
        clearTimeout(this.retryTimeout);
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      if (this.isRunning) {
        return;
      }
      if (this.url === false && this.blocks === false) {
        return;
      }
      this.isRunning = true;
      this._createWebview();
    }
  }, {
    key: "_createWebview",
    value: function _createWebview() {
      var _this = this;

      //create a webview tag
      if (this.webview) {
        this.webview.parentNode.removeChild(this.webview);
        this.webview = false;
      }
      this.webview = document.createElement("webview");
      this.webview.style.width = "100%";
      this.webview.style.height = "100%";
      this.webview.preload = "js/webpreview.js";
      this.el.appendChild(this.webview);

      var url = this.url !== false ? this.url : "webpreview.html";
      var htmlSrc = "";
      if (this.blocks !== false) {
        for (var i = 0; i < this.blocks.length; i++) {
          htmlSrc += this.blocks[i].code;
        }
      }

      //add listeners
      this._didGetResponseDetailsHandler = function (e) {
        if (e.originalURL !== _this.webview.src) {
          return;
        }
        if (_this.$el.attr("data-open-devtools")) {
          _this.webview.openDevTools();
        }
      };
      this.webview.addEventListener("did-get-response-details", this._didGetResponseDetailsHandler);

      this._didFailLoadHandler = function () {
        _this.retryTimeout = setTimeout(function () {
          _this.pause();
          _this.resume();
        }, 1000);
      };
      this.webview.addEventListener("did-fail-load", this._didFailLoadHandler);

      this._ipcMessageHandler = function (event) {
        if (event.channel === "request-html") {
          _this.webview.send("receive-html", htmlSrc);
        } else if (event.channel === "console.log") {
          //notify live code editor
          _this.$wrapperEl.trigger("console.log", event.args[0]);
        } else if (event.channel === "console.error") {
          //notify live code editor
          _this.$wrapperEl.trigger("console.error", event.args[0]);
        }
      };
      this.webview.addEventListener("ipc-message", this._ipcMessageHandler);

      if (!this.$el.attr("data-disable-nodeintegration")) {
        this.webview.setAttribute("nodeintegration", "");
      }
      this.webview.setAttribute("src", url);
    }
  }, {
    key: "updateUrl",
    value: function updateUrl(url) {
      this.pause();
      this.url = url;
      this.blocks = false;
      this.resume();
    }
  }, {
    key: "updateCode",
    value: function updateCode(blocks) {
      this.pause();
      this.url = false;
      this.blocks = blocks;
      this.resume();
    }
  }, {
    key: "needsOutputPathPrefix",
    get: function get() {
      return !this.$el.data("url");
    }
  }]);

  return WebPreviewElement;
}();

exports.default = WebPreviewElement;

},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebcamElement = function () {
  function WebcamElement(el, options) {
    _classCallCheck(this, WebcamElement);

    this.el = el;
    this.$el = $(el);

    //options
    if (!options) {
      options = {};
    }

    this.id = this.$el.attr("data-id");
    if (!this.id) {
      //generate id
      this.id = "webcam-" + Math.round(Math.random() * 1000 * new Date().getTime());
      this.$el.attr("data-id", this.id);
    }

    this.source = this.$el.attr("data-source");
    if (this.source) {
      this.sourceEl = document.querySelector(this.source);
    }

    this.ctx = this.el.getContext("2d");

    this.isRunning = false;
  }

  _createClass(WebcamElement, [{
    key: "destroy",
    value: function destroy() {
      this.pause();
    }
  }, {
    key: "pause",
    value: function pause() {
      this.isRunning = false;
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }, {
    key: "resume",
    value: function resume() {
      var _this = this;

      if (this.isRunning) {
        return;
      }
      this.isRunning = true;
      this.animationFrameId = window.requestAnimationFrame(function () {
        return _this.drawLoop();
      });
    }
  }, {
    key: "drawLoop",
    value: function drawLoop() {
      var _this2 = this;

      if (this.isRunning) {
        window.requestAnimationFrame(function () {
          return _this2.drawLoop();
        });
      }
      if (!this.sourceEl) {
        return;
      }
      this.el.width = this.sourceEl.width;
      this.el.height = this.sourceEl.height;
      this.ctx.clearRect(0, 0, this.el.width, this.el.height);
      this.ctx.drawImage(this.sourceEl, 0, 0);
    }
  }]);

  return WebcamElement;
}();

exports.default = WebcamElement;

},{}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ConsoleElement = require('./ConsoleElement');

var _ConsoleElement2 = _interopRequireDefault(_ConsoleElement);

var _TerminalElement = require('./TerminalElement');

var _TerminalElement2 = _interopRequireDefault(_TerminalElement);

var _CodeElement = require('./CodeElement');

var _CodeElement2 = _interopRequireDefault(_CodeElement);

var _WebPreviewElement = require('./WebPreviewElement');

var _WebPreviewElement2 = _interopRequireDefault(_WebPreviewElement);

var _WebcamElement = require('./WebcamElement');

var _WebcamElement2 = _interopRequireDefault(_WebcamElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = requireNode('path');
var fs = requireNode('fs-promise');

var LiveCode = function () {
  function LiveCode($el, config, readyCallback) {
    var _this = this;

    _classCallCheck(this, LiveCode);

    this.$el = $el;
    this.el = this.$el[0];

    if (this.$el.attr('data-entry-path')) {
      this.entryPath = path.join(config.presentationPath, this.$el.attr('data-entry-path'));
    }
    if (this.$el.attr('data-output-path')) {
      this.outputPath = path.join(config.presentationPath, this.$el.attr('data-output-path'));
    } else {
      if (this.entryPath) {
        this.outputPath = this.entryPath;
      }
    }

    var p = Promise.resolve();
    p.then(function () {
      if (_this.entryPath && _this.entryPath !== _this.outputPath) {
        return fs.copy(_this.entryPath, _this.outputPath);
      }
    }).then(function () {
      //create the consoles
      _this.consoleElements = {};
      _this.$el.find('[data-type="console"]').each(function (index, consoleEl) {
        return _this.createConsoleElement(consoleEl);
      });

      //create the terminals
      _this.terminalElements = {};
      _this.$el.find('[data-type="terminal"]').each(function (index, terminalEl) {
        return _this.createTerminalElement(terminalEl);
      });

      //create the previews
      _this.webPreviewElements = {};
      _this.$el.find('[data-type="web-preview"]').each(function (index, webPreviewEl) {
        return _this.createWebPreviewElement(webPreviewEl);
      });

      //create the code editors
      _this.codeElements = {};
      _this.$el.find('[data-type="code"]').each(function (index, codeEl) {
        return _this.createCodeElement(codeEl);
      });

      //create the webcam elements
      _this.webcamElements = {};
      _this.$el.find('[data-type="webcam"]').each(function (index, webcamEl) {
        return _this.createWebcamElement(webcamEl);
      });

      //create run buttons
      _this.runButtonEls = [];
      _this.$el.find('[data-type="run-button"]').each(function (index, runButtonEl) {
        return _this.createRunButton(runButtonEl);
      });

      //create save buttons
      _this.saveButtonEls = [];
      _this.$el.find('[data-type="save-button"]').each(function (index, saveButtonEl) {
        return _this.createSaveButton(saveButtonEl);
      });

      //create reload buttons
      _this.reloadButtonEls = [];
      _this.$el.find('[data-type="reload-button"]').each(function (index, reloadButtonEl) {
        return _this.createReloadButton(reloadButtonEl);
      });
    }).then(function () {
      return _this.setCodeElementValuesFromFiles();
    }).then(function () {
      _this.loaded = true;
      if (_this.isRunning) {
        _this.isRunning = false;
        _this.resume();
      }
    }).then(readyCallback).catch(function (err) {
      return console.log(err);
    });

    //disable keyboard bubbling up
    $(window).on('keydown', function (event) {
      return _this.keyDownHandler(event);
    });
  }

  _createClass(LiveCode, [{
    key: 'keyDownHandler',
    value: function keyDownHandler(e) {
      if (this.el.contains(document.activeElement)) {
        e.stopImmediatePropagation();
      }
    }

    /**
     * return a previously created code element, based on the input
     * input can be:
     *  - html dom element
     *  - id of code element
     *
     * returns the code element if found, otherwise returns false
     */

  }, {
    key: 'getCodeElement',
    value: function getCodeElement(input) {
      return this.getElement(this.codeElements, input);
    }

    /**
     * return a previously created web preview element, based on the input
     * input can be:
     *  - html dom element
     *  - id of code element
     *
     * returns the web preview element if found, otherwise returns false
     */

  }, {
    key: 'getWebPreviewElement',
    value: function getWebPreviewElement(input) {
      return this.getElement(this.webPreviewElements, input);
    }
  }, {
    key: 'getElement',
    value: function getElement(elementsCollection, input) {
      var propertyToCheck = 'id';
      if (input.nodeName) {
        propertyToCheck = 'el';
      }
      for (var key in elementsCollection) {
        if (elementsCollection[key][propertyToCheck] === input) {
          return elementsCollection[key];
        }
      }
      return false;
    }
  }, {
    key: 'setCodeElementValueFromFile',
    value: function setCodeElementValueFromFile(codeElement, filePath) {
      return codeElement.readFromFile(filePath);
    }
  }, {
    key: 'saveCodeElementToFile',
    value: function saveCodeElementToFile(codeElement, filePath) {
      return codeElement.saveToFile(filePath);
    }
  }, {
    key: 'getFilePath',
    value: function getFilePath(file) {
      if (!file) {
        return false;
      }
      if (this.outputPath) {
        return path.join(this.outputPath, file);
      }
      return file;
    }
  }, {
    key: 'getFilePathForCodeElement',
    value: function getFilePathForCodeElement(codeElement) {
      if (!codeElement.file) {
        return false;
      }
      return this.getFilePath(codeElement.file);
    }
  }, {
    key: 'setCodeElementValuesFromFiles',
    value: function setCodeElementValuesFromFiles() {
      var tasks = [];
      var key = void 0;
      var codeElement = void 0;
      var filePath = void 0;
      for (key in this.codeElements) {
        codeElement = this.codeElements[key];
        filePath = this.getFilePathForCodeElement(codeElement);
        if (filePath) {
          tasks.push(this.setCodeElementValueFromFile(codeElement, filePath));
        }
      }
      return Promise.all(tasks);
    }
  }, {
    key: 'autoStartWebpreviewElementsWhenNeeded',
    value: function autoStartWebpreviewElementsWhenNeeded() {
      for (var key in this.webPreviewElements) {
        var webPreviewElement = this.webPreviewElements[key];
        if (webPreviewElement.autoload) {
          this.reloadWebPreviewElement(webPreviewElement);
        }
      }
    }
  }, {
    key: 'saveCodeElementsToFiles',
    value: function saveCodeElementsToFiles() {
      var tasks = [];
      var key = void 0;
      var codeElement = void 0;
      var filePath = void 0;
      for (key in this.codeElements) {
        codeElement = this.codeElements[key];
        filePath = this.getFilePathForCodeElement(codeElement);
        if (filePath) {
          tasks.push(this.saveCodeElementToFile(codeElement, filePath));
        }
      }
      return Promise.all(tasks);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this2 = this;

      var key = void 0;
      for (key in this.consoleElements) {
        this.destroyConsoleElement(this.consoleElements[key]);
      }
      for (key in this.terminalElements) {
        this.destroyTerminalElement(this.terminalElements[key]);
      }
      for (key in this.webPreviewElements) {
        this.destroyWebPreviewElement(this.webPreviewElements[key]);
      }
      for (key in this.codeElements) {
        this.destroyCodeElement(this.codeElements[key]);
      }
      for (key in this.webcamElements) {
        this.destroyWebcamElement(this.webcamElements[key]);
      }
      this.runButtonEls.forEach(function (el) {
        return _this2.destroyRunButton(el);
      });
      this.saveButtonEls.forEach(function (el) {
        return _this2.destroySaveButton(el);
      });
      this.reloadButtonEls.forEach(function (el) {
        return _this2.destroyReloadButton(el);
      });
      //TODO: destroy the tmp directory for this instance
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.isRunning = false;
      if (!this.loaded) {
        return;
      }
      var key = void 0;
      for (key in this.consoleElements) {
        this.consoleElements[key].pause();
      }
      for (key in this.terminalElements) {
        this.terminalElements[key].pause();
      }
      for (key in this.webPreviewElements) {
        this.webPreviewElements[key].pause();
      }
      for (key in this.codeElements) {
        this.codeElements[key].pause();
      }
      for (key in this.webcamElements) {
        this.webcamElements[key].pause();
      }
    }
  }, {
    key: 'resume',
    value: function resume() {
      this.isRunning = true;
      if (!this.loaded) {
        return;
      }
      var key = void 0;
      for (key in this.consoleElements) {
        this.consoleElements[key].resume();
      }
      for (key in this.terminalElements) {
        this.terminalElements[key].resume();
      }
      for (key in this.webPreviewElements) {
        this.webPreviewElements[key].resume();
      }
      for (key in this.codeElements) {
        this.codeElements[key].resume();
      }
      for (key in this.webcamElements) {
        this.webcamElements[key].resume();
      }
      this.autoStartWebpreviewElementsWhenNeeded();
    }
  }, {
    key: 'layout',
    value: function layout() {
      //might be triggered after split pane resize or tab switch
      //codemirror instances need to be updated
      for (var key in this.codeElements) {
        this.codeElements[key].layout();
      }
    }
  }, {
    key: 'createConsoleElement',
    value: function createConsoleElement(consoleEl) {
      var consoleElement = new _ConsoleElement2.default(consoleEl);
      this.consoleElements[consoleElement.id] = consoleElement;
    }
  }, {
    key: 'destroyConsoleElement',
    value: function destroyConsoleElement(consoleElement) {
      consoleElement.destroy();
    }
  }, {
    key: 'createTerminalElement',
    value: function createTerminalElement(terminalEl) {
      var terminalElement = new _TerminalElement2.default(terminalEl);
      this.terminalElements[terminalElement.id] = terminalElement;
    }
  }, {
    key: 'destroyTerminalElement',
    value: function destroyTerminalElement(terminalElement) {
      terminalElement.destroy();
    }
  }, {
    key: 'createWebPreviewElement',
    value: function createWebPreviewElement(webPreviewEl) {
      var webPreviewElement = new _WebPreviewElement2.default(webPreviewEl);
      webPreviewElement.$wrapperEl.on('console.log', this.webPreviewConsoleLogHandler.bind(this, webPreviewElement));
      webPreviewElement.$wrapperEl.on('console.error', this.webPreviewConsoleErrorHandler.bind(this, webPreviewElement));
      this.webPreviewElements[webPreviewElement.id] = webPreviewElement;
    }
  }, {
    key: 'destroyWebPreviewElement',
    value: function destroyWebPreviewElement(webPreviewElement) {
      webPreviewElement.$wrapperEl.off('console.log');
      webPreviewElement.$wrapperEl.off('console.error');
      webPreviewElement.destroy();
    }
  }, {
    key: 'createCodeElement',
    value: function createCodeElement(codeEl) {
      var codeElement = new _CodeElement2.default(codeEl);
      this.codeElements[codeElement.id] = codeElement;
    }
  }, {
    key: 'destroyCodeElement',
    value: function destroyCodeElement(codeElement) {
      codeElement.destroy();
    }
  }, {
    key: 'createWebcamElement',
    value: function createWebcamElement(webcamEl) {
      var webcamElement = new _WebcamElement2.default(webcamEl);
      this.webcamElements[webcamElement.id] = webcamElement;
    }
  }, {
    key: 'destroyWebcamElement',
    value: function destroyWebcamElement(webcamElement) {
      webcamElement.destroy();
    }
  }, {
    key: 'createRunButton',
    value: function createRunButton(runButtonEl) {
      var _this3 = this;

      this.runButtonEls.push(runButtonEl);
      $(runButtonEl).on('click', function () {
        if (_this3.webPreviewElements[$(runButtonEl).data('target')]) {
          //save the files first
          _this3.saveCodeElementsToFiles().catch(function (err) {
            return console.log(err);
          }).then(function () {
            //update the web preview
            _this3.updateWebPreviewElement(_this3.webPreviewElements[$(runButtonEl).data('target')]);
          });
        } else if (_this3.consoleElements[$(runButtonEl).data('target')]) {
          var applicationPath = _this3.getFilePath(_this3.consoleElements[$(runButtonEl).data('target')].file);
          _this3.consoleElements[$(runButtonEl).data('target')].runNodeApp(applicationPath);
        }
      });
    }
  }, {
    key: 'destroyRunButton',
    value: function destroyRunButton(runButtonEl) {
      $(runButtonEl).off('click');
    }
  }, {
    key: 'createSaveButton',
    value: function createSaveButton(saveButtonEl) {
      var _this4 = this;

      this.saveButtonEls.push(saveButtonEl);
      $(saveButtonEl).on('click', function () {
        //get the target element for this button
        var targetString = $(saveButtonEl).data('target');
        if (targetString === 'all') {
          return _this4.saveCodeElementsToFiles();
        }
        var codeElement = _this4.getCodeElement(targetString);
        if (!codeElement) {
          return;
        }
        var filePath = _this4.getFilePathForCodeElement(codeElement);
        if (!filePath) {
          return;
        }
        codeElement.saveToFile(filePath).catch(function (err) {
          console.log(err);
        });
      });
    }
  }, {
    key: 'destroySaveButton',
    value: function destroySaveButton(saveButtonEl) {
      $(saveButtonEl).off('click');
    }
  }, {
    key: 'createReloadButton',
    value: function createReloadButton(reloadButtonEl) {
      var _this5 = this;

      this.reloadButtonEls.push(reloadButtonEl);
      $(reloadButtonEl).on('click', function () {
        //get the reload button target
        var reloadTargetElement = _this5.getCodeElement($(reloadButtonEl).data('target'));
        if (reloadTargetElement) {
          _this5.reloadCodeElement(reloadTargetElement);
          return;
        }
        reloadTargetElement = _this5.getWebPreviewElement($(reloadButtonEl).data('target'));
        if (reloadTargetElement) {
          _this5.reloadWebPreviewElement(reloadTargetElement);
          return;
        }
      });
    }
  }, {
    key: 'reloadCodeElement',
    value: function reloadCodeElement(codeElement) {
      var filePath = self.getFilePathForCodeElement(codeElement);
      if (!filePath) {
        return;
      }
      codeElement.readFromFile(filePath).catch(function (err) {
        return console.log(err);
      });
    }
  }, {
    key: 'reloadWebPreviewElement',
    value: function reloadWebPreviewElement(webPreviewElement) {
      this.updateWebPreviewElement(webPreviewElement);
    }
  }, {
    key: 'destroyReloadButton',
    value: function destroyReloadButton(reloadButtonEl) {
      $(reloadButtonEl).off('click');
    }
  }, {
    key: 'webPreviewConsoleLogHandler',
    value: function webPreviewConsoleLogHandler(webPreviewElement, event, message) {
      //get the console element for this web preview
      var consoleElement = this.getConsoleElementForWebPreview(webPreviewElement);
      if (consoleElement) {
        consoleElement.info(JSON.parse(message).args);
      }
    }
  }, {
    key: 'webPreviewConsoleErrorHandler',
    value: function webPreviewConsoleErrorHandler(webPreviewElement, event, message) {
      //get the console element for this web preview
      var consoleElement = this.getConsoleElementForWebPreview(webPreviewElement);
      if (consoleElement) {
        consoleElement.error(JSON.parse(message).args);
      }
    }
  }, {
    key: 'getConsoleElementForWebPreview',
    value: function getConsoleElementForWebPreview(webPreviewElement) {
      return this.consoleElements[webPreviewElement.console];
    }
  }, {
    key: 'getWebPreviewElementForCodeElement',
    value: function getWebPreviewElementForCodeElement(codeElement) {
      return this.webPreviewElements[codeElement.processor];
    }
  }, {
    key: 'updateWebPreviewElement',
    value: function updateWebPreviewElement(webPreviewElement) {
      //load a file or code blocks?
      if (webPreviewElement.file) {
        if (this.outputPath && webPreviewElement.needsOutputPathPrefix) {
          return webPreviewElement.updateUrl(path.join(this.outputPath, webPreviewElement.file));
        }
        return webPreviewElement.updateUrl(webPreviewElement.file);
      }

      //gather all the code for this element
      var blocks = [];
      for (var key in this.codeElements) {
        var codeElement = this.codeElements[key];
        if (codeElement.processor === webPreviewElement.id) {
          var block = {
            language: codeElement.language,
            code: codeElement.getValue()
          };
          blocks.push(block);
        }
      }
      webPreviewElement.updateCode(blocks);
    }
  }]);

  return LiveCode;
}();

exports.default = LiveCode;

},{"./CodeElement":20,"./ConsoleElement":21,"./TerminalElement":22,"./WebPreviewElement":23,"./WebcamElement":24}],26:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"../../HeartRateCanvas":7,"./SparkHeartRatesPlugin":27,"./states/Play":31,"./states/Preload":32,"dup":13}],27:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dgram":1,"dup":14}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Beam = function (_Phaser$Group) {
  _inherits(Beam, _Phaser$Group);

  function Beam(game, x, y, maxWidth) {
    _classCallCheck(this, Beam);

    var _this = _possibleConstructorReturn(this, (Beam.__proto__ || Object.getPrototypeOf(Beam)).call(this, game));

    _this.x = x;
    _this.y = y;

    _this.data = {
      maxWidth: maxWidth,
      position: 0.5
    };
    _this.beamEndLeft = _this._createBeamEnd();
    _this.beamEndLeft.scale.setTo(-1, 1);
    _this.beamLeft = _this._createBeam();
    _this.beamLeft.anchor.setTo(1, 0.5);

    _this.beamEndRight = _this._createBeamEnd();
    _this.beamRight = _this._createBeam();
    _this.beamRight.anchor.setTo(0, 0.5);
    return _this;
  }

  _createClass(Beam, [{
    key: "_createBeamEnd",
    value: function _createBeamEnd() {
      var beamEnd = this.add(new Phaser.Sprite(this.game, 0, 0, "dragonball-graphics", "beaming1.png"));
      beamEnd.anchor.setTo(0.5, 0.5);
      beamEnd.animations.add("beaming", ["beaming1.png", "beaming2.png"], 8, true, true);
      beamEnd.animations.play("beaming");
      return beamEnd;
    }
  }, {
    key: "_createBeam",
    value: function _createBeam() {
      var beam = this.add(new Phaser.TileSprite(this.game, 0, 0, 32, 32, "dragonball-graphics", "beam.png"));
      return beam;
    }
  }, {
    key: "update",
    value: function update() {
      var beamCenter = this.data.maxWidth * this.data.position;
      this.beamEndLeft.x = beamCenter - 20;
      this.beamEndRight.x = beamCenter + 20;
      this.beamLeft.x = this.beamEndLeft.x + 10;
      this.beamRight.x = this.beamEndRight.x - 10;
      this.beamLeft.width = beamCenter;
      this.beamRight.width = this.data.maxWidth - beamCenter;
    }
  }, {
    key: "beamPosition",
    set: function set(value) {
      this.data.position = value;
    },
    get: function get() {
      return this.data.position;
    }
  }]);

  return Beam;
}(Phaser.Group);

exports.default = Beam;

},{}],29:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GameCharacter = function (_Phaser$Sprite) {
  _inherits(GameCharacter, _Phaser$Sprite);

  function GameCharacter(game, x, y, character) {
    _classCallCheck(this, GameCharacter);

    var _this = _possibleConstructorReturn(this, (GameCharacter.__proto__ || Object.getPrototypeOf(GameCharacter)).call(this, game, x, y, "dragonball-graphics", character + "-standing1.png"));

    _this.anchor.setTo(0.5, 1);
    if (character === "gohan") {
      _this.scale.setTo(-1, 1);
    }
    _this.animations.add("stand", [character + "-standing1.png", character + "-standing2.png"], 4, true, true);
    _this.animations.add("fall", [character + "-falling1.png", character + "-falling2.png", character + "-falling3.png", character + "-falling4.png", character + "-falling5.png", character + "-falling6.png", character + "-falling7.png"], 10, false, true);
    _this.animations.add("kameha", [character + "-kameha1.png"], 10, true, true);

    _this.stand();
    return _this;
  }

  _createClass(GameCharacter, [{
    key: "stand",
    value: function stand() {
      this.animations.play("stand");
    }
  }, {
    key: "fall",
    value: function fall() {
      this.animations.play("fall");
    }
  }, {
    key: "kameha",
    value: function kameha() {
      this.animations.play("kameha");
    }
  }]);

  return GameCharacter;
}(Phaser.Sprite);

exports.default = GameCharacter;

},{}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Button = require('../objects/Button');

var _Button2 = _interopRequireDefault(_Button);

var _GameCharacter = require('../objects/GameCharacter');

var _GameCharacter2 = _interopRequireDefault(_GameCharacter);

var _Beam = require('../objects/Beam');

var _Beam2 = _interopRequireDefault(_Beam);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SUBSTATE_INTRO = 'intro';
var SUBSTATE_PLAY = 'play';
var SUBSTATE_FALLING = 'falling';
var SUBSTATE_FINISHED = 'finished';

var BEAM_OFFSET = 143;
var MAX_HEARTRATE = 100;

var Play = function (_Phaser$State) {
  _inherits(Play, _Phaser$State);

  function Play() {
    _classCallCheck(this, Play);

    return _possibleConstructorReturn(this, (Play.__proto__ || Object.getPrototypeOf(Play)).apply(this, arguments));
  }

  _createClass(Play, [{
    key: 'init',
    value: function init() {
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }, {
    key: 'create',
    value: function create() {
      this.createEnvironment();
      this.createPlayers();
      this.createButtons();
      this.createBeam();

      this.setSubState(SUBSTATE_INTRO);
    }
  }, {
    key: 'createEnvironment',
    value: function createEnvironment() {
      this.background = this.add.sprite(this.world.centerX, this.world.height - 112, 'dragonball-graphics', 'background.png');
      this.background.anchor.setTo(0.5, 1);

      this.ground = this.add.sprite(this.world.centerX, this.world.height, 'dragonball-graphics', 'floor.png');
      this.ground.anchor.setTo(0.5, 1);
    }
  }, {
    key: 'createPlayers',
    value: function createPlayers() {
      this.goku = this.add.existing(new _GameCharacter2.default(this.game, 80, this.world.height, 'goku'));
      this.gohan = this.add.existing(new _GameCharacter2.default(this.game, this.world.width - 80, this.world.height, 'gohan'));
    }
  }, {
    key: 'createBeam',
    value: function createBeam() {
      this.beam = this.add.existing(new _Beam2.default(this.game, BEAM_OFFSET, this.world.centerY + 210, this.world.width - BEAM_OFFSET * 2));
    }
  }, {
    key: 'createButtons',
    value: function createButtons() {
      this.playButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.playClicked, this, 'blue', 'Play');
      this.playButton.anchor.setTo(0.5, 0.5);
      this.add.existing(this.playButton);

      this.stopButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.stopClicked, this, 'blue', 'Stop');
      this.stopButton.anchor.setTo(0.5, 0.5);
      this.add.existing(this.stopButton);
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.subState === SUBSTATE_PLAY) {
        this.updatePlayState();
      } else if (this.subState === SUBSTATE_FINISHED) {
        this.updateFinishedState();
      }
    }
  }, {
    key: 'updatePlayState',
    value: function updatePlayState() {
      var _this2 = this;

      //update beamPosition according to heart rates
      if (this.game.sparkHeartRatesPlugin.player1.heartRate > 0 && this.game.sparkHeartRatesPlugin.player2.heartRate > 0) {
        var heartRateDiff = Math.min(MAX_HEARTRATE, this.game.sparkHeartRatesPlugin.player2.heartRate) - Math.min(MAX_HEARTRATE, this.game.sparkHeartRatesPlugin.player1.heartRate);
        this.beam.beamPosition = this.beam.beamPosition + heartRateDiff * 0.0002;
      }
      var position = this.beam.beamPosition;
      if (position < 0.01) {
        this.winner = this.gohan;
        this.loser = this.goku;
        this.add.tween(this.beam).to({ x: -this.world.width }, 350, Phaser.Easing.Linear.NONE, true);
      } else if (position > 0.99) {
        this.winner = this.goku;
        this.loser = this.gohan;
        this.add.tween(this.beam).to({ x: this.world.width }, 350, Phaser.Easing.Linear.NONE, true);
      }
      if (this.winner) {
        this.winner.stand();
        this.loser.fall();
        this.setSubState(SUBSTATE_FALLING);
        this.time.events.add(500, function () {
          _this2.setSubState(SUBSTATE_FINISHED);
        });
      }
    }
  }, {
    key: 'updateFinishedState',
    value: function updateFinishedState() {}
  }, {
    key: 'setSubState',
    value: function setSubState(value) {
      this.subState = value;
      this.playButton.visible = false;
      this.stopButton.visible = false;
      this.beam.visible = false;
      this.beam.x = BEAM_OFFSET;
      if (this.subState === SUBSTATE_PLAY) {
        this.stopButton.visible = true;
        this.beam.visible = true;
        this.winner = false;
        this.loser = false;
        this.beam.beamPosition = 0.5;
        this.goku.kameha();
        this.gohan.kameha();
      } else if (this.subState === SUBSTATE_FALLING) {
        this.beam.visible = true;
        this.playButton.visible = true;
      } else if (this.subState === SUBSTATE_FINISHED) {
        this.playButton.visible = true;
      } else {
        this.playButton.visible = true;
        this.winner = false;
        this.loser = false;
        this.goku.stand();
        this.gohan.stand();
      }
    }
  }, {
    key: 'playClicked',
    value: function playClicked() {
      this.setSubState(SUBSTATE_PLAY);
    }
  }, {
    key: 'stopClicked',
    value: function stopClicked() {
      this.state.start('Play');
    }
  }]);

  return Play;
}(Phaser.State);

exports.default = Play;

},{"../objects/Beam":28,"../objects/Button":29,"../objects/GameCharacter":30}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preload = function (_Phaser$State) {
  _inherits(Preload, _Phaser$State);

  function Preload() {
    _classCallCheck(this, Preload);

    return _possibleConstructorReturn(this, (Preload.__proto__ || Object.getPrototypeOf(Preload)).apply(this, arguments));
  }

  _createClass(Preload, [{
    key: "init",
    value: function init() {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.stage.backgroundColor = "#d87040";
    }
  }, {
    key: "preload",
    value: function preload() {
      this.load.atlasJSONHash("components", "assets/dragonball/components.png", "assets/dragonball/components.json");
      this.load.atlasJSONHash("dragonball-graphics", "assets/dragonball/dragonball-graphics.png", "assets/dragonball/dragonball-graphics.json");
    }
  }, {
    key: "create",
    value: function create() {
      this.state.start("Play");
    }
  }]);

  return Preload;
}(Phaser.State);

exports.default = Preload;

},{}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var POLARH7_HRM_HEART_RATE_SERVICE_UUID = '180d';
var POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID = '2a37';
var serviceUUIDs = [POLARH7_HRM_HEART_RATE_SERVICE_UUID];

var PolarH7 = function (_events$EventEmitter) {
  _inherits(PolarH7, _events$EventEmitter);

  function PolarH7() {
    _classCallCheck(this, PolarH7);

    var _this = _possibleConstructorReturn(this, (PolarH7.__proto__ || Object.getPrototypeOf(PolarH7)).call(this));

    _this.polarH7Peripheral = false;
    _this._stateChangeHandler = function (state) {
      return _this.stateChangeHandler(state);
    };
    _this._discoverHandler = function (peripheral) {
      return _this.discoverHandler(peripheral);
    };

    _this.noble = requireNode('noble');
    _this.noble.on('stateChange', _this._stateChangeHandler);
    _this.noble.on('discover', _this._discoverHandler);
    return _this;
  }

  _createClass(PolarH7, [{
    key: 'stateChangeHandler',
    value: function stateChangeHandler(state) {
      console.log('[PolarH7] stateChange', state);
      this.emit('stateChange', state);
      if (state === 'poweredOn') {
        this.noble.startScanning(serviceUUIDs);
      } else {
        this.noble.stopScanning();
      }
    }
  }, {
    key: 'discoverHandler',
    value: function discoverHandler(peripheral) {
      var foundSuitablePeripheral = false;
      for (var i = peripheral.advertisement.serviceUuids.length - 1; i >= 0; i--) {
        if (peripheral.advertisement.serviceUuids[i] === POLARH7_HRM_HEART_RATE_SERVICE_UUID) {
          foundSuitablePeripheral = true;
          break;
        }
      }
      if (foundSuitablePeripheral) {
        this.onFoundSuitablePeripheral(peripheral);
      } else {
        console.log('[PolarH7] no suitable peripheral');
      }
    }
  }, {
    key: 'onFoundSuitablePeripheral',
    value: function onFoundSuitablePeripheral(peripheral) {
      var _this2 = this;

      console.log('[PolarH7]', peripheral.advertisement.localName);
      this.noble.stopScanning();
      this.polarH7Peripheral = peripheral;
      this.polarH7Peripheral.connect(function (error) {
        return _this2.onConnect(error);
      });
    }
  }, {
    key: 'onConnect',
    value: function onConnect(error) {
      var _this3 = this;

      if (error) {
        console.error(error);
        return;
      }
      console.log('[PolarH7] on connect');
      this.emit('connect');
      this.polarH7Peripheral.discoverServices([], function (error, services) {
        return _this3.onPeripheralDiscoverServices(error, services);
      });
    }
  }, {
    key: 'onPeripheralDiscoverServices',
    value: function onPeripheralDiscoverServices(error, services) {
      var _this4 = this;

      console.log('[PolarH7] onPeripheralDiscoverServices');
      for (var i = services.length - 1; i >= 0; i--) {
        if (services[i].name) {
          console.log(services[i].uuid, services[i].name);
          services[i].discoverCharacteristics([], function (error, characteristics) {
            return _this4.onPeripheralServiceDiscoverCharacteristics(error, characteristics);
          });
        }
      }
    }
  }, {
    key: 'onPeripheralServiceDiscoverCharacteristics',
    value: function onPeripheralServiceDiscoverCharacteristics(error, characteristics) {
      var _this5 = this;

      for (var i = characteristics.length - 1; i >= 0; i--) {
        var characteristic = characteristics[i];
        if (characteristic.uuid === POLARH7_HRM_MEASUREMENT_CHARACTERISTIC_UUID) {
          //console.log("HRM Characteristic");
          characteristic.on('read', function (data, isNotification) {
            return _this5.onHeartRateRead(data, isNotification);
          });
          characteristic.notify(true, function (error) {
            return error ? console.log(error) : true;
          });
        }
      }
    }
  }, {
    key: 'onHeartRateRead',
    value: function onHeartRateRead(data, isNotification) {
      // eslint-disable-line no-unused-vars
      if ((data[0] & 0x01) === 0) {
        var heartRate = data[1];
        if (heartRate) {
          this.emit(PolarH7.HEART_RATE, heartRate);
          // var filePath = Config.heartRateFilePath;
          // fs.appendFile(filePath, new Date().getTime() + ":" + heartRate + "\n", function (err) {
          // 	console.log(err);
          // });
        }
      }
    }
  }]);

  return PolarH7;
}(_events2.default.EventEmitter);

exports.default = PolarH7;


PolarH7.HEART_RATE = 'heartRate';

},{"events":3}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Preload = require('./states/Preload');

var _Preload2 = _interopRequireDefault(_Preload);

var _Menu = require('./states/Menu');

var _Menu2 = _interopRequireDefault(_Menu);

var _Play = require('./states/Play');

var _Play2 = _interopRequireDefault(_Play);

var _Finished = require('./states/Finished');

var _Finished2 = _interopRequireDefault(_Finished);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Game = function (_Phaser$Game) {
  _inherits(Game, _Phaser$Game);

  function Game(width, height, renderMode, container) {
    _classCallCheck(this, Game);

    var _this = _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this, width, height, renderMode, container));

    _this.state.add('Preload', _Preload2.default);
    _this.state.add('Menu', _Menu2.default);
    _this.state.add('Play', _Play2.default);
    _this.state.add('Finished', _Finished2.default);
    _this.state.start('Preload');
    return _this;
  }

  return Game;
}(Phaser.Game);

exports.default = Game;

},{"./states/Finished":39,"./states/Menu":40,"./states/Play":41,"./states/Preload":42}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SpacebrewPlugin = function (_Phaser$Plugin) {
  _inherits(SpacebrewPlugin, _Phaser$Plugin);

  function SpacebrewPlugin(game, parent) {
    _classCallCheck(this, SpacebrewPlugin);

    return _possibleConstructorReturn(this, (SpacebrewPlugin.__proto__ || Object.getPrototypeOf(SpacebrewPlugin)).call(this, game, parent));
  }

  _createClass(SpacebrewPlugin, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      console.log("Spacebrew Plugin init");
      this.noteNames = ["blue-left", "blue-up", "blue-down", "orange-down", "orange-up", "orange-right"];
      this.buttons = {};
      //spacebrew connection
      this.sb = new Spacebrew.Client("localhost", "DDR Presentation");
      this.sb.onStringMessage = function (name, isDown) {
        return _this2.handleButton(name, isDown === "true");
      };
      this.noteNames.forEach(function (noteName) {
        _this2.buttons[noteName] = { isDown: false };
        _this2.sb.addSubscribe(noteName, "string");
      });
      this.sb.connect();
    }
  }, {
    key: "handleButton",
    value: function handleButton(name, isDown) {
      this.buttons[name].isDown = isDown;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.sb) {
        this.sb.close();
      }
      _get(SpacebrewPlugin.prototype.__proto__ || Object.getPrototypeOf(SpacebrewPlugin.prototype), "destroy", this).call(this);
    }
  }]);

  return SpacebrewPlugin;
}(Phaser.Plugin);

exports.default = SpacebrewPlugin;

},{}],36:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DanceButtonOutline = function (_Phaser$Sprite) {
  _inherits(DanceButtonOutline, _Phaser$Sprite);

  function DanceButtonOutline(game, x, y) {
    var color = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "blue";
    var orientation = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "left";

    _classCallCheck(this, DanceButtonOutline);

    var _this = _possibleConstructorReturn(this, (DanceButtonOutline.__proto__ || Object.getPrototypeOf(DanceButtonOutline)).call(this, game, x, y, "ddr-graphics", "white-outline"));

    _this.data.color = color;
    _this.data.orientation = orientation;
    _this.anchor.setTo(0.5, 0.5);
    _this.scale.setTo(0.3, 0.3);
    switch (orientation) {
      case "up":
        _this.angle = 180;
        break;
      case "down":
        _this.angle = 0;
        break;
      case "right":
        _this.angle = 270;
        break;
      default:
        _this.angle = 90;
        break;
    }
    return _this;
  }

  _createClass(DanceButtonOutline, [{
    key: "pressed",
    set: function set(value) {
      if (value) {
        this.frameName = this.data.color + "-outline";
      } else {
        this.frameName = "white-outline";
      }
    },
    get: function get() {
      return this.frameName !== "white-outline";
    }
  }]);

  return DanceButtonOutline;
}(Phaser.Sprite);

exports.default = DanceButtonOutline;

},{}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ScoreBar = function (_Phaser$Group) {
  _inherits(ScoreBar, _Phaser$Group);

  function ScoreBar(game, x, y) {
    _classCallCheck(this, ScoreBar);

    var _this = _possibleConstructorReturn(this, (ScoreBar.__proto__ || Object.getPrototypeOf(ScoreBar)).call(this, game));

    _this.data = {
      score: 0.5
    };

    _this.scoreFill = new Phaser.Sprite(game, 0, 0, "ddr-graphics", "scorebar");
    _this.add(_this.scoreFill);

    var outline = new Phaser.Sprite(game, 0, 0, "ddr-graphics", "scorebar-outline");
    _this.add(outline);

    //mask
    _this.scoreFillMask = new Phaser.Graphics(game, 0, 0);
    _this.scoreFillMask.beginFill(0xffffff);
    _this.scoreFillMask.drawRect(0, 0, _this.scoreFill.width * _this.data.score, _this.scoreFill.height);
    _this.add(_this.scoreFillMask);

    _this.scoreFill.mask = _this.scoreFillMask;

    _this.x = x - outline.width / 2;
    _this.y = y - outline.height / 2;
    return _this;
  }

  _createClass(ScoreBar, [{
    key: "update",
    value: function update() {
      var targetFillWidth = this.scoreFill.width * this.data.score;
      var currentFillWidth = this.scoreFillMask.width;
      currentFillWidth += (targetFillWidth - currentFillWidth) * 0.1;
      this.scoreFillMask.clear();
      this.scoreFillMask.beginFill(0xffffff);
      this.scoreFillMask.drawRect(0, 0, currentFillWidth, this.scoreFill.height);
    }
  }, {
    key: "score",
    set: function set(value) {
      value = Math.min(1, Math.max(0, value));
      this.data.score = value;
    },
    get: function get() {
      return this.data.score;
    }
  }]);

  return ScoreBar;
}(Phaser.Group);

exports.default = ScoreBar;

},{}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Finished = function (_Phaser$State) {
  _inherits(Finished, _Phaser$State);

  function Finished() {
    _classCallCheck(this, Finished);

    return _possibleConstructorReturn(this, (Finished.__proto__ || Object.getPrototypeOf(Finished)).apply(this, arguments));
  }

  _createClass(Finished, [{
    key: "create",
    value: function create() {}
  }]);

  return Finished;
}(Phaser.State);

exports.default = Finished;

},{}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Button = require('../objects/Button');

var _Button2 = _interopRequireDefault(_Button);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Menu = function (_Phaser$State) {
  _inherits(Menu, _Phaser$State);

  function Menu() {
    _classCallCheck(this, Menu);

    return _possibleConstructorReturn(this, (Menu.__proto__ || Object.getPrototypeOf(Menu)).apply(this, arguments));
  }

  _createClass(Menu, [{
    key: 'init',
    value: function init() {
      if (!this.game.backgroundVideo) {
        this.game.backgroundVideo = this.add.video('background-video');
        this.game.backgroundVideo.play(true);
      }
      this.game.backgroundVideo.addToWorld();
    }
  }, {
    key: 'create',
    value: function create() {
      var playButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.playClicked, this, 'blue', 'Play');
      playButton.anchor.setTo(0.5, 0.5);
      this.add.existing(playButton);
    }
  }, {
    key: 'playClicked',
    value: function playClicked() {
      this.state.start('Play');
    }
  }]);

  return Menu;
}(Phaser.State);

exports.default = Menu;

},{"../objects/Button":36}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Button = require('../objects/Button');

var _Button2 = _interopRequireDefault(_Button);

var _DanceButtonOutline = require('../objects/DanceButtonOutline');

var _DanceButtonOutline2 = _interopRequireDefault(_DanceButtonOutline);

var _ScoreBar = require('../objects/ScoreBar');

var _ScoreBar2 = _interopRequireDefault(_ScoreBar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OVERLAP_SIZE = 20;
var DANCETAG_STATUS_NORMAL = 0;
var DANCETAG_STATUS_CORRECT = 1;
var DANCETAG_STATUS_WRONG = 2;

var Play = function (_Phaser$State) {
  _inherits(Play, _Phaser$State);

  function Play() {
    _classCallCheck(this, Play);

    return _possibleConstructorReturn(this, (Play.__proto__ || Object.getPrototypeOf(Play)).apply(this, arguments));
  }

  _createClass(Play, [{
    key: 'init',
    value: function init() {
      if (!this.game.backgroundVideo) {
        this.game.backgroundVideo = this.add.video('background-video');
        this.game.backgroundVideo.play(true);
      }
      this.game.backgroundVideo.addToWorld();

      this.notesByTime = { 12: [{ name: 'blue-up' }], 28: [{ name: 'blue-up' }], 29: [{ name: 'blue-up' }], 30: [{ name: 'blue-up' }], 39: [{ name: 'orange-down' }], 48: [{ name: 'orange-up' }], 57: [{ name: 'orange-down' }], 58: [{ name: 'blue-down' }], 66: [{ name: 'blue-down' }], 67: [{ name: 'blue-left' }, { name: 'orange-right' }], 74: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 76: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 77: [{ name: 'orange-up' }, { name: 'orange-right' }], 9.8: [{ name: 'blue-up' }], 10.8: [{ name: 'blue-down' }], 12.8: [{ name: 'blue-down' }], 14.2: [{ name: 'blue-up' }], 15.1: [{ name: 'blue-down' }], 16.2: [{ name: 'blue-left' }], 18.4: [{ name: 'orange-up' }], 19.4: [{ name: 'orange-down' }], 20.5: [{ name: 'orange-up' }], 21.6: [{ name: 'orange-down' }], 22.6: [{ name: 'orange-up' }], 23.7: [{ name: 'orange-down' }], 24.7: [{ name: 'orange-right' }], 26.8: [{ name: 'blue-up' }], 27.4: [{ name: 'blue-down' }], 28.5: [{ name: 'blue-down' }], 29.5: [{ name: 'blue-down' }], 30.5: [{ name: 'blue-down' }], 31.1: [{ name: 'blue-up' }], 31.6: [{ name: 'blue-down' }], 32.1: [{ name: 'blue-up' }], 32.6: [{ name: 'blue-down' }], 33.2: [{ name: 'blue-left' }], 35.3: [{ name: 'orange-up' }], 35.8: [{ name: 'orange-down' }], 36.4: [{ name: 'orange-up' }], 36.9: [{ name: 'orange-down' }], 37.4: [{ name: 'orange-up' }], 37.9: [{ name: 'orange-down' }], 38.4: [{ name: 'orange-up' }], 39.6: [{ name: 'blue-up' }], 40.1: [{ name: 'blue-down' }], 40.6: [{ name: 'blue-up' }], 41.1: [{ name: 'blue-down' }], 41.6: [{ name: 'blue-up' }], 42.1: [{ name: 'blue-down' }], 42.7: [{ name: 'blue-up' }], 43.2: [{ name: 'blue-down' }], 43.8: [{ name: 'orange-up' }], 44.3: [{ name: 'orange-down' }], 44.8: [{ name: 'blue-up' }], 45.4: [{ name: 'blue-down' }], 45.9: [{ name: 'orange-up' }], 46.4: [{ name: 'orange-down' }], 46.9: [{ name: 'blue-up' }], 47.5: [{ name: 'blue-down' }], 48.6: [{ name: 'orange-down' }], 49.1: [{ name: 'blue-up' }], 49.6: [{ name: 'blue-down' }], 50.1: [{ name: 'orange-right' }], 50.6: [{ name: 'blue-left' }], 52.2: [{ name: 'orange-right' }], 52.7: [{ name: 'blue-left' }], 53.3: [{ name: 'orange-right' }], 53.8: [{ name: 'blue-left' }], 54.3: [{ name: 'orange-right' }], 54.9: [{ name: 'blue-left' }], 55.4: [{ name: 'orange-right' }], 55.9: [{ name: 'blue-left' }], 56.5: [{ name: 'orange-up' }], 57.5: [{ name: 'blue-up' }], 58.6: [{ name: 'orange-up' }], 59.1: [{ name: 'orange-down' }], 59.6: [{ name: 'blue-up' }], 60.1: [{ name: 'blue-down' }], 60.7: [{ name: 'orange-right' }], 61.2: [{ name: 'blue-left' }], 61.8: [{ name: 'orange-up' }], 62.3: [{ name: 'blue-up' }], 62.8: [{ name: 'orange-down' }], 63.3: [{ name: 'blue-down' }], 63.8: [{ name: 'orange-right' }], 64.3: [{ name: 'blue-left' }], 64.9: [{ name: 'orange-up' }], 65.4: [{ name: 'blue-up' }], 65.9: [{ name: 'orange-down' }], 66.5: [{ name: 'blue-down' }, { name: 'orange-down' }], 67.5: [{ name: 'blue-left' }, { name: 'orange-right' }], 68.1: [{ name: 'orange-up' }, { name: 'blue-up' }], 68.5: [{ name: 'blue-up' }], 68.6: [{ name: 'orange-up' }], 69.2: [{ name: 'blue-down' }], 69.3: [{ name: 'orange-up' }, { name: 'blue-up' }], 69.8: [{ name: 'blue-down' }, { name: 'blue-up' }], 70.3: [{ name: 'orange-up' }, { name: 'blue-up' }], 70.8: [{ name: 'blue-down' }, { name: 'blue-up' }], 71.4: [{ name: 'blue-down' }], 71.9: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-down' }], 72.4: [{ name: 'blue-left' }, { name: 'blue-down' }], 72.9: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 73.5: [{ name: 'blue-up' }], 74.5: [{ name: 'blue-up' }], 74.9: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 75.2: [{ name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 75.5: [{ name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 75.7: [{ name: 'orange-up' }], 76.2: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 76.5: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 76.7: [{ name: 'orange-up' }, { name: 'orange-right' }], 77.3: [{ name: 'blue-left' }, { name: 'orange-up' }, { name: 'blue-up' }, { name: 'orange-right' }], 77.6: [{ name: 'orange-up' }, { name: 'orange-right' }] };
      this.danceKeyboardKeys = this.input.keyboard.addKeys({
        blueLeft: Phaser.KeyCode.Q,
        blueUp: Phaser.KeyCode.Z,
        blueDown: Phaser.KeyCode.S,
        orangeDown: Phaser.KeyCode.DOWN,
        orangeUp: Phaser.KeyCode.UP,
        orangeRight: Phaser.KeyCode.RIGHT
      });
    }
  }, {
    key: 'create',
    value: function create() {
      this.score = 0.5;

      this.createOutlines();
      this.createDanceTags();
      this.createScoreBar();

      var stopButton = new _Button2.default(this.game, this.world.centerX, this.world.centerY, this.stopClicked, this, 'blue', 'Stop');
      stopButton.anchor.setTo(0.5, 0.5);
      this.add.existing(stopButton);

      this.music = this.add.audio('music');
      this.game.sound.setDecodedCallback([this.music], this.musicDecoded, this);
    }
  }, {
    key: 'musicDecoded',
    value: function musicDecoded() {
      this.createTimers();
      this.music.play();
    }
  }, {
    key: 'createOutlines',
    value: function createOutlines() {
      this.outlinesLeft = this.add.group();
      this.outlinesLeft.enableBody = true;
      this.blueLeftButton = this.outlinesLeft.add(new _DanceButtonOutline2.default(this.game, 0, 0, 'blue', 'left'));
      this.blueUpButton = this.outlinesLeft.add(new _DanceButtonOutline2.default(this.game, 1 * (this.blueLeftButton.width + 10), 0, 'blue', 'up'));
      this.blueDownButton = this.outlinesLeft.add(new _DanceButtonOutline2.default(this.game, 2 * (this.blueLeftButton.width + 10), 0, 'blue', 'down'));
      this.outlinesLeft.setAll('body.immovable', true);
      this.outlinesLeft.setAll('body.width', OVERLAP_SIZE);
      this.outlinesLeft.setAll('body.height', OVERLAP_SIZE);
      this.outlinesLeft.setAll('body.offset.x', (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
      this.outlinesLeft.setAll('body.offset.y', (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
      this.outlinesLeft.x = 100;
      this.outlinesLeft.y = this.world.centerY;

      this.outlinesRight = this.add.group();
      this.outlinesRight.enableBody = true;
      this.orangeDownButton = this.outlinesRight.add(new _DanceButtonOutline2.default(this.game, 0 * (this.blueLeftButton.width + 10), 0, 'orange', 'down'));
      this.orangeUpButton = this.outlinesRight.add(new _DanceButtonOutline2.default(this.game, 1 * (this.blueLeftButton.width + 10), 0, 'orange', 'up'));
      this.orangeRightButton = this.outlinesRight.add(new _DanceButtonOutline2.default(this.game, 2 * (this.blueLeftButton.width + 10), 0, 'orange', 'right'));
      this.outlinesRight.setAll('body.immovable', true);
      this.outlinesRight.setAll('body.width', OVERLAP_SIZE);
      this.outlinesRight.setAll('body.height', OVERLAP_SIZE);
      this.outlinesRight.setAll('body.offset.x', (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
      this.outlinesRight.setAll('body.offset.y', (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
      this.outlinesRight.x = this.world.centerX + 200;
      this.outlinesRight.y = this.world.centerY;
    }
  }, {
    key: 'createDanceTags',
    value: function createDanceTags() {
      this.danceTags = this.add.group();
      this.danceTags.enableBody = true;
      this.danceTags.createMultiple(100, 'ddr-graphics', 'blue');
      this.danceTags.setAll('anchor.x', 0.5);
      this.danceTags.setAll('anchor.y', 0.5);
      this.danceTags.setAll('scale.x', 0.3);
      this.danceTags.setAll('scale.y', 0.3);
      this.danceTags.setAll('checkWorldBounds', true);
      this.danceTags.setAll('outOfBoundsKill', true);
      this.danceTags.setAll('body.immovable', true);
      this.danceTags.setAll('body.width', OVERLAP_SIZE);
      this.danceTags.setAll('body.height', OVERLAP_SIZE);
      this.danceTags.setAll('body.offset.x', (this.blueLeftButton.width / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
      this.danceTags.setAll('body.offset.y', (this.blueLeftButton.height / this.blueLeftButton.scale.x - OVERLAP_SIZE) * 0.5);
    }
  }, {
    key: 'createScoreBar',
    value: function createScoreBar() {
      this.scoreBar = new _ScoreBar2.default(this.game, this.world.centerX, 100);
      this.add.existing(this.scoreBar);
    }
  }, {
    key: 'createTimers',
    value: function createTimers() {
      var _this2 = this;

      var timeToReachCenter = 1000;

      var _loop = function _loop(time) {
        var delay = ~~(parseFloat(time) * Phaser.Timer.SECOND) - timeToReachCenter;
        _this2.notesByTime[time].forEach(function (note) {
          var noteSplit = note.name.split('-');
          _this2.time.events.add(delay, _this2.addDanceTag, _this2, noteSplit[0], noteSplit[1]);
        });
      };

      for (var time in this.notesByTime) {
        _loop(time);
      }
    }
  }, {
    key: 'addDanceTag',
    value: function addDanceTag(color, orientation) {
      var danceTag = this.danceTags.getFirstDead();
      var xPos = 0;
      switch (orientation) {
        case 'up':
          xPos = color === 'blue' ? this.outlinesLeft.x + this.blueUpButton.x : this.outlinesRight.x + this.orangeUpButton.x;
          danceTag.angle = 180;
          break;
        case 'down':
          xPos = color === 'blue' ? this.outlinesLeft.x + this.blueDownButton.x : this.outlinesRight.x + this.orangeDownButton.x;
          danceTag.angle = 0;
          break;
        case 'right':
          xPos = this.outlinesRight.x + this.orangeRightButton.x;
          danceTag.angle = 270;
          break;
        default:
          xPos = this.outlinesLeft.x + this.blueLeftButton.x;
          danceTag.angle = 90;
          break;
      }
      danceTag.reset(xPos, this.world.bottom);
      danceTag.body.velocity.y = -180;
      danceTag.data = {
        color: color,
        orientation: orientation,
        status: DANCETAG_STATUS_NORMAL
      };
      danceTag.frameName = color;
    }
  }, {
    key: 'setScore',
    value: function setScore(value) {
      this.score = Math.min(1, Math.max(0, value));
      if (this.scoreBar) {
        this.scoreBar.score = this.score;
      }
    }
  }, {
    key: 'increaseScore',
    value: function increaseScore() {
      this.setScore(this.score + 0.1);
    }
  }, {
    key: 'decreaseScore',
    value: function decreaseScore() {
      this.setScore(this.score - 0.1);
    }
  }, {
    key: 'update',
    value: function update() {
      var _this3 = this;

      this.physics.arcade.overlap(this.danceTags, this.outlinesLeft, this.danceTagOverlap, null, this);
      this.physics.arcade.overlap(this.danceTags, this.outlinesRight, this.danceTagOverlap, null, this);
      //this.handleKeyboardInput();
      this.handleSpacebrewInput();
      this.danceTags.forEachAlive(function (danceTag) {
        if (danceTag.y < _this3.world.centerY - OVERLAP_SIZE / 2 && danceTag.data.status === DANCETAG_STATUS_NORMAL) {
          danceTag.data.status = DANCETAG_STATUS_WRONG;
          danceTag.frameName = danceTag.data.color + '-wrong';
          _this3.decreaseScore();
        }
      });
    }
  }, {
    key: 'danceTagOverlap',
    value: function danceTagOverlap(danceTag, outline) {
      if (danceTag.data.status === DANCETAG_STATUS_NORMAL) {
        if (outline.pressed) {
          danceTag.data.status = DANCETAG_STATUS_CORRECT;
          danceTag.frameName = danceTag.data.color + '-correct';
          this.increaseScore();
        }
      }
    }
  }, {
    key: 'render',
    value: function render() {
      // this.outlinesLeft.forEach(o => this.game.debug.body(o));
      // this.outlinesRight.forEach(o => this.game.debug.body(o));
      // this.danceTags.forEach(o => this.game.debug.body(o));
    }
  }, {
    key: 'handleKeyboardInput',
    value: function handleKeyboardInput() {
      this.blueLeftButton.pressed = this.danceKeyboardKeys.blueLeft.isDown;
      this.blueUpButton.pressed = this.danceKeyboardKeys.blueUp.isDown;
      this.blueDownButton.pressed = this.danceKeyboardKeys.blueDown.isDown;
      this.orangeUpButton.pressed = this.danceKeyboardKeys.orangeUp.isDown;
      this.orangeDownButton.pressed = this.danceKeyboardKeys.orangeDown.isDown;
      this.orangeRightButton.pressed = this.danceKeyboardKeys.orangeRight.isDown;
    }
  }, {
    key: 'handleSpacebrewInput',
    value: function handleSpacebrewInput() {
      this.blueLeftButton.pressed = this.game.spacebrewPlugin.buttons['blue-left'].isDown;
      this.blueUpButton.pressed = this.game.spacebrewPlugin.buttons['blue-up'].isDown;
      this.blueDownButton.pressed = this.game.spacebrewPlugin.buttons['blue-down'].isDown;
      this.orangeUpButton.pressed = this.game.spacebrewPlugin.buttons['orange-up'].isDown;
      this.orangeDownButton.pressed = this.game.spacebrewPlugin.buttons['orange-down'].isDown;
      this.orangeRightButton.pressed = this.game.spacebrewPlugin.buttons['orange-right'].isDown;
    }
  }, {
    key: 'stopClicked',
    value: function stopClicked() {
      this.state.start('Menu');
    }
  }, {
    key: 'shutdown',
    value: function shutdown() {
      if (this.music) {
        this.music.destroy();
      }
    }
  }]);

  return Play;
}(Phaser.State);

exports.default = Play;

},{"../objects/Button":36,"../objects/DanceButtonOutline":37,"../objects/ScoreBar":38}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _SpacebrewPlugin = require('../SpacebrewPlugin');

var _SpacebrewPlugin2 = _interopRequireDefault(_SpacebrewPlugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preload = function (_Phaser$State) {
  _inherits(Preload, _Phaser$State);

  function Preload() {
    _classCallCheck(this, Preload);

    return _possibleConstructorReturn(this, (Preload.__proto__ || Object.getPrototypeOf(Preload)).apply(this, arguments));
  }

  _createClass(Preload, [{
    key: 'init',
    value: function init() {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.game.spacebrewPlugin = this.game.plugins.add(_SpacebrewPlugin2.default);
    }
  }, {
    key: 'preload',
    value: function preload() {
      this.load.video('background-video', 'assets/spacebrew-dance-game/disco-background.mp4');
      this.load.audio('music', 'assets/spacebrew-dance-game/never-gonna-give-you-up.mp3');
      this.load.atlasJSONHash('ddr-graphics', 'assets/spacebrew-dance-game/ddr-graphics.png', 'assets/spacebrew-dance-game/ddr-graphics.json');
      this.load.atlasJSONHash('components', 'assets/spacebrew-dance-game/components.png', 'assets/spacebrew-dance-game/components.json');
    }
  }, {
    key: 'create',
    value: function create() {
      this.state.start('Menu');
      // this.state.start('Play');
    }
  }]);

  return Preload;
}(Phaser.State);

exports.default = Preload;

},{"../SpacebrewPlugin":35}],43:[function(require,module,exports){
'use strict';

var _Presentation = require('./classes/Presentation');

var _Presentation2 = _interopRequireDefault(_Presentation);

var _SlidesFolderParser = require('../../server/classes/SlidesFolderParser');

var _SlidesFolderParser2 = _interopRequireDefault(_SlidesFolderParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('es6-promise').polyfill();

(function () {

  var remote = requireNode('electron').remote;
  var presentationPath = remote.getGlobal('__dirname');
  var path = requireNode('path');

  var init = function init() {
    var settings = {
      presentationPath: presentationPath,
      mobileServerUrl: 'https://jsworkout.herokuapp.com',
      // mobileServerUrl: `http://localhost:5000`,
      mobileServerUsername: 'wouter.verweirder@gmail.com',
      mobileServerPassword: 'geheim'
    };
    var slidesFolderParser = new _SlidesFolderParser2.default();
    slidesFolderParser.parse(presentationPath, path.resolve(presentationPath, 'slides')).then(function (data) {
      new _Presentation2.default(data, 'presentation', settings);
    });
  };

  init();
})();

},{"../../server/classes/SlidesFolderParser":44,"./classes/Presentation":10,"es6-promise":2}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var requireNode = void 0;
if (!(typeof window !== "undefined" && window)) {
  requireNode = require;
} else {
  requireNode = window.requireNode;
}

var fs = requireNode("fs-promise");
var path = requireNode("path");

var getFileProperties = function getFileProperties(filePath) {
  var _fd = void 0,
      _o = void 0;
  return fs.open(filePath, "r").then(function (fd) {
    _fd = fd;
    return fd;
  }).then(function (fd) {
    return fs.fstat(fd);
  }).then(function (o) {
    _o = o;
    return _o;
  }).then(function () {
    return fs.close(_fd);
  }).then(function () {
    return {
      path: filePath,
      isDirectory: _o.isDirectory(),
      isFile: _o.isFile()
    };
  });
};

var SlidesFolderParser = function () {
  function SlidesFolderParser() {
    _classCallCheck(this, SlidesFolderParser);
  }

  _createClass(SlidesFolderParser, [{
    key: "parse",
    value: function parse(presentationPath, slidesFolderPath) {
      var _this = this;

      //read the contents of the slides directory
      return fs.readdir(slidesFolderPath).then(function (result) {
        return result.filter(function (name) {
          return name.indexOf(".") > 0;
        });
      }).then(function (result) {
        return result.map(function (name) {
          return path.resolve(slidesFolderPath, name);
        });
      }).then(function (result) {
        return Promise.all(result.map(function (filePath) {
          return getFileProperties(filePath);
        }));
      }).then(function (result) {
        var data = {
          slides: []
        };
        var slidesByName = {};
        result.forEach(function (props) {
          var slide = _this.createSlideObjectBasedOnFileProperties(props, presentationPath, slidesByName);
          if (!slidesByName[slide.name]) {
            data.slides.push(slide);
          }
          slidesByName[slide.name] = slide;
        });
        // console.log(data.slides);
        return data;
      }).catch(function (e) {
        console.error(e);
      });
    }
  }, {
    key: "parseSlideBaseName",
    value: function parseSlideBaseName(slideBaseName) {
      var parsed = {};
      parsed.ext = path.extname(slideBaseName);
      parsed.name = slideBaseName.substr(0, slideBaseName.length - parsed.ext.length);
      var splitted = parsed.name.split(".");
      var keywords = ["mobile", "desktop", "muted", "loop", "cover"];
      keywords.forEach(function (keyword) {
        var index = splitted.indexOf(keyword);
        if (index > -1) {
          parsed[keyword] = true;
          splitted.splice(index, 1);
        }
      });
      parsed.name = splitted.join(".");
      return parsed;
    }
  }, {
    key: "createSlideObjectBasedOnFileProperties",
    value: function createSlideObjectBasedOnFileProperties(fileProperties, presentationPath, slidesByName) {

      var parsed = this.parseSlideBaseName(path.basename(fileProperties.path));
      var url = path.relative(presentationPath, fileProperties.path).replace("\\", "/");
      if (parsed.ext === ".jpg" || parsed.ext === ".jpeg" || parsed.ext === ".gif" || parsed.ext === ".png") {
        url = "slides-builtin/image.html?image=" + url;
      }
      if (parsed.ext === ".mp4") {
        url = "slides-builtin/video.html?video=" + url;
      }
      if (slidesByName[parsed.name]) {
        if (parsed.mobile) {
          slidesByName[parsed.name].mobile.url = url;
          slidesByName[parsed.name].mobile.explicit = true;
        } else if (parsed.desktop) {
          slidesByName[parsed.name].presentation.url = url;
          slidesByName[parsed.name].presentation.explicit = true;
        } else {
          //set the one which is not set explicitly
          if (slidesByName[parsed.name].mobile.explicit) {
            slidesByName[parsed.name].presentation.url = url;
          } else {
            slidesByName[parsed.name].mobile.url = url;
          }
          return slidesByName[parsed.name];
        }
      }

      return {
        name: parsed.name,
        presentation: {
          url: url,
          explicit: false
        },
        mobile: {
          url: url,
          explicit: false
        }
      };
    }
  }]);

  return SlidesFolderParser;
}();

exports.default = SlidesFolderParser;

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{"isomorphic-fetch":4}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
        var _ret = function () {
          var $slideHolder = $('.slide-frame[data-name="' + slide.name + '"]');
          if ($slideHolder.length > 0) {
            return {
              v: $slideHolder[0]
            };
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
              return {
                v: $slideHolder[0]
              };
            }
          }
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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
      var _this = this;

      value = Math.max(0, Math.min(value, this.slideBridges.length - 1));
      if (value !== this.currentSlideIndex) {
        (function () {
          _this.currentSlideIndex = value;

          var currentSlideBridge = _this.getSlideBridgeByIndex(_this.currentSlideIndex);
          var previousSlideBridge = _this.getSlideBridgeByIndex(_this.currentSlideIndex - 1);
          var nextSlideBridge = _this.getSlideBridgeByIndex(_this.currentSlideIndex + 1);

          //remove "used" class from slide holders
          $('.slide-frame').removeAttr('data-used', false);

          var currentSlideHolder = _this.getSlideHolderForSlide(currentSlideBridge, [previousSlideBridge, nextSlideBridge]);
          _this.setupSlideHolder(currentSlideHolder, currentSlideBridge, _Constants.Constants.STATE_ACTIVE, 0);

          var previousSlideHolder = _this.getSlideHolderForSlide(previousSlideBridge, [currentSlideBridge, nextSlideBridge]);
          _this.setupSlideHolder(previousSlideHolder, previousSlideBridge, _Constants.Constants.STATE_INACTIVE, '-100%');

          var nextSlideHolder = _this.getSlideHolderForSlide(nextSlideBridge, [previousSlideBridge, currentSlideBridge]);
          _this.setupSlideHolder(nextSlideHolder, nextSlideBridge, _Constants.Constants.STATE_INACTIVE, '100%');

          //clear attributes of unused slide frames
          $('.slide-frame').each(function (index, slideHolder) {
            if (!$(slideHolder).attr('data-used')) {
              $(slideHolder).removeAttr('data-used').removeAttr('data-name').removeAttr('data-src');
            }
          });

          //all other slideHolder bridges should be unlinked from their slideHolder
          _this.slideBridges.forEach(function (slideBridge) {
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

          bean.fire(_this, _Constants.Constants.SET_CURRENT_SLIDE_INDEX, [_this.currentSlideIndex]);
        })();
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
      var _this2 = this;

      //listen for events on this slideHolder
      $(slideHolder).off('message-from-slide');
      $(slideHolder).on('message-from-slide', function (event, message) {
        _this2.slideMessageHandler({ data: message });
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

},{"../Constants":45,"./SlideBridge":48}],48:[function(require,module,exports){
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

},{"isomorphic-fetch":4}],"ContentBase":[function(require,module,exports){
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

},{"../Constants":45}],"HeartRateSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

var _HeartRateCanvas = require('../HeartRateCanvas');

var _HeartRateCanvas2 = _interopRequireDefault(_HeartRateCanvas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HeartRateSlide = function (_ContentBase) {
  _inherits(HeartRateSlide, _ContentBase);

  function HeartRateSlide($slideHolder) {
    _classCallCheck(this, HeartRateSlide);

    var _this = _possibleConstructorReturn(this, (HeartRateSlide.__proto__ || Object.getPrototypeOf(HeartRateSlide)).call(this, $slideHolder));

    _this.heartRateCanvas = new _HeartRateCanvas2.default(_this.slideHolder.querySelector('canvas'));
    _this.heartRateCanvas.resize(_this.width, _this.height);
    return _this;
  }

  _createClass(HeartRateSlide, [{
    key: 'receiveMessage',
    value: function receiveMessage(event) {
      _get(HeartRateSlide.prototype.__proto__ || Object.getPrototypeOf(HeartRateSlide.prototype), 'receiveMessage', this).call(this, event);
      if (event.data.action === _Constants.Constants.HEART_RATE_POLAR) {
        this.updateHeartRate(event.data.heartRate);
      }
    }
  }, {
    key: 'updateHeartRate',
    value: function updateHeartRate(heartRate) {
      this.heartRateCanvas.updateHeartRate(heartRate);
      this.$slideHolder.find('.heart-rate-text').text(heartRate);
    }
  }, {
    key: 'drawLoop',
    value: function drawLoop() {
      if (this.sizeChanged) {
        this.heartRateCanvas.resize(this.width, this.height);
      }
      this.heartRateCanvas.tick();
    }
  }]);

  return HeartRateSlide;
}(_ContentBase3.default);

exports.default = HeartRateSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase","../HeartRateCanvas":7}],"HighestHeartrateGameSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

var _Game = require('./game/Game');

var _Game2 = _interopRequireDefault(_Game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HighestHeartrateGameSlide = function (_ContentBase) {
  _inherits(HighestHeartrateGameSlide, _ContentBase);

  function HighestHeartrateGameSlide($slideHolder) {
    _classCallCheck(this, HighestHeartrateGameSlide);

    var _this = _possibleConstructorReturn(this, (HighestHeartrateGameSlide.__proto__ || Object.getPrototypeOf(HighestHeartrateGameSlide)).call(this, $slideHolder));

    _this.game = new _Game2.default($slideHolder[0], 1280, 670, Phaser.AUTO, 'highest-heartrate-game-container');
    return _this;
  }

  _createClass(HighestHeartrateGameSlide, [{
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.game.paused = false;
      } else {
        this.game.paused = true;
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.game.destroy();
      _get(HighestHeartrateGameSlide.prototype.__proto__ || Object.getPrototypeOf(HighestHeartrateGameSlide.prototype), 'destroy', this).call(this);
    }
  }]);

  return HighestHeartrateGameSlide;
}(_ContentBase3.default);

exports.default = HighestHeartrateGameSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase","./game/Game":13}],"LiveCodeSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

var _liveCode = require('../live-code');

var _liveCode2 = _interopRequireDefault(_liveCode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LiveCodeSlide = function (_ContentBase) {
  _inherits(LiveCodeSlide, _ContentBase);

  function LiveCodeSlide($slideHolder, config, readyCallback) {
    _classCallCheck(this, LiveCodeSlide);

    var _this = _possibleConstructorReturn(this, (LiveCodeSlide.__proto__ || Object.getPrototypeOf(LiveCodeSlide)).call(this, $slideHolder));

    var remote = requireNode('electron').remote;
    var config2 = _extends({}, config, { presentationPath: remote.getGlobal('__dirname') });

    //find live code element
    _this.liveCode = new _liveCode2.default(_this.$slideHolder.find('.live-code'), config2, readyCallback);
    return _this;
  }

  _createClass(LiveCodeSlide, [{
    key: 'layout',
    value: function layout() {
      this.liveCode.layout();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      _get(LiveCodeSlide.prototype.__proto__ || Object.getPrototypeOf(LiveCodeSlide.prototype), 'destroy', this).call(this);
      this.liveCode.destroy();
    }
  }, {
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.liveCode.resume();
      } else {
        //stop
        this.liveCode.pause();
      }
    }
  }]);

  return LiveCodeSlide;
}(_ContentBase3.default);

exports.default = LiveCodeSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase","../live-code":25}],"LowestHeartrateGameSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

var _Game = require('./game/Game');

var _Game2 = _interopRequireDefault(_Game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LowestHeartrateGameSlide = function (_ContentBase) {
  _inherits(LowestHeartrateGameSlide, _ContentBase);

  function LowestHeartrateGameSlide($slideHolder) {
    _classCallCheck(this, LowestHeartrateGameSlide);

    var _this = _possibleConstructorReturn(this, (LowestHeartrateGameSlide.__proto__ || Object.getPrototypeOf(LowestHeartrateGameSlide)).call(this, $slideHolder));

    _this.game = new _Game2.default($slideHolder[0], 1280, 670, Phaser.AUTO, 'lowest-heartrate-game-container');
    return _this;
  }

  _createClass(LowestHeartrateGameSlide, [{
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.game.paused = false;
      } else {
        this.game.paused = true;
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.game.destroy();
      _get(LowestHeartrateGameSlide.prototype.__proto__ || Object.getPrototypeOf(LowestHeartrateGameSlide.prototype), 'destroy', this).call(this);
    }
  }]);

  return LowestHeartrateGameSlide;
}(_ContentBase3.default);

exports.default = LowestHeartrateGameSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase","./game/Game":26}],"ReactPhonesSlide":[function(require,module,exports){
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

    _this.gameDuration = 11;
    _this.clientsMap = {};
    _this.music = $('#music')[0];

    _this.$slideHolder.find('#ip').text(_this.settings.mobileServerUrl);

    _this.$slideHolder.find('.substate-intro .btn').on('click', _this.startClickHandler.bind(_this));
    _this.$slideHolder.find('.substate-finished .btn').on('click', _this.winnerClickHandler.bind(_this));

    _this.setSubstate(_Constants.Constants.REACT_PHONES_INTRO);
    return _this;
  }

  _createClass(ReactPhonesSlide, [{
    key: 'setSubstate',
    value: function setSubstate(substate) {
      if (this.substate !== substate) {
        this.substate = substate;
        //send substate to mobile clients
        this.postSocketMessage({
          target: {
            client: 'mobile',
            slide: this.name
          },
          content: {
            action: _Constants.Constants.SET_SUBSTATE,
            substate: this.substate
          }
        });
        if (this.substate === _Constants.Constants.REACT_PHONES_GAME) {
          this.resetAllReactionSpeeds();
        }
        this.showCurrentState();
      }
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(message) {
      if (!message.content) {
        return;
      }
      if (message.content.action === 'updateRoomList') {
        //message.content.ids is an array with ids in this room
        var clientMapIds = _.keys(this.clientsMap);
        //which ids are new? (in message.content.ids but not in clientsMap)
        var newClientIds = _.difference(message.content.ids, clientMapIds);
        //which ids need to be removed? (in clientsMap but not in message.content.ids)
        var removeClientIds = _.difference(clientMapIds, message.content.ids);
        //update our map
        newClientIds.forEach(function (id) {
          this.clientsMap[id] = {
            id: id,
            reactionSpeed: 99999999999
          };
          this.postSocketMessage({
            target: {
              client: 'mobile',
              slide: this.name
            },
            content: {
              action: _Constants.Constants.SET_SUBSTATE,
              substate: this.substate
            }
          });
        }, this);
        removeClientIds.forEach(function (id) {
          if (this.clientsMap[id]) {
            //this.clientsMap[id].$div.remove();
          }
          delete this.clientsMap[id];
        }, this);

        this.numClientsChanged();
      } else if (message.content.action === _Constants.Constants.UPDATE_REACTION_SPEED) {
        console.log(message);
        if (!message.sender) {
          return;
        }
        //message.sender.id contains the origin id
        if (!this.clientsMap[message.sender.id]) {
          return;
        }
        console.log('update reactionspeed to ' + message.content.reactionSpeed);
        this.clientsMap[message.sender.id].reactionSpeed = message.content.reactionSpeed;
      }
    }
  }, {
    key: 'startClickHandler',
    value: function startClickHandler() {
      this.setSubstate(_Constants.Constants.REACT_PHONES_GAME);
    }
  }, {
    key: 'winnerClickHandler',
    value: function winnerClickHandler() {
      //get the clienthandler with the largest motion, and blink it's screen
      var winningClient = false;
      var reactionSpeed = 99999999999;
      for (var id in this.clientsMap) {
        if (!this.clientsMap[id].speedWinner && this.clientsMap[id].reactionSpeed < reactionSpeed) {
          winningClient = this.clientsMap[id];
          reactionSpeed = winningClient.reactionSpeed;
        }
      }
      if (winningClient) {
        winningClient.speedWinner = true;
        //send message to this client
        this.postSocketMessage({
          target: {
            client: winningClient.id
          },
          content: {
            action: _Constants.Constants.BLINK,
            text: '<span style="font-size: 5em;">Spectacular, You Win!</span>',
            backgroundColor: 'red'
          }
        });
      }
    }
  }, {
    key: 'resetAllReactionSpeeds',
    value: function resetAllReactionSpeeds() {
      for (var id in this.clientsMap) {
        this.clientsMap[id].reactionSpeed = 99999999999;
        this.clientsMap[id].speedWinner = false;
      }
    }
  }, {
    key: 'numClientsChanged',
    value: function numClientsChanged() {
      this.$slideHolder.find('#connections span').text(_.keys(this.clientsMap).length);
    }
  }, {
    key: 'showCurrentState',
    value: function showCurrentState() {
      this.$slideHolder.find('.substate').removeClass('active');
      this.$slideHolder.find('.slide').css({
        backgroundImage: 'none'
      });
      if (this.substate === _Constants.Constants.REACT_PHONES_GAME) {
        this.music.play();
        this.$slideHolder.find('.substate-game .countdown').html(this.gameDuration);
        this.$slideHolder.find('.substate-game').addClass('active');
        this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, this.gameDuration - 1), 1000);
      } else if (this.substate === _Constants.Constants.REACT_PHONES_FINISHED) {
        this.$slideHolder.find('.substate-finished').addClass('active');
      } else {
        this.$slideHolder.find('.slide').css({
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center center',
          backgroundImage: 'url(assets/iphone-connections.png)'
        });
        this.$slideHolder.find('.substate-intro').addClass('active');
      }
    }
  }, {
    key: 'countDownHandler',
    value: function countDownHandler(timeLeft) {
      this.$slideHolder.find('.substate-game .countdown').html(timeLeft);
      if (timeLeft > 0) {
        this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, timeLeft - 1), 1000);
      } else {
        this.setSubstate(_Constants.Constants.REACT_PHONES_FINISHED);
      }
    }
  }]);

  return ReactPhonesSlide;
}(_ContentBase3.default);

exports.default = ReactPhonesSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase"}],"ShakeYourPhonesSlide":[function(require,module,exports){
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

    _this.gameDuration = 13; //game lasts 13 seconds
    _this.clientsMap = {};
    _this.clientsByTeam = [[], []];
    _this.motions = [0, 0];
    _this.music = _this.$slideHolder.find('#music')[0];

    _this.$slideHolder.find('#ip').text(_this.settings.mobileServerUrl);

    _this.$slideHolder.find('.substate-intro .btn').on('click', _this.startClickHandler.bind(_this));
    _this.$slideHolder.find('.substate-finished .btn').on('click', _this.winnerClickHandler.bind(_this));

    _this.setSubstate(_Constants.Constants.SHAKE_YOUR_PHONES_INTRO);
    return _this;
  }

  _createClass(ShakeYourPhonesSlide, [{
    key: 'setSubstate',
    value: function setSubstate(substate) {
      if (this.substate !== substate) {
        this.substate = substate;
        //send substate to mobile clients
        this.postSocketMessage({
          target: {
            client: 'mobile',
            slide: this.name
          },
          content: {
            action: _Constants.Constants.SET_SUBSTATE,
            substate: this.substate
          }
        });
        if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_GAME) {
          this.resetMotion();
        }
        this.showCurrentState();
      }
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(message) {
      if (!message.content) {
        return;
      }
      if (message.content.action === 'updateRoomList') {
        //message.content.ids is an array with ids in this room
        var clientMapIds = _.keys(this.clientsMap);
        //which ids are new? (in message.content.ids but not in clientsMap)
        var newClientIds = _.difference(message.content.ids, clientMapIds);
        //which ids need to be removed? (in clientsMap but not in message.content.ids)
        var removeClientIds = _.difference(clientMapIds, message.content.ids);
        //update our map
        newClientIds.forEach(function (id) {
          var left = Math.random();
          var top = Math.random();
          this.clientsMap[id] = {
            id: id,
            motion: 0,
            size: 10,
            shakeWinner: false,
            $div: $('<div>').css({
              position: 'absolute',
              left: left * 100 + '%',
              top: top * 100 + '%',
              transformOrigin: 'center',
              transform: 'scale(1)',
              borderRadius: '50%',
              backgroundColor: 'rgba(' + Math.round(left * 255) + ',' + Math.round(top * 255) + ', 0, 1)',
              width: '10px',
              height: '10px'
            })
          };
          $('.background .substate-game').append(this.clientsMap[id].$div);
          this.postSocketMessage({
            target: {
              client: 'mobile',
              slide: this.name
            },
            content: {
              action: _Constants.Constants.SET_SUBSTATE,
              substate: this.substate
            }
          });
        }, this);
        removeClientIds.forEach(function (id) {
          if (this.clientsMap[id]) {
            this.clientsMap[id].$div.remove();
          }
          delete this.clientsMap[id];
        }, this);

        this.numClientsChanged();
      } else if (message.content.action === _Constants.Constants.UPDATE_MOTION) {
        if (!message.sender) {
          return;
        }
        //message.sender.id contains the origin id
        if (!this.clientsMap[message.sender.id]) {
          return;
        }
        this.clientsMap[message.sender.id].motion = Math.min(130, message.content.motion); //limit max motion to 130
      }
    }
  }, {
    key: 'startClickHandler',
    value: function startClickHandler() {
      this.setSubstate(_Constants.Constants.SHAKE_YOUR_PHONES_GAME);
    }
  }, {
    key: 'winnerClickHandler',
    value: function winnerClickHandler() {
      //get the clienthandler with the largest motion, and blink it's screen
      var winningClient = false;
      var maximumMotion = -1;
      for (var id in this.clientsMap) {
        if (!this.clientsMap[id].shakeWinner && this.clientsMap[id].motion > maximumMotion) {
          winningClient = this.clientsMap[id];
          maximumMotion = winningClient.motion;
        }
      }
      if (winningClient) {
        winningClient.shakeWinner = true;
        //send message to this client
        this.postSocketMessage({
          target: {
            client: winningClient.id
          },
          content: {
            action: _Constants.Constants.BLINK,
            text: '<span style="font-size: 5em;">Spectacular, You Win!</span>',
            backgroundColor: 'red'
          }
        });
      }
    }
  }, {
    key: 'resetMotion',
    value: function resetMotion() {
      this.motions = [0, 0];
      for (var id in this.clientsMap) {
        this.clientsMap[id].motion = 0;
        this.clientsMap[id].shakeWinner = false;
      }
    }
  }, {
    key: 'numClientsChanged',
    value: function numClientsChanged() {
      this.$slideHolder.find('#connections span').text(_.keys(this.clientsMap).length);
    }
  }, {
    key: 'showCurrentState',
    value: function showCurrentState() {
      this.$slideHolder.find('.substate').removeClass('active');
      this.$slideHolder.find('.slide').css({
        backgroundImage: 'none'
      });
      if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_GAME) {
        this.music.play();
        this.$slideHolder.find('.substate-game .countdown').html(this.gameDuration);
        this.$slideHolder.find('.substate-game').addClass('active');
        this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, this.gameDuration - 1), 1000);
      } else if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_FINISHED) {
        this.$slideHolder.find('.substate-finished').addClass('active');
      } else {
        this.$slideHolder.find('.slide').css({
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center center',
          backgroundImage: 'url(assets/iphone-connections.png)'
        });
        this.$slideHolder.find('.substate-intro').addClass('active');
      }
    }
  }, {
    key: 'countDownHandler',
    value: function countDownHandler(timeLeft) {
      this.$slideHolder.find('.substate-game .countdown').html(timeLeft);
      if (timeLeft > 0) {
        this.countDownTimeout = setTimeout(this.countDownHandler.bind(this, timeLeft - 1), 1000);
      } else {
        this.setSubstate(_Constants.Constants.SHAKE_YOUR_PHONES_FINISHED);
      }
    }
  }, {
    key: 'drawLoop',
    value: function drawLoop() {
      if (this.substate === _Constants.Constants.SHAKE_YOUR_PHONES_GAME) {
        $.each(this.clientsMap, function (key, value) {
          var target = Math.max(10, value.motion);
          value.size += (target - value.size) * 0.2;
          value.$div.css({
            transform: 'scale(' + value.size + ')'
          });
        });
      }
    }
  }]);

  return ShakeYourPhonesSlide;
}(_ContentBase3.default);

exports.default = ShakeYourPhonesSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase"}],"SpacebrewDanceGameSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

var _Game = require('./game/Game');

var _Game2 = _interopRequireDefault(_Game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SpacebrewDanceGameSlide = function (_ContentBase) {
  _inherits(SpacebrewDanceGameSlide, _ContentBase);

  function SpacebrewDanceGameSlide($slideHolder) {
    _classCallCheck(this, SpacebrewDanceGameSlide);

    var _this = _possibleConstructorReturn(this, (SpacebrewDanceGameSlide.__proto__ || Object.getPrototypeOf(SpacebrewDanceGameSlide)).call(this, $slideHolder));

    _this.game = new _Game2.default(1280, 670, Phaser.AUTO, 'dance-game-container');
    return _this;
  }

  _createClass(SpacebrewDanceGameSlide, [{
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.game.paused = false;
      } else {
        this.game.paused = true;
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.game.destroy();
      _get(SpacebrewDanceGameSlide.prototype.__proto__ || Object.getPrototypeOf(SpacebrewDanceGameSlide.prototype), 'destroy', this).call(this);
    }
  }]);

  return SpacebrewDanceGameSlide;
}(_ContentBase3.default);

exports.default = SpacebrewDanceGameSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase","./game/Game":34}],"VideoSlide":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Constants = require('../../../../shared/js/Constants');

var _ContentBase2 = require('../../../../shared/js/classes/ContentBase');

var _ContentBase3 = _interopRequireDefault(_ContentBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getParameterByName = function getParameterByName(url, name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(url);
  return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var VideoSlide = function (_ContentBase) {
  _inherits(VideoSlide, _ContentBase);

  function VideoSlide($slideHolder) {
    _classCallCheck(this, VideoSlide);

    var _this = _possibleConstructorReturn(this, (VideoSlide.__proto__ || Object.getPrototypeOf(VideoSlide)).call(this, $slideHolder));

    _this.videoPlaying = false;
    var videoUrl = getParameterByName(_this.src, 'video');

    //check for extra config in the filename
    var loop = false;
    var muted = false;
    var videoUrlSplitted = videoUrl.split('.');
    videoUrlSplitted.forEach(function (part) {
      if (part === 'loop') {
        loop = true;
      }
      if (part === 'muted') {
        muted = true;
      }
    });

    _this.video = _this.$slideHolder.find('video')[0];
    if (loop) {
      $(_this.video).attr('loop', 'loop');
    }
    if (muted) {
      $(_this.video).attr('muted', 'muted');
    }
    $(_this.video).attr('src', videoUrl);
    _this._clickHandler = _this.clickHandler.bind(_this);
    $(_this.video).on('click', _this._clickHandler);
    return _this;
  }

  _createClass(VideoSlide, [{
    key: 'destroy',
    value: function destroy() {
      _get(VideoSlide.prototype.__proto__ || Object.getPrototypeOf(VideoSlide.prototype), 'destroy', this).call(this);
      $(this.video).off('click', this._clickHandler);
    }
  }, {
    key: 'onStateChanged',
    value: function onStateChanged() {
      if (this.state === _Constants.Constants.STATE_ACTIVE) {
        this.setVideoPlaying(true);
      } else {
        this.setVideoPlaying(false);
      }
    }
  }, {
    key: 'clickHandler',
    value: function clickHandler(event) {
      // eslint-disable-line no-unused-vars
      this.toggleVideoPlaying();
    }
  }, {
    key: 'setVideoPlaying',
    value: function setVideoPlaying(value) {
      if (value !== this.videoPlaying) {
        this.videoPlaying = value;
        if (this.videoPlaying) {
          this.video.play();
        } else {
          this.video.pause();
        }
      }
    }
  }, {
    key: 'toggleVideoPlaying',
    value: function toggleVideoPlaying() {
      this.setVideoPlaying(!this.videoPlaying);
    }
  }]);

  return VideoSlide;
}(_ContentBase3.default);

exports.default = VideoSlide;

},{"../../../../shared/js/Constants":45,"../../../../shared/js/classes/ContentBase":"ContentBase"}]},{},[43])


//# sourceMappingURL=script.js.map
