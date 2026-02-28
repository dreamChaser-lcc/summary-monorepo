# 微信小程序高频面试考点总结

本文总结微信小程序开发中常见的核心概念、架构原理及优化方案。

## 一、核心架构原理

### 1. 双线程模型 (Dual Thread Model)
这是小程序与 Web 开发最大的不同点。
*   **渲染层 (Rendering View)**：
    *   使用 **WebView** 渲染 WXML 和 WXSS。
    *   每个页面对应一个 WebView 线程。
*   **逻辑层 (App Service)**：
    *   使用 **JSCore** (iOS/Android) 或 **V8** (开发者工具) 运行 JS 代码。
    *   只有一个 AppService 线程，处理所有页面的逻辑。
*   **通信机制**：
    *   两个线程之间不共享数据。
    *   通信通过 **Native (微信客户端)** 进行中转。
    *   `setData` 的过程：逻辑层数据 -> Native -> 渲染层 -> DOM Diff -> 渲染。
*   **考点**：为什么 `setData` 不能太频繁？为什么不能传递大数据？（因为通信需要序列化和跨进程传输，成本高）

### 2. 生命周期 (Lifecycle)
*   **App 生命周期**：`onLaunch` (初始化), `onShow` (切前台), `onHide` (切后台)。
*   **Page 生命周期**：
    *   `onLoad`: 页面加载（一次）。
    *   `onShow`: 页面显示（每次）。
    *   `onReady`: 初次渲染完成（可操作 Canvas/DOM）。
    *   `onHide`: 页面隐藏。
    *   `onUnload`: 页面卸载（注意清理定时器）。
*   **Component 生命周期**：
    *   `created`: 组件实例刚刚被创建。
    *   `attached`: 组件实例进入页面节点树（最常用，类似 mounted）。
    *   `ready`: 视图布局完成。
    *   `detached`: 组件实例被从页面节点树移除。

### 3. `setData` 优化
*   **原理**：`setData` 是异步的（逻辑层），但在渲染层是同步更新的。
*   **优化策略**：
    1.  **减少频率**：合并多次 `setData`。
    2.  **减少数据量**：只传递变化的数据，不要一把梭 `setData({ list: allList })`，而是 `setData({ 'list[0]': newItem })`。
    3.  **避免后台页面 `setData`**：页面 `onHide` 后暂停数据更新。

---

## 二、常见开发场景

### 1. 登录流程 (Login Flow)
*   **核心 API**：`wx.login()` 获取 `code`。
*   **流程**：
    1.  前端调用 `wx.login()` 拿到临时登录凭证 `code`。
    2.  前端发送 `code` 给后端。
    3.  后端调用微信接口 `jscode2session`，换取 `openid` (用户唯一标识) 和 `session_key`。
    4.  后端生成自定义 Token 返回给前端。
    5.  前端存储 Token，后续请求带上。

### 2. 支付流程 (Payment)
1.  用户点击下单，前端请求后端创建订单。
2.  后端调用微信统一下单接口，获取 `prepay_id` 等支付参数。
3.  后端对参数进行签名（PaySign），返回给前端。
4.  前端调用 `wx.requestPayment(params)` 唤起微信支付。
5.  用户支付，微信服务器回调后端通知支付结果。

### 3. 分包加载 (Subpackages)
*   **作用**：突破小程序主包 2MB 的限制（总积体限制 20MB），加快首屏启动速度。
*   **类型**：
    *   **主包**：包含启动页、TabBar 页面和公共资源。
    *   **分包**：按功能模块划分，用户进入特定页面时才下载。
    *   **独立分包**：不依赖主包即可运行（用于广告页、活动页）。
*   **分包预下载**：在进入主包页面时，悄悄下载分包资源。

### 4. 页面通信 (Communication)
*   **父子组件**：`properties` (父传子), `triggerEvent` (子传父), `selectComponent` (父调子)。
*   **页面跳转**：URL 参数传递 (`wx.navigateTo({ url: 'path?id=1' })`)。
*   **全局数据**：`App.globalData`。
*   **事件总线**：手写 `EventBus` 或使用第三方库。
*   **本地存储**：`wx.setStorage` / `wx.getStorage`。

---

## 三、高频面试题

### 1. `wx.navigateTo` vs `wx.redirectTo` vs `wx.switchTab`
*   `navigateTo`: 保留当前页面，跳转到应用内的某个页面（入栈，最多 10 层）。
*   `redirectTo`: 关闭当前页面，跳转到应用内的某个页面（替换当前栈）。
*   `switchTab`: 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面。
*   `reLaunch`: 关闭所有页面，打开到应用内的某个页面。

### 2. 小程序与 H5 的区别？
*   **运行环境**：小程序是双线程（Native + WebView），H5 是单线程（浏览器）。
*   **开发权限**：小程序能调用 Native API（蓝牙、定位、扫码），H5 受限。
*   **更新机制**：小程序有审核机制，H5 随时发布。
*   **体验**：小程序有离线缓存和预加载，体验接近原生 App。

### 3. 如何实现自定义 TabBar？
*   在 `app.json` 中配置 `custom: true`。
*   在根目录创建 `custom-tab-bar` 目录。
*   编写组件代码，手动管理选中态（注意：需要在每个 Tab 页面的 `onShow` 中更新选中态）。

### 4. 小程序的 updateManager
*   检查版本更新：`const updateManager = wx.getUpdateManager()`。
*   `onCheckForUpdate`: 监听是否有新版本。
*   `onUpdateReady`: 新版本下载完成，调用 `applyUpdate` 强制重启应用新版本。
