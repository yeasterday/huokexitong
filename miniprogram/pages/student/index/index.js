const db = wx.cloud.database();

Page({
  data: {
    keyword: '', moments: [], userInfo: {},
    showCommentInput: false, commentContent: '', activeMomentIndex: null
  },

  onShow() {
    const user = wx.getStorageSync('currentUser') || wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo: user });
    this.loadMoments();
  },

// 🌟 1. 首页加载时，检查我是不是点过赞
async loadMoments() {
  wx.showLoading({ title: '刷新中...' });
  try {
    let myFollows = [];
    const currentUserId = this.data.userInfo._id;
    if (currentUserId) {
      const followRes = await db.collection('follows').where({ followerId: currentUserId }).get();
      myFollows = followRes.data.map(f => f.followedId);
    }

    const res = await db.collection('moments').orderBy('createTime', 'desc').get();
    const realMoments = res.data.map(item => {
      let timeStr = '刚刚';
      if (item.createTime) {
        const d = new Date(item.createTime);
        timeStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 核心：判断我有没有在这个帖子的点赞大名单里
      const isLikedByMe = item.likedBy ? item.likedBy.includes(currentUserId) : false;

      return { ...item, time: timeStr, likes: item.likes || 0, comments: item.comments || 0, isFollowed: myFollows.includes(item.userId), isLiked: isLikedByMe };
    });
    this.setData({ moments: realMoments });
    wx.hideLoading();
  } catch(err) {
    wx.hideLoading();
    console.error(err);
  }
},

  // 🌟 核心升级：关注/取消关注 真实写进数据库
  async followAuthor(e) {
    if (!this.data.userInfo._id) return wx.showToast({ title: '登录后即可关注大佬', icon: 'none' });
    
    const index = e.currentTarget.dataset.index;
    const targetUser = this.data.moments[index];
    const isCurrentlyFollowed = targetUser.isFollowed;

    wx.showLoading({ title: '处理中...' });

    if (isCurrentlyFollowed) {
      // 取消关注：去数据库删掉记录
      const fRes = await db.collection('follows').where({ followerId: this.data.userInfo._id, followedId: targetUser.userId }).get();
      if(fRes.data.length > 0) await db.collection('follows').doc(fRes.data[0]._id).remove();
    } else {
      // 添加关注：在数据库加一条记录，顺便存下对方的头像名字，方便后面做列表
      await db.collection('follows').add({
        data: {
          followerId: this.data.userInfo._id,
          followedId: targetUser.userId,
          targetName: targetUser.name,
          targetAvatar: targetUser.avatar,
          createTime: db.serverDate()
        }
      });
    }

    // 批量更新列表里的状态
    const newMoments = this.data.moments.map(item => {
      if (item.userId === targetUser.userId) return { ...item, isFollowed: !isCurrentlyFollowed };
      return item;
    });
    this.setData({ moments: newMoments });
    wx.hideLoading();
    wx.showToast({ title: !isCurrentlyFollowed ? '已关注' : '已取消关注', icon: 'success' });
  },

  // 🌟 新增：点击头像跳入对方主页
  goToUserPage(e) {
    const targetId = e.currentTarget.dataset.userid;
    if(!targetId) return;
    wx.navigateTo({ url: `/pages/student/userMoments/userMoments?userId=${targetId}` });
  },

  // === 评论及其他基础功能保留 ===
  openComment(e) {
    if (!this.data.userInfo._id) return wx.showToast({ title: '登录后才能评论', icon: 'none' });
    this.setData({ showCommentInput: true, activeMomentIndex: e.currentTarget.dataset.index, commentContent: '' });
  },
  closeComment() { this.setData({ showCommentInput: false }); },
  handleCommentInput(e) { this.setData({ commentContent: e.detail.value }); },
  sendComment() {
    const content = this.data.commentContent.trim();
    if (!content) return wx.showToast({ title: '写点什么吧~', icon: 'none' });

    wx.showLoading({ title: '发送中...' });
    const index = this.data.activeMomentIndex;
    const moment = this.data.moments[index];
    
    const newComment = {
      name: this.data.userInfo.nickname || this.data.userInfo.name || '神秘同学',
      content: content,
      time: new Date().getTime()
    };

    db.collection('moments').doc(moment._id).update({
      data: { commentsList: db.command.push(newComment), comments: db.command.inc(1) }
    }).then(() => {
      
      // 🌟 触发通知（如果不是自己评论自己）
      if (moment.userId && moment.userId !== this.data.userInfo._id) {
        db.collection('messages').add({
          data: {
            receiverId: moment.userId,
            senderName: newComment.name,
            senderAvatar: this.data.userInfo.avatar,
            content: content,
            momentText: moment.content ? moment.content.substring(0, 15) + '...' : '分享了图片',
            createTime: db.serverDate(),
            isRead: false
          }
        });
      }

      wx.hideLoading();
      const moments = this.data.moments;
      if (!moments[index].commentsList) moments[index].commentsList = [];
      moments[index].commentsList.push(newComment);
      moments[index].comments = (moments[index].comments || 0) + 1;
      this.setData({ moments: moments, showCommentInput: false, commentContent: '' });
      wx.showToast({ title: '评论成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络开小差了', icon: 'error' });
    });
  },
  onSearch() { wx.showToast({ title: '跳转搜索', icon: 'none' }); },
  clearSearch() { this.setData({ keyword: '' }); },
  goToPublish() { 
    if(!this.data.userInfo._id) return wx.showToast({ title: '请先登录', icon: 'none' });
    wx.navigateTo({ url: '/pages/student/publish/publish' }); 
  },
  goToProfile() { wx.switchTab({ url: '/pages/student/profile/profile', fail: () => { wx.navigateTo({ url: '/pages/student/profile/profile' }); }}); },
  navToPolicy() { wx.navigateTo({ url: '/pages/policy/policy' }) },
  navToResource() { wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' }) }, 
  navToVideo() { wx.navigateTo({ url: '/pages/video/video' }) },
  navToPoints() { wx.switchTab({ url: '/pages/student/shop/shop' }) }, 
  navToSchools() { wx.navigateTo({ url: '/pages/org/org' }) },
// 🌟 升级版：首页点赞，触发消息通知
  toggleLike(e) {
    const user = this.data.userInfo;
    if (!user || !user._id) return wx.showToast({ title: '登录后即可给大佬点赞', icon: 'none' });

    const index = e.currentTarget.dataset.index;
    const moment = this.data.moments[index];
    const isCurrentlyLiked = moment.isLiked;
    
    // 1. 前端秒切状态，让用户感觉丝滑
    const keyLiked = `moments[${index}].isLiked`;
    const keyLikesCount = `moments[${index}].likes`;
    this.setData({
      [keyLiked]: !isCurrentlyLiked,
      [keyLikesCount]: isCurrentlyLiked ? (moment.likes - 1) : (moment.likes + 1)
    });
    wx.vibrateShort();

    // 2. 异步同步云端
    const _ = db.command;
    db.collection('moments').doc(moment._id).update({
      data: {
        likes: _.inc(isCurrentlyLiked ? -1 : 1),
        likedBy: isCurrentlyLiked ? _.pull(user._id) : _.push(user._id)
      }
    }).then(() => {
      
      // 🌟 3. 核心新增：如果是点赞（非取消），且不是点自己的，发消息！
      if (!isCurrentlyLiked && moment.userId && moment.userId !== user._id) {
        db.collection('messages').add({
          data: {
            type: 'like', // 明确标记这是一条点赞通知
            receiverId: moment.userId,
            senderName: user.nickname || user.name || '神秘同学',
            senderAvatar: user.avatar,
            momentText: moment.content ? moment.content.substring(0, 15) + '...' : '分享了图片',
            createTime: db.serverDate(),
            isRead: false
          }
        });
      }

    }).catch(err => console.error("点赞同步云端失败", err));
  },

 
});