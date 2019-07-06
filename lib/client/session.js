class Session {
  constructor(appId) {
    this.appId = appId
    this.key = `wechat_miniapp_session_${appId}`
  }

  get() {
    return wx.getStorageSync(this.key) || null
  }

  set(session) {
    wx.setStorageSync(this.key, session)
  }

  clear() {
    wx.removeStorageSync(this.key)
  }
}

module.exports = Session