Page({
  data: {
    latitude: '',
    longitude: '',
    ifFirstAuth: true,     // 是否第一次授权
    ifAuthorized: false    // 是否通过授权
  },
  onGetLocation() {
    // 第一次授权
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('授权成功')
        this.setLocation()
      },
      fail: () => {
        console.log('授权失败')
        // 二次授权
        wx.showModal({
          title: '提示',
          content: '请授权获取您的位置信息，你的位置信息将用于...',
          success: res => {
            if (res.confirm) {
              wx.openSetting({
                success: res => {
                  if (res.authSetting['scope.userLocation']) {
                    console.log('二次授权成功')
                    this.setLocation()
                  } else {
                    console.log('二次授权失败')
                  }
                }
              })
            } else {
              console.log('二次授权失败')
            }
          }
        })
      }
    })
  },
  // 获取位置信息
  setLocation() {
    wx.getLocation({
      success: res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      }
    })
  },
  // 首次授权/授权通过
  onGetLocation2() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('授权成功')
        this.setData({
          ifFirstAuth: false,
          ifAuthorized: true
        })
        this.setLocation()
      },
      fail: () => {
        console.log('授权失败')
        this.setData({
          ifFirstAuth: false
        })
      }
    })
  },
  // 二次授权
  onOpenSetting(e) {
    if (e.detail.authSetting['scope.userLocation']) {
      console.log('二次授权成功')
      this.setData({
        ifAuthorized: true
      })
      this.setLocation()
    } else {
      console.log('二次授权失败')
    }
  }
})