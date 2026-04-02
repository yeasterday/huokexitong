Page({
  data: {
    posterImg: '', 
  },

  onLoad() {
    wx.showLoading({ title: '正在呼唤小宠物...' });
    setTimeout(() => {
      this.generatePoster();
    }, 500);
  },

  generatePoster() {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        const width = res[0].width;
        const height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // ================= 开始“画”海报 =================
        
        // 1. 大背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 2. 头部机构横幅
        ctx.fillStyle = '#673AB7'; // 你的主题紫
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('青水教育 · 词汇集训营', width / 2, 45); 

        // 3. 【核心改进】在海报中心画上宠物形象
        // 这里我放了一个可爱的恐龙图片的网络地址作为“小白测试用”
        // 真正使用时，这里应该换成学生当前选中的那个皮肤的图片
        const petImageUrl = 'https://img.icons8.com/fluent/300/kawaii-dinosaur.png'; 

        // 异步加载图片：先把图片下下来，再画到 Canvas 上
        const petImage = canvas.createImage();
        petImage.src = petImageUrl;

        // 当图片完全加载成功后，才执行里面的画图逻辑
        petImage.onload = () => {
          // 设定宠物在海报上的尺寸和位置 (居中偏上)
          const imgWidth = 180; 
          const imgHeight = 180;
          const xPos = (width - imgWidth) / 2;
          const yPos = 110; 

          // 画宠物图片
          ctx.drawImage(petImage, xPos, yPos, imgWidth, imgHeight);

          // 4. 画学生的成绩和炫耀文案 (把位置下移，避开宠物)
          ctx.fillStyle = '#333333';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('我和我的宠物一起打卡！', width / 2, yPos + imgHeight + 40);

          ctx.fillStyle = '#FF9800'; // 亮橙色
          ctx.font = 'bold 48px sans-serif';
          ctx.fillText('连胜 7 天', width / 2, yPos + imgHeight + 95);

          // 添加积分奖章的装饰 (模拟你图1的积分系统)
          ctx.beginPath();
          ctx.arc(width/2 - 70, yPos + imgHeight + 83, 10, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFC107'; // 金色
          ctx.fill();
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('🏅️', width/2 - 70, yPos + imgHeight + 86);

          // 5. 底部的【机构引流营销区】
          ctx.fillStyle = '#F4F7F9';
          ctx.fillRect(15, height - 120, width - 30, 100);

          ctx.fillStyle = '#333333';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('扫码领积分，和它一起玩', 30, height - 75); 
          
          ctx.fillStyle = '#999999';
          ctx.font = '12px sans-serif';
          ctx.fillText('青水教育：138-xxxx-xxxx', 30, height - 45);

          ctx.fillStyle = '#CCCCCC';
          ctx.fillRect(width - 90, height - 105, 70, 70);
          ctx.fillStyle = '#333333';
          ctx.textAlign = 'center';
          ctx.fillText('二维码', width - 55, height - 65);

          // ================= 画图结束 =================

          // 图片画完了，再把 Canvas 转成一张真实的图片地址用于保存
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (resImg) => {
                this.setData({ posterImg: resImg.tempFilePath });
                wx.hideLoading();
              },
              fail: (err) => {
                wx.hideLoading();
                console.error('转换海报失败', err);
              }
            });
          }, 500);
        };

        // 如果图片加载失败，要友好提示
        petImage.onerror = (err) => {
          console.error('宠物图片加载失败', err);
          wx.hideLoading();
          wx.showToast({ title: '呼唤宠物失败，请网络重试', icon: 'none' });
        };
      });
  },

  saveToAlbum() {
    if (!this.data.posterImg) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImg,
      success: () => {
        wx.showToast({ title: '荣誉已保存', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes("auth deny")) {
          wx.showModal({
            title: '提示',
            content: '需要授权保存海报',
            success: modalRes => {
              if (modalRes.confirm) wx.openSetting();
            }
          });
        }
      }
    });
  }
});