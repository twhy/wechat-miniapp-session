// @ts-check
const Session = require('./session')
const {
  HEADER_IV,
  HEADER_LOGIN_CODE,
  HEADER_ENCRYPTED_DATA,
  HEADER_SESSION_ID,
  HEADER_SESSION_KEY
} = require('../constants')

function noop(o) { o }

module.exports = class Client {

  constructor(appId, loginUrl) {
    if (!appId) throw new Error('appId is required')
    if (!loginUrl) throw new Error('loginUrl is required')

    this.appId = appId
    this.loginUrl = loginUrl
    this.session = new Session(appId)
    
    ;['GET', 'PUT', 'POST', 'DELETE'].forEach(method => {
      this[method.toLowerCase()] = (options = {}) => this.request({ ...options, method })
    })
  }

  login({ success = noop, fail = noop }) { 
    // @ts-ignore
    wx.checkSession({
      success: () => {
        this._login({ success, fail })
      },
      fail: () => {
        this.session.clear()
        this._login({ success, fail })
      }
    })
  }

  _login({ success = noop, fail = noop }) {
    this.getLoginData()
      .then(({ code, iv, encryptedData }) => {
        const header = {
          ...this.sessionHeader,
          [HEADER_IV]: iv,
          [HEADER_LOGIN_CODE]: code,
          [HEADER_ENCRYPTED_DATA]: encryptedData
        }
        // @ts-ignore
        wx.request({
          header,
          method: 'POST',
          url: this.loginUrl,
          fail,
          success: ({ data }) => {
            const { error, session } = data
            if (error) { fail(error) }
            else if (session) {
              this.session.set(session)
              success()
            } else {
              console.log('Login failed: No Session')
              fail(new Error('Login failed: No Session'))
            }
          },
        })
      })
      .catch(error => {
        console.log('getLoginData error', error)
      })
  }

  get sessionHeader() {
    const session = this.session.get() || {}
    return { [HEADER_SESSION_ID]: session.id || '', [HEADER_SESSION_KEY]: session.key || '' }
  }

  request({ url, data, header = {}, method = 'GET', dataType = 'json', responseType = 'text', success = noop, fail = noop, complete = noop }) {
    let tries = 3
    // @ts-ignore
    const run = () => wx.request({ url, data, header: { ...header, ...this.sessionHeader }, method, dataType, responseType, fail, complete, success: ({ data, header, statusCode }) => {
      const { error } = data
      if (error && error.session) {
        this.session.clear()
        --tries ? this.login({ success: run }) : fail(error)
      } else {
        error ? fail(error) : success({ data, header, statusCode })
      }
    }})

    run()
  }

  upload({ url, filePath, name, header = {}, formData = {}, success = noop, fail = noop, complete = noop }) {
    let tries = 3
    // @ts-ignore
    const run = () => wx.uploadFile({ url, filePath, name, formData, header: { ...header, ...this.sessionHeader }, fail, complete, success: ({ data, statusCode }) => {
      const { error } = data
      if (error && error.session) {
        this.session.clear()
        --tries ? this.login({ success: run }) : fail(error)
      } else {
        error ? fail(error) : success({ data, statusCode })
      }
    }})

    return run()
  }

  getLoginData() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      wx.login({
        fail: reject,
        success: ({ code }) => {
          // @ts-ignore
          wx.getUserInfo({
            fail: reject,
            success: ({ userInfo, rawData, signature, iv, encryptedData }) => {
              resolve({ userInfo, rawData, signature, iv, encryptedData, code })
            }
          })
        }
      })
    })
  }
}