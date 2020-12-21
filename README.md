# 微信小程序用户授权

以 `scope.userLocation` 获取用户位置信息为例，演示小程序授权的多种方式。

## 设置 permission

对于授权 `scope.userLocation` 和 `scope.userLocationBackground`，应该在 `app.json` 中配置地理位置用途说明：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于..."
    }
  }
}
```

## 何时授权

不建议在刚进入页面时就进行授权，当真正需要某个权限时，才通过用户交互，例如点击按钮，触发授权（小程序审核严格时，立即授权可能审核不通过）。

## wx.authorize 授权

创建一个获取位置信息的按钮，当点击按钮时，调用 `wx.authorize` 进行授权，如果用户授权通过，获取位置信息：

```html
<!-- index.wxml -->
<view>
  <view>纬度：{{latitude}}</view>
  <view>经度：{{longitude}}</view>
  <button type="primary" bindtap="onGetLocation">获取位置信息</button>
</view>
```

```js
Page({
  data: {
    latitude: '',
    longitude: '',
  },
  onGetLocation() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('授权成功')
        this.setLocation()
      },
      fail: () => {
        console.log('授权失败')
      }
    })
  },
  setLocation() {
    wx.getLocation({
      success: res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      }
    })
  }
})
```

> 注意：`wx.authorize({ scope: 'scope.userInfo' })`，不会弹出授权窗口，需要使用 `<button open-type="getUserInfo"></button>`

## 二次授权

`wx.authorize` 只会在第一次授权时调用授权弹窗，当用户通过授权或者拒绝授权之后，将不会再调用弹窗，如果授权通过会直接调用 `success` 函数，如果拒绝授权，则直接调用 `fail` 函数。因此还需要处理用户第一次授权时拒绝的情况，进行二次授权。

二次授权可以通过 `wx.openSetting` 或者 `<button open-type="openSetting"></button>` 调用小程序设置界面，不过需要注意基础版本库和适用场景。

> 注意：小程序设置界面只会出现小程序已经向用户请求过的权限，因此，需要先调用 `wx.authorize` 请求授权。

### `wx.openSetting`

* 基础版版本小于 2.0.7，可以直接调用 `wx.openSetting` 打开授权页

* 基础库 2.3.2 以后（官方说是 2.3.0，实测是 2.3.2），需要用户交互行为触发，例如点击 `button` 或者 `wx.showModal` 触发

* 基础库在 2.0.7 和 2.3.1 之间，只能通过点击 button 触发，不能通过 `wx.showModal` 触发

### `<button open-type="openSetting"></button>`

基础库版本从 2.0.9 开始（官方说是 2.0.7），`button` 支持使用 `open-type="openSetting"` 打开授权页

### 最佳实践

* 使用 `wx.openSetting`，如果不考虑兼容 2.3.2 以前的版本（注意在公众号后台设置最低基础版本库，用户低于该版本会提示更新微信），可以用 `wx.showModal` 触发二次授权；如果考虑兼容兼容 2.0.7 到 2.3.1 之前的版本，则需要通过 `button` 触发。

* 使用 `<button open-type="openSetting"></button>`，基础库版本不能低于 2.0.9。该按钮点击会打开授权页，如果调用 `wx.authorize` 进行第一次授权或者用户已经授权，应该隐藏该按钮，并创建另外一个用于第一次授权和用户已经授权的功能按钮。更推荐的做法是，创建一个单独的授权页，授权页中创建授权按钮，当用户没有授权时，则跳转到该页面，这种方式有另外一种好处，当小程序中多处需要授权时，可以复用该页面。

## 示例代码

### `wx.openSetting`

```html
<!-- index.wxml -->
<view>
  <view class="p">纬度：{{latitude}}</view>
  <view class="p">经度：{{longitude}}</view>
  <button type="primary" bindtap="onGetLocation">获取位置信息</button>
</view>
```

```js
// index.js
Page({
  data: {
    latitude: '',
    longitude: ''
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
  }
})
```

### `<button open-type="openSetting"></button>`

```html
<!-- index.wxml -->
<view>
  <view class="p">纬度：{{latitude}}</view>
  <view class="p">经度：{{longitude}}</view>
  <button wx:if="{{ifFirstAuth || ifAuthorized}}" type="primary" bindtap="onGetLocation2">获取位置信息1</button>
  <button wx:else type="primary" open-type="openSetting" bindopensetting="onOpenSetting">获取位置信息2</button>
</view>
```

```js
// index.js
Page({
  data: {
    latitude: '',
    longitude: '',
    ifFirstAuth: true,      // 是否第一次授权
    ifAuthorized: false     // 是否通过授权
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
  }
})
```

这里根据授权状态，显示两个不同按钮，通过创建授权页的方式省略。





