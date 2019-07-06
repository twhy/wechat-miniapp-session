var // modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"4xYK":[function(require,module,exports) {
class Session {
  constructor(appId) {
    this.appId = appId;
    this.key = `wechat_miniapp_session_${appId}`;
  }

  get() {
    return wx.getStorageSync(this.key) || null;
  }

  set(session) {
    wx.setStorageSync(this.key, session);
  }

  clear() {
    wx.removeStorageSync(this.key);
  }

}

module.exports = Session;
},{}],"gIeR":[function(require,module,exports) {
module.exports = {
  HEADER_SESSION_ID: 'x-wechat-miniapp-session-id',
  HEADER_SESSION_KEY: 'x-wechat-miniapp-session-key',
  HEADER_SESSION_SKIP: 'x-wechat-miniapp-session-skip',
  HEADER_IV: 'x-wechat-miniapp-iv',
  HEADER_LOGIN_CODE: 'x-wechat-miniapp-login-code',
  HEADER_ENCRYPTED_DATA: 'x-wechat-miniapp-encrypted-data',
  MESSAGE_LOGIN_FAILED: 'WeChat MiniApp login failed',
  MESSAGE_MISSING_HEADER: 'WeChat MiniApp missing header',
  MESSAGE_SESSION_ERROR: 'WeChat MiniApp session error',
  MESSAGE_SESSION_REQUIRE: 'WeChat MiniApp session require',
  MESSAGE_SESSION_EXPIRED: 'WeChat MiniApp session expired',
  MESSAGE_SESSION_INVALID: 'WeChat MiniApp session invalid'
};
},{}],"Focm":[function(require,module,exports) {
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// @ts-check
const Session = require('./session');

const {
  HEADER_IV,
  HEADER_LOGIN_CODE,
  HEADER_ENCRYPTED_DATA,
  HEADER_SESSION_ID,
  HEADER_SESSION_KEY
} = require('../constants');

function noop(o) {
  o;
}

module.exports = class Client {
  constructor(appId, loginUrl) {
    if (!appId) throw new Error('appId is required');
    if (!loginUrl) throw new Error('loginUrl is required');
    this.appId = appId;
    this.loginUrl = loginUrl;
    this.session = new Session(appId);
    ['GET', 'PUT', 'POST', 'DELETE'].forEach(method => {
      this[method.toLowerCase()] = (options = {}) => this.request(_objectSpread({}, options, {
        method
      }));
    });
  }

  login({
    success = noop,
    fail = noop
  }) {
    // @ts-ignore
    wx.checkSession({
      success: () => {
        this._login({
          success,
          fail
        });
      },
      fail: () => {
        this.session.clear();

        this._login({
          success,
          fail
        });
      }
    });
  }

  _login({
    success = noop,
    fail = noop
  }) {
    this.getLoginData().then(({
      code,
      iv,
      encryptedData
    }) => {
      const header = _objectSpread({}, this.sessionHeader, {
        [HEADER_IV]: iv,
        [HEADER_LOGIN_CODE]: code,
        [HEADER_ENCRYPTED_DATA]: encryptedData // @ts-ignore

      });

      wx.request({
        header,
        method: 'POST',
        url: this.loginUrl,
        fail,
        success: ({
          data
        }) => {
          const {
            error,
            session
          } = data;

          if (error) {
            fail(error);
          } else if (session) {
            this.session.set(session);
            success();
          } else {
            console.log('Login failed: No Session');
            fail(new Error('Login failed: No Session'));
          }
        }
      });
    }).catch(error => {
      console.log('getLoginData error', error);
    });
  }

  get sessionHeader() {
    const session = this.session.get() || {};
    return {
      [HEADER_SESSION_ID]: session.id || '',
      [HEADER_SESSION_KEY]: session.key || ''
    };
  }

  request({
    url,
    data,
    header = {},
    method = 'GET',
    dataType = 'json',
    responseType = 'text',
    success = noop,
    fail = noop,
    complete = noop
  }) {
    let tries = 3; // @ts-ignore

    const run = () => wx.request({
      url,
      data,
      header: _objectSpread({}, header, this.sessionHeader),
      method,
      dataType,
      responseType,
      fail,
      complete,
      success: ({
        data,
        header,
        statusCode
      }) => {
        const {
          error
        } = data;

        if (error && error.session) {
          this.session.clear();
          --tries ? this.login({
            success: run
          }) : fail(error);
        } else {
          error ? fail(error) : success({
            data,
            header,
            statusCode
          });
        }
      }
    });

    run();
  }

  upload({
    url,
    filePath,
    name,
    header = {},
    formData = {},
    success = noop,
    fail = noop,
    complete = noop
  }) {
    let tries = 3; // @ts-ignore

    const run = () => wx.uploadFile({
      url,
      filePath,
      name,
      formData,
      header: _objectSpread({}, header, this.sessionHeader),
      fail,
      complete,
      success: ({
        data,
        statusCode
      }) => {
        const {
          error
        } = data;

        if (error && error.session) {
          this.session.clear();
          --tries ? this.login({
            success: run
          }) : fail(error);
        } else {
          error ? fail(error) : success({
            data,
            statusCode
          });
        }
      }
    });

    return run();
  }

  getLoginData() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      wx.login({
        fail: reject,
        success: ({
          code
        }) => {
          // @ts-ignore
          wx.getUserInfo({
            fail: reject,
            success: ({
              userInfo,
              rawData,
              signature,
              iv,
              encryptedData
            }) => {
              resolve({
                userInfo,
                rawData,
                signature,
                iv,
                encryptedData,
                code
              });
            }
          });
        }
      });
    });
  }

};
},{"./session":"4xYK","../constants":"gIeR"}]},{},["Focm"], null)
