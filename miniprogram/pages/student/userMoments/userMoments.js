const db = wx.cloud.database();

Page({
  data: {
    targetUserId: '', targetUser: {}, moments: [], isMe: false, userInfo: {},
    showCommentInput: false, commentContent: '', activeMomentIndex: null
  },

  onLoad(options) {
    const userId = options.userId;
    const currentUser = wx.getStorageSync('currentUser') || {};
    this.setData({ targetUserId: userId, isMe: currentUser._id === userId, userInfo: currentUser });
    this.fetchUserInfo();
    this.fetchMoments();
  },

  fetchUserInfo() {
    db.collection('users').doc(this.data.targetUserId).get().then(res => {
      this.setData({ targetUser: res.data });
      wx.setNavigationBarTitle({ title: res.data.name + '的主页' });
    });
  },

// 🌟 1. 个人主页加载时，检查点赞记忆
fetchMoments() {
  wx.showLoading({ title: '加载中' });
  const currentUserId = this.data.userInfo._id;

  db.collection('moments').where({ userId: this.data.targetUserId }).orderBy('createTime', 'desc').get().then(res => {
    const realMoments = res.data.map(item => {
      let timeStr = '刚刚';
      if (item.createTime) {
        const d = new Date(item.createTime);
        timeStr = `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
      }
      
      const isLikedByMe = item.likedBy ? item.likedBy.includes(currentUserId) : false;

      return { ...item, time: timeStr, likes: item.likes || 0, comments: item.comments || 0, isLiked: isLikedByMe };
    });
    this.setData({ moments: realMoments });
    wx.hideLoading();
  });
},

// 🌟 2. 个人主页点赞，真实写入云端
// 🌟 升级版：个人主页点赞，触发消息通知
toggleLike(e) {
  const user = this.data.userInfo;
  if (!user || !user._id) return wx.showToast({ title: '登录后即可点赞', icon: 'none' });

  const index = e.currentTarget.dataset.index;
  const moment = this.data.moments[index];
  const isCurrentlyLiked = moment.isLiked;

  const keyLiked = `moments[${index}].isLiked`;
  const keyLikesCount = `moments[${index}].likes`;
  
  this.setData({
    [keyLiked]: !isCurrentlyLiked,
    [keyLikesCount]: isCurrentlyLiked ? (moment.likes - 1) : (moment.likes + 1)
  });
  wx.vibrateShort();

  const _ = db.command;
  db.collection('moments').doc(moment._id).update({
    data: {
      likes: _.inc(isCurrentlyLiked ? -1 : 1),
      likedBy: isCurrentlyLiked ? _.pull(user._id) : _.push(user._id)
    }
  }).then(() => {
    // 🌟 核心新增：发通知
    if (!isCurrentlyLiked && moment.userId && moment.userId !== user._id) {
      db.collection('messages').add({
        data: {
          type: 'like',
          receiverId: moment.userId,
          senderName: user.nickname || user.name || '神秘同学',
          senderAvatar: user.avatar,
          momentText: moment.content ? moment.content.substring(0, 15) + '...' : '分享了图片',
          createTime: db.serverDate(),
          isRead: false
        }
      });
    }
  });
},

  openComment(e) {
    if (!this.data.userInfo._id) return wx.showToast({ title: '请先登录', icon: 'none' });
    this.setData({ showCommentInput: true, activeMomentIndex: e.currentTarget.dataset.index, commentContent: '' });
  },
  closeComment() { this.setData({ showCommentInput: false }); },
  handleCommentInput(e) { this.setData({ commentContent: e.detail.value }); },

  sendComment() {
    const content = this.data.commentContent.trim();
    if (!content) return;
    wx.showLoading({ title: '发送中...' });
    const index = this.data.activeMomentIndex;
    const moment = this.data.moments[index];
    const newComment = { name: this.data.userInfo.nickname || this.data.userInfo.name || '神秘人', content: content, time: new Date().getTime() };
    
    // 1. 更新帖子的评论列表
    db.collection('moments').doc(moment._id).update({
      data: { commentsList: db.command.push(newComment), comments: db.command.inc(1) }
    }).then(() => {
      
      // 2. 🌟 触发消息通知（如果不是自己评论自己）
      if (moment.userId !== this.data.userInfo._id) {
        db.collection('messages').add({
          data: {
            receiverId: moment.userId, // 接收消息的人
            senderName: newComment.name,
            type: 'comment',
            senderAvatar: this.data.userInfo.avatar || this.data.userInfo.avatarUrl || '',
            content: content,
            momentText: moment.content.substring(0, 15) + '...', // 截取一小段原贴内容
            createTime: db.serverDate(),
            isRead: false
          }
        });
      }

      wx.hideLoading();
      const moments = this.data.moments;
      if (!moments[index].commentsList) moments[index].commentsList = [];
      moments[index].commentsList.push(newComment);
      moments[index].comments += 1;
      this.setData({ moments: moments, showCommentInput: false, commentContent: '' });
      wx.showToast({ title: '评论成功' });
    });
  },

  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除确认', content: '确定要删除这条动态吗？',
      success: (res) => {
        if (res.confirm) {
          db.collection('moments').doc(id).remove().then(() => {
            wx.showToast({ title: '已删除' });
            this.fetchMoments();
          });
        }
      }
    });
  }
});
