const axios = require('axios')
const assert = require('assert')

// https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
module.exports = async function (appid, appsec, code) {
  assert(appid && appsec && code, 'Missing appId or appSecret or authorization code')

  // https://developers.weixin.qq.com/miniprogram/dev/api/code2Session.html
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsec}&js_code=${code}&grant_type=authorization_code`

  const res = await axios.get(url)
  const { openid, session_key } = res.data
  
  assert(openid && session_key)

  return {
    openId: openid,
    sessionKey: session_key
  }
}