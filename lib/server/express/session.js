// @ts-check
const url = require('url')
const crypto = require('crypto')
const assert = require('assert')
const login = require('../login')
// @ts-ignore
const { Cookie, Store, MemoryStore } = require('express-session')
const { decrypt, apperror, createMiniAppSessionKey } = require('../utils')
const {
  HEADER_SESSION_ID,
  HEADER_SESSION_KEY,
  HEADER_SESSION_SKIP,
  HEADER_IV,
  HEADER_LOGIN_CODE,
  HEADER_ENCRYPTED_DATA,
  MESSAGE_LOGIN_FAILED,
  MESSAGE_SESSION_ERROR,
  MESSAGE_MISSING_HEADER,
  MESSAGE_SESSION_REQUIRE,
  MESSAGE_SESSION_EXPIRED,
  MESSAGE_SESSION_INVALID
} = require('../../constants')

// Learn from https://github.com/tencentyun/wafer-node-session/blob/master/index.js
/**
 * Wechat Miniapp session middleware
 * @param {Object} [options]
 * @param {string} [options.appId]
 * @param {string} [options.appSecret]
 * @param {string} [options.loginPath] 
 * @param {number} [options.maxAge]
 * @param {Object} [options.store=MemoryStore]
 */
function session(options = {}) {
  const { appId, appSecret } = options
  assert(appId && appSecret, 'Missing appId or appSecret')

  let { loginPath, maxAge, store } = options

  loginPath = loginPath || '/wechat-miniapp-login'
  maxAge = maxAge || 7 * 24 * 3600 * 1000   // 1 week
  
  store = store || new MemoryStore()
  assert(typeof store.get === 'function' && typeof store.set === 'function', 'Invalid store')

  return function(req, res, next) {
    const { url: requrl, headers } = req
    const isLoginRequest = url.parse(requrl).pathname === loginPath
    const sid = headers[HEADER_SESSION_ID]
    const skey = headers[HEADER_SESSION_KEY]

    if (sid && skey) {
      return store.get(sid, (error, session) => {
        if (error) {
          return res.json(apperror(MESSAGE_SESSION_ERROR))
        }
        
        if (!session) {
          return res.json(apperror(MESSAGE_SESSION_EXPIRED))
        }

        if (skey !== createMiniAppSessionKey(appId, appSecret, session.sessionKey)) {
          return res.json(apperror(MESSAGE_SESSION_INVALID))
        }

        req.session = session
        isLoginRequest ? res.json({ session: { id: session.id, key: session.key } }) : next()
      })
    }

    if (isLoginRequest) {
      newSession(req, res, next)
    } else {
      res.json(apperror(MESSAGE_SESSION_REQUIRE))
    }

    function newSession(req, res, next) {
      const iv = headers[HEADER_IV]
      const loginCode = headers[HEADER_LOGIN_CODE]
      const encryptedData = headers[HEADER_ENCRYPTED_DATA]
      if (!iv || !loginCode || !encryptedData) {
        return res.json(apperror(MESSAGE_MISSING_HEADER))
      }
  
      login(appId, appSecret, loginCode)
        .then(result => {
          const { sessionKey } = result
          const userInfo = decrypt(appId, sessionKey, encryptedData, iv)
  
          assert(userInfo.watermark.appid === appId)
  
          const session = req.session = {
            id: crypto.randomBytes(32).toString('hex'),
            key: createMiniAppSessionKey(appId, appSecret, sessionKey),
            cookie: new Cookie({ maxAge }),
            userInfo,
            sessionKey,
          }
          req.sessionID = session.id
          
          store.set(session.id, session, function (error) {
            res.json(error
              ? apperror(`${MESSAGE_LOGIN_FAILED} ${error.message}`)
              : { session: { id: session.id, key: session.key } }
            )
          })
        })
        .catch(error => {
          res.json(apperror(`${MESSAGE_LOGIN_FAILED} ${error.message}`))
        })
    }
  }
}

// expose express-session modules for store connectors
session.Cookie = Cookie
session.Store = Store
session.MemoryStore = MemoryStore

module.exports = session