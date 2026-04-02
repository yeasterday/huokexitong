const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 初始化云环境

exports.main = async (event, context) => {
  try {
    // 调用微信官方的消息推送接口
    const result = await cloud.openapi.subscribeMessage.send({
      touser: event.openid,         // 接收人的 OpenID
      templateId: event.templateId, // 你的模板 ID
      page: 'pages/index/index',    // 用户点击消息卡片后跳转的页面
      data: event.templateData,     // 消息里具体的文字内容
      miniprogramState: 'developer' // 设置为开发环境测试（正式上线后需改成 formal）
    })
    return result
  } catch (err) {
    console.log("消息发送失败：", err)
    return err
  }
}