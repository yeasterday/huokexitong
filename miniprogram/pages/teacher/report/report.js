Page({
  data: {
    reportData: [
      { name: '张小明', checkins: 28, levels: 15, points: 1250 },
      { name: '李华', checkins: 25, levels: 12, points: 980 },
      { name: '王思齐', checkins: 30, levels: 22, points: 2100 },
      { name: '陈语嫣', checkins: 22, levels: 10, points: 750 }
    ]
  },

  doExport() {
    wx.showModal({
      title: '导出成功',
      content: '报表已生成，是否发送至校长的注册邮箱？',
      confirmText: '发送',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '邮件已发出', icon: 'success' });
        }
      }
    });
  }
});