const db = wx.cloud.database();

Page({
  data: {
    content: '',
    images: [], // 本地图片路径数组
    isPublishing: false // 防止用户狂点发布按钮
  },

  // 记录输入的文字
  handleInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 点击加号，从手机相册选图
  chooseImage() {
    const remainCount = 9 - this.data.images.length;
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: this.data.images.concat(tempFiles)
        });
      }
    });
  },

  // 删除已选的图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    let newImages = this.data.images;
    newImages.splice(index, 1);
    this.setData({ images: newImages });
  },

  // 点击图片可以放大预览
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.images });
  },

  // 核心：发表动态
  async submitPost() {
    // 1. 校验内容不能为空
    if (!this.data.content.trim() && this.data.images.length === 0) {
      return wx.showToast({ title: '总得写点什么吧~', icon: 'none' });
    }

    this.setData({ isPublishing: true });
    wx.showLoading({ title: '正在发布中...', mask: true });

    try {
      const user = wx.getStorageSync('currentUser') || {};
      let cloudImageUrls = [];

      // 2. 如果有图片，先把图片传到云存储
      if (this.data.images.length > 0) {
        cloudImageUrls = await this.uploadImagesToCloud(this.data.images);
      }

      // 3. 把最终的文字、云端图片链接、用户信息存到数据库里的 moments 表
      await db.collection('moments').add({
        data: {
          content: this.data.content,
          images: cloudImageUrls,
          userId: user._id || 'guest',
          name: user.name || '匿名同学',
          avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
          likes: 0,
          comments: 0,
          createTime: db.serverDate() // 记录发布时间
        }
      });

      // 4. 发布成功，返回首页
      wx.hideLoading();
      wx.showToast({ title: '发布成功！', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack(); // 退回首页
      }, 1500);

    } catch (err) {
      wx.hideLoading();
      console.error("发布失败", err);
      wx.showToast({ title: '发布失败，请重试', icon: 'error' });
      this.setData({ isPublishing: false });
    }
  },

  // 封装的批量上传图片工具函数
  uploadImagesToCloud(localPathArray) {
    const uploadTasks = localPathArray.map(filePath => {
      // 随机生成一个文件名，避免重名覆盖
      const suffix = filePath.match(/\.[^.]+?$/)[0] || '.png';
      const cloudPath = `moments/${Date.now()}_${Math.floor(Math.random() * 1000)}${suffix}`;
      
      return wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      }).then(res => res.fileID); // 上传成功后返回在云端的真实链接(fileID)
    });

    // 等待所有图片上传完成
    return Promise.all(uploadTasks);
  }
});