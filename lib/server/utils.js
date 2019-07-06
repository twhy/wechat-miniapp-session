// @ts-check
const crypto = require('crypto')

function sha1(message) {
  return crypto.createHash('sha1').update(message, 'utf8').digest('hex')
}

function createMiniAppSessionKey(appId, appSecret, sessionKey) {
  return sha1(appId + appSecret + sessionKey)
}

function apperror(message) {
  return { error: { message, session: true } }
}

// Document  https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html#%E5%8A%A0%E5%AF%86%E6%95%B0%E6%8D%AE%E8%A7%A3%E5%AF%86%E7%AE%97%E6%B3%95
// Code from https://github.com/tencentyun/wafer-node-session/blob/master/lib/WXBizDataCrypt.js
function decrypt(appId, sessionKey, encryptedData, iv) {
  // base64 decode
  sessionKey = Buffer.from(sessionKey, 'base64')
  encryptedData = Buffer.from(encryptedData, 'base64')
  iv = Buffer.from(iv, 'base64')

  let decoded
  try {
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true)
    decoded = decipher.update(encryptedData, 'binary', 'utf8')
    decoded += decipher.final('utf8')

    decoded = JSON.parse(decoded)

  } catch (err) {
    throw new Error('Illegal Buffer')
  }

  if (decoded.watermark.appid !== appId) {
    throw new Error('Illegal Buffer')
  }

  return decoded
}

module.exports = { sha1, decrypt, createMiniAppSessionKey, apperror }