const db = wx.cloud.database();
const _ = db.command; // 🌟 引入数据库的高级指令符

Page({
  data: { msgList: [] },

  onShow() {
    const user = wx.getStorageSync('currentUser');
    if (!user) return;

    wx.showLoading({ title: '加载中' });
    
    // 🌟 核心引擎：计算出刚好 30 天前的那个时间点
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 拉取发给我的消息，并且加上时间条件：必须大于或等于 (gte) 30 天前
    db.collection('messages').where({ 
      receiverId: user._id,
      createTime: _.gte(thirtyDaysAgo) // ⏳ 时间过滤器生效
    }).orderBy('createTime', 'desc').get().then(res => {
      const msgs = res.data.map(item => {
        let timeStr = '';
        if (item.createTime) {
          const d = new Date(item.createTime);
          timeStr = `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return { ...item, time: timeStr };
      });
      
      this.setData({ msgList: msgs });
      wx.hideLoading();

      // 把我的所有消息标记为已读 (如果你之前部署了这个云函数的话)
      wx.cloud.callFunction({ name: 'markMessagesRead', data: { userId: user._id } }).catch(()=>{});
    }).catch(err => {
      console.error("加载消息失败", err);
      wx.hideLoading();
    });
  }
});