   App({
      onLaunch: function () {
        if (!wx.cloud) {
          console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
          wx.cloud.init({
            env: 'cloud1-7gme08b5ec029278', // 这里填你真实的云环境ID，没填对也不影响界面展示
            traceUser: true,
          });
        }
        // 确保 globalData 的初始化在这个大括号里面
        this.globalData = {};
      },
      globalData: {
        userInfo: null
      }
    });