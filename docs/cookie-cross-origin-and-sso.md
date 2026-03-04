# Cookie 跨域共享方案与 SSO 实现机制

本文档详细总结了 Cookie 在不同跨域场景下的共享方案，并深入解析了单点登录 (SSO) 中 Ticket 与 Cookie 的交互流程。

## 1. Cookie 跨域共享的三种方案

根据域名关系的亲疏程度，Cookie 的跨域共享主要分为以下三种场景：

### 1.1 同主域名下的子域名共享 (最常用)

适用于 `a.example.com` 和 `b.example.com` 之间共享登录状态。

*   **原理**：利用 Cookie 的 `domain` 属性，将其设置为父级域名。
*   **实现**：
    *   在设置 Cookie 时，指定 `domain: '.example.com'`。
    *   这样所有以 `example.com` 结尾的子域名（包括 `www`、`api`、`admin` 等）都能读取到该 Cookie。
*   **后端代码示例 (Express)**：
    ```javascript
    res.cookie('token', 'xyz123', { 
      domain: '.example.com', // 关键点：设置为父域
      path: '/', 
      httpOnly: true 
    });
    ```

### 1.2 完全跨域的接口共享 (CORS 模式)

适用于前后端分离且域名完全不同的场景（如前端 `app.com` 请求后端 `api.com`）。

*   **原理**：利用 CORS (Cross-Origin Resource Sharing) 的凭证机制。
*   **前端要求**：
    *   AJAX 请求（axios/fetch）必须设置 `withCredentials: true`。
*   **后端要求**：
    *   响应头 `Access-Control-Allow-Credentials: true`。
    *   响应头 `Access-Control-Allow-Origin` **必须指定具体域名**（如 `https://app.com`），**不能**是 `*`。
*   **Cookie 属性要求**：
    *   `SameSite=None`：允许第三方网站（前端域名）在请求中携带该 Cookie。
    *   `Secure=true`：必须在 HTTPS 协议下才能生效。

### 1.3 完全独立的域名共享 (SSO 模式)

适用于大厂全家桶（如 `baidu.com` 和 `tieba.com`），域名完全无关，无法通过上述两种方式共享。

*   **方案**：**CAS (Central Authentication Service)** 或 **OAuth2**。
*   **核心思想**：
    *   不直接共享 Cookie。
    *   通过一个中间人（SSO 认证中心）来验证身份。
    *   利用重定向（Redirect）和票据（Ticket）在不同域名间传递认证结果。

---

## 2. SSO 流程中 Ticket 与 Cookie 的交互机制

在 SSO 流程中，经常会看到 URL 中带有 `?ticket=xxx` 参数。很多开发者会困惑：**“这就完了？以后怎么保持登录？”**

答案是：**Ticket 只是敲门砖，Cookie 才是通行证。**

### 2.1 详细交互流程

假设用户要访问系统 A (`a.com`)：

1.  **重定向登录**：
    *   用户未登录，被重定向到 SSO 中心 (`sso.com`) 进行登录。
2.  **生成 Ticket**：
    *   用户在 SSO 登录成功。SSO 中心生成一个一次性票据 `ST-123456` (Service Ticket)。
    *   SSO 中心重定向回系统 A：`https://a.com/callback?ticket=ST-123456`。
3.  **验证 Ticket (后端交互)**：
    *   **浏览器**向 `a.com` 发起请求，带上 `ticket` 参数。
    *   **a.com 服务器**收到请求，提取 `ticket`。
    *   **a.com 服务器**（后台）直接向 **SSO 服务器** 发起 HTTP 请求：“这个 `ST-123456` 是真的吗？”
    *   **SSO 服务器**验证通过，返回用户信息（如 `User: John`）。
4.  **种下 Cookie (关键步骤)**：
    *   `a.com` 服务器确认用户身份合法。
    *   `a.com` 服务器生成自己的会话 ID（如 `session_id=abc`）。
    *   **在返回给浏览器的响应头 (Response Header) 中，加入 `Set-Cookie`**：
        ```http
        Set-Cookie: session_id=abc; Domain=a.com; Path=/; HttpOnly
        ```
5.  **后续访问**：
    *   浏览器收到响应，保存了 `a.com` 的 Cookie。
    *   后续用户再访问 `a.com` 的任何页面，浏览器会自动带上 `session_id=abc`，服务器鉴权通过，保持登录状态。

### 2.2 总结

| 概念 | 作用 | 生命周期 | 存储位置 |
| :--- | :--- | :--- | :--- |
| **Ticket** | **一次性入场券**。用于证明“我在 SSO 登录过了”。 | 极短，验证一次即失效 (One-Time Use)。 | URL 参数 |
| **Cookie** | **长期通行证**。用于在当前系统保持会话。 | 较长，直到过期或登出。 | 浏览器 Cookie |

通过这种机制，`ticket` 完成了它的历史使命（跨域传递身份），接力棒交给了本域的 `Cookie`（维持本地会话）。

---

## 3. Cookie、localStorage 与 sessionStorage 的区别

这三个都是浏览器端存储数据的方案，但它们的**生命周期**、**作用域**和**与服务器的交互方式**有很大区别。

### 3.1 核心区别速查表

| 特性 | Cookie | localStorage | sessionStorage |
| :--- | :--- | :--- | :--- |
| **生命周期** | 可设置过期时间 (Expires/Max-Age)<br>如果不设置，默认是**会话级** (关闭浏览器失效) | **永久有效**<br>除非手动删除或清空缓存 | **会话级**<br>关闭当前**标签页** (Tab) 即失效 |
| **存储大小** | 很小 (约 4KB) | 较大 (约 5MB) | 较大 (约 5MB) |
| **与服务器交互** | **自动发送**<br>每次 HTTP 请求都会自动带在 Header 中 | **不参与**<br>仅存储在本地，除非你手动取出放到请求里 | **不参与**<br>仅存储在本地 |
| **作用域** | 遵循同源策略，但可设置 `domain` 实现子域名共享 | 严格遵循同源策略 (协议+域名+端口) | 严格遵循同源策略，且限制在**同一标签页** |
| **操作 API** | 很难用 (`document.cookie` 是个字符串) | 简单 (`getItem`, `setItem`) | 简单 (`getItem`, `setItem`) |

### 3.2 详细讲解

#### A. Cookie (老前辈)
*   **设计初衷**：为了解决 HTTP 协议无状态的问题，让服务器知道“你是谁”。
*   **关键特点**：
    1.  **自动携带**：这是它最大的特点，也是最大的性能瓶颈。如果你在 Cookie 里存了 4KB 的数据，那你加载一张 1KB 的图片，请求头里都要带上这 4KB 的 Cookie，浪费流量。
    2.  **HttpOnly**：设置为 `true` 后，JS 无法读取（`document.cookie` 读不到），能有效防御 XSS 攻击窃取 Token。
*   **适用场景**：
    *   存储 **Session ID** 或 **Token**（身份认证）。
    *   跨子域名共享登录状态。

#### B. localStorage (持久化存储)
*   **设计初衷**：为了在客户端存储大量数据，且不影响网络请求。
*   **关键特点**：
    1.  **持久性**：除非用户手动清理浏览器缓存，否则数据永远都在。
    2.  **同源共享**：只要是同一个域名（如 `www.example.com`），开多个标签页、关掉浏览器再打开，数据都是共享的。
*   **适用场景**：
    *   存储用户偏好设置（如：夜间模式、语言设置）。
    *   存储购物车数据（未登录状态）。
    *   缓存一些不常变动的静态数据（如省市区列表）。

#### C. sessionStorage (临时会话)
*   **设计初衷**：为了在**单次会话**中存储数据。
*   **关键特点**：
    1.  **标签页隔离**：这是它最独特的点。即使是同一个域名，你在 Tab A 里存的数据，Tab B 里是**看！不！到！的！**（除非 Tab B 是通过 Tab A 的 `window.open` 打开的）。
    2.  **关闭即焚**：关掉标签页，数据瞬间清空。
*   **适用场景**：
    *   表单分步填写（Step 1 -> Step 2 -> Step 3），防止用户刷新丢失数据。
    *   敏感的临时数据（如银行网页，关闭标签页后不留痕迹）。

### 3.3 代码示例

**操作 localStorage/sessionStorage:**
```javascript
// 存
localStorage.setItem('theme', 'dark');
sessionStorage.setItem('tempId', '123');

// 取
const theme = localStorage.getItem('theme');

// 删
localStorage.removeItem('theme');
localStorage.clear(); // 全删
```

**操作 Cookie (原生):**
```javascript
// 存 (非常麻烦，通常用 js-cookie 库)
document.cookie = "username=John; expires=Thu, 18 Dec 2023 12:00:00 UTC; path=/";

// 取 (由于拿到的是一长串字符串，需要自己解析)
const cookies = document.cookie.split(';');
```

### 3.4 总结
*   要存**Token**？首选 **Cookie (HttpOnly)**，其次 localStorage。
*   要存**配置/缓存**？用 **localStorage**。
*   要存**临时状态**？用 **sessionStorage**。
