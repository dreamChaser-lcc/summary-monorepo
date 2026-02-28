# 前端网络高频面试题深度解析

本文涵盖 HTTP 协议核心机制、浏览器缓存策略、安全攻防以及网络性能优化等高频考点。

---

## 一、HTTP 协议基础

### 1. HTTP 状态码 (Status Codes)
*   **2xx (成功)**：
    *   `200 OK`：请求成功。
    *   `204 No Content`：请求成功，但无响应体（常见于 OPTIONS 预检请求）。
    *   `206 Partial Content`：断点续传/视频流，返回部分内容。
*   **3xx (重定向)**：
    *   `301 Moved Permanently`：永久重定向（浏览器会缓存，下次直接跳新地址）。
    *   `302 Found`：临时重定向。
    *   `304 Not Modified`：资源未修改，使用协商缓存。
*   **4xx (客户端错误)**：
    *   `400 Bad Request`：请求参数错误。
    *   `401 Unauthorized`：未授权（未登录）。
    *   `403 Forbidden`：禁止访问（无权限）。
    *   `404 Not Found`：资源不存在。
*   **5xx (服务端错误)**：
    *   `500 Internal Server Error`：服务器内部错误。
    *   `502 Bad Gateway`：网关错误（上游服务器报错）。
    *   `504 Gateway Timeout`：网关超时。

### 2. HTTP 1.0 vs 1.1 vs 2.0 vs 3.0
*   **HTTP 1.0**：短连接，每次请求都建立 TCP 连接。
*   **HTTP 1.1**：
    *   **长连接 (Keep-Alive)**：复用 TCP 连接。
    *   **管道化 (Pipelining)**：并发发送请求，但响应必须按顺序返回（存在队头阻塞）。
    *   **缓存控制**：引入 `Cache-Control`。
*   **HTTP 2.0**：
    *   **多路复用 (Multiplexing)**：真正的并发，通过 Stream ID 区分请求，解决了 HTTP 层面的队头阻塞。
    *   **头部压缩 (HPACK)**：压缩 Header，减少体积。
    *   **二进制传输**：解析更高效。
    *   **服务器推送 (Server Push)**。
*   **HTTP 3.0 (QUIC)**：
    *   **基于 UDP**：解决了 TCP 层面的队头阻塞（丢包重传只影响单个 Stream）。
    *   **0-RTT 连接**：建连更快。
    *   **连接迁移**：切换网络（WiFi -> 4G）不断连。

### 3. GET vs POST
*   **语义**：GET 获取资源（幂等、安全）；POST 提交资源（非幂等、不安全）。
*   **参数**：GET 参数在 URL 中（受长度限制）；POST 参数在 Body 中。
*   **缓存**：GET 可被浏览器缓存；POST 默认不缓存。
*   **数据包**：GET 产生一个 TCP 包；POST 可能产生两个（先发 Header，再发 Body，具体看浏览器实现）。

---

## 二、浏览器缓存策略 (Browser Caching)

这是性能优化的核心。缓存分为 **强缓存** 和 **协商缓存**。

### 1. 强缓存 (Strong Cache)
浏览器直接从本地读取，**不请求服务器**，状态码 200 (from memory/disk cache)。

*   **`Expires`** (HTTP/1.0)：绝对时间。依赖客户端时间，已被废弃。
*   **`Cache-Control`** (HTTP/1.1)：相对时间。优先级高于 Expires。
    *   `max-age=3600`：1小时内有效。
    *   `no-cache`：不使用强缓存，**强制走协商缓存**。
    *   `no-store`：**完全不缓存**，每次都从服务器拉取。
    *   `public` / `private`：是否允许 CDN 缓存。

### 2. 协商缓存 (Negotiation Cache)
浏览器发送请求到服务器，询问资源是否更新。如果没变，返回 **304**；变了，返回 200 和新资源。

*   **`Last-Modified` / `If-Modified-Since`**：
    *   基于文件最后修改时间。
    *   缺点：精度只能到秒；文件内容没变但修改时间变了会导致缓存失效。
*   **`ETag` / `If-None-Match`** (推荐)：
    *   基于文件内容生成的哈希值（指纹）。
    *   **优先级高于 Last-Modified**。
    *   缺点：计算 ETag 消耗服务器 CPU。

### 3. 缓存流程图
1.  浏览器请求资源。
2.  **命中强缓存** (`Cache-Control`)？ -> 是 -> **200 (Cache)**，结束。
3.  否 -> 发送请求带上 `If-None-Match` (ETag) 或 `If-Modified-Since`。
4.  **命中协商缓存** (服务器对比 ETag/时间)？ -> 是 -> **304**，读取本地缓存。
5.  否 -> **200**，返回新资源和新 ETag。

---

## 三、网络安全 (Web Security)

### 1. XSS (跨站脚本攻击)
*   **原理**：攻击者在页面注入恶意脚本（如评论区注入 `<script>`），获取用户 Cookie 或 Token。
*   **类型**：存储型（存数据库）、反射型（URL 参数）、DOM 型。
*   **防御**：
    *   **转义**：对用户输入进行 HTML 转义（React/Vue 默认开启）。
    *   **CSP (内容安全策略)**：限制脚本加载源。
    *   **HttpOnly**：Cookie 设置 HttpOnly，禁止 JS 读取。

### 2. CSRF (跨站请求伪造)
*   **原理**：诱导用户访问恶意网站，利用用户的登录状态（Cookie）自动向目标网站发送请求（如转账）。
*   **防御**：
    *   **SameSite Cookie**：设置 `Strict` 或 `Lax`，禁止第三方携带 Cookie。
    *   **CSRF Token**：请求必须携带随机 Token，攻击者拿不到。
    *   **验证 Referer**：判断请求来源。

### 3. HTTPS 原理
*   **对称加密**：传输数据（快）。
*   **非对称加密**：传输对称密钥（安全）。
*   **证书 (CA)**：防止中间人攻击。
*   **握手流程**：
    1.  Client Hello (随机数1 + 协议版本)。
    2.  Server Hello (随机数2 + 证书/公钥)。
    3.  Client 验证证书，生成预主密钥 (Pre-Master)，用公钥加密发给 Server。
    4.  Server 用私钥解密拿到预主密钥。
    5.  双方根据 (随机数1 + 随机数2 + 预主密钥) 生成会话密钥。
    6.  之后用会话密钥进行对称加密通信。

---

## 四、跨域 (CORS)

### 1. 同源策略
协议、域名、端口必须完全一致。

### 2. 解决方案
*   **CORS (跨域资源共享)**：
    *   后端设置 `Access-Control-Allow-Origin`。
    *   **简单请求** (GET/POST + 无自定义头)：直接发请求。
    *   **复杂请求** (PUT/DELETE/JSON)：先发 **OPTIONS 预检请求**，成功后再发真实请求。
*   **JSONP**：利用 `<script>` 标签不受跨域限制。只支持 GET。
*   **Nginx 反向代理**：同源策略是浏览器的限制，服务器之间通信无限制。
*   **WebSocket**：不受同源策略限制。

---

## 五、TCP/UDP

### 1. TCP 三次握手
1.  **SYN**：客户端发送连接请求。
2.  **SYN + ACK**：服务端确认并同意连接。
3.  **ACK**：客户端确认。连接建立。
*   *为什么是三次？* 防止已失效的请求报文突然传到服务端，导致服务端错误建立连接，浪费资源。

### 2. TCP 四次挥手
1.  **FIN**：客户端请求断开。
2.  **ACK**：服务端确认（此时服务端可能还有数据要发）。
3.  **FIN**：服务端发送完毕，请求断开。
4.  **ACK**：客户端确认。等待 2MSL 后关闭。

### 3. TCP vs UDP
*   **TCP**：面向连接、可靠（重传、排序、拥塞控制）、慢。用于 HTTP、FTP、邮件。
*   **UDP**：无连接、不可靠（丢包不重传）、快。用于视频会议、直播、DNS、QUIC。

---

## 六、浏览器渲染原理与网络优化 (Advanced)

### 1. TCP 并发连接限制 (Connection Limits)

*   **限制标准**：
    *   **HTTP/1.1**：现代浏览器（Chrome, Firefox, Safari, Edge）对**同一域名**的并发 TCP 连接数限制通常为 **6 个**。
    *   **HTTP/2**：虽然协议本身支持多路复用（Multiplexing），理论上一个 TCP 连接即可，但浏览器为了防止单连接拥塞，仍会保留一定的软限制（通常 > 6，视具体实现而定）。
*   **性能影响**：
    *   **队头阻塞 (Head-of-Line Blocking)**：在 HTTP/1.1 中，如果前 6 个请求被阻塞，后续请求必须排队等待，导致页面加载变慢（Waterfall 图中会有长长的灰色 Queueing 条）。
*   **优化方案**：
    1.  **域名分片 (Domain Sharding)**：将资源分散到多个子域名（如 `img1.cdn.com`, `img2.cdn.com`），突破单域名 6 个连接的限制。（*注意：HTTP/2 下不推荐，因为多域名会破坏多路复用优势，增加 DNS/TLS 开销*）。
    2.  **升级 HTTP/2**：利用多路复用，在单个 TCP 连接上并发传输，彻底解决应用层队头阻塞。
    3.  **资源合并/内联**：雪碧图 (Sprite)、Base64 图片，减少请求数量。
*   **验证方法**：
    *   Chrome DevTools -> Network -> 勾选 "Connection ID" 列。观察同一域名下的 ID 数量是否超过 6 个。

### 2. 完整网页加载渲染流程 (Critical Rendering Path)

从输入 URL 到页面展示，经历了复杂的流水线：

#### 阶段 A: URL 解析与 DNS
1.  **URL 解析**：校验合法性，HSTS 强制升级 HTTPS，Unicode 转 Punycode。
2.  **DNS 解析**：
    *   浏览器缓存 -> 系统缓存 (hosts) -> 路由器缓存 -> ISP DNS -> 根域名服务器 -> ... -> 目标 IP。
    *   **优化**：DNS Prefetch (`<link rel="dns-prefetch" href="...">`)。

#### 阶段 B: TCP/TLS 连接
1.  **TCP 握手**：3 次握手建立连接。
2.  **TLS 握手**：如果是 HTTPS，进行 SSL/TLS 握手（验证证书、协商密钥）。TLS 1.3 可降至 1 RTT。

#### 阶段 C: HTTP 请求与响应
1.  **发送请求**：构建 HTTP 报文（Header + Body）。
2.  **接收响应**：解析状态码，解压内容 (gzip/br)。

#### 阶段 D: 渲染流水线 (Rendering Pipeline)
这是浏览器内核（如 Blink, WebKit）的核心工作：
1.  **HTML -> DOM**：解析 HTML 文本，构建 DOM 树。遇到 `<script>` 会阻塞（除非 defer/async）。
2.  **CSS -> CSSOM**：解析 CSS，构建 CSSOM 树。
3.  **DOM + CSSOM -> Render Tree**：
    *   合并生成**渲染树**。
    *   **剔除**不可见节点（`display: none`, `<head>`），但**保留** `visibility: hidden`。
4.  **Layout (Reflow/回流)**：
    *   计算每个节点在屏幕上的**几何信息**（位置、大小）。
    *   *触发条件*：窗口 resize、添加/删除 DOM、修改 geometry 属性（width, left）。
5.  **Paint (Repaint/重绘)**：
    *   将节点绘制到图层（Layer）上（填充颜色、文字、边框）。
    *   *触发条件*：修改外观属性（color, background）。
6.  **Composite (合成)**：
    *   将多个图层（Layers）在 GPU 中进行合成，最终显示在屏幕上。
    *   *优化*：利用 `transform`, `opacity` 触发硬件加速，避开 Layout 和 Paint 阶段。

### 3. HTTP 预检请求 (CORS Preflight)

*   **触发条件**：当跨域请求属于**非简单请求**时，浏览器会自动先发一个 `OPTIONS` 请求。
    *   **简单请求**：GET/HEAD/POST + Content-Type (form/text) + 无自定义 Header。
    *   **非简单请求**：PUT/DELETE、Content-Type: application/json、自定义 Header (Token)。
*   **流程**：
    1.  **Browser**: 发送 `OPTIONS` 请求，带上 `Origin`, `Access-Control-Request-Method`。
    2.  **Server**: 检查权限，返回 204/200，带上 `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Max-Age`。
    3.  **Browser**: 收到许可，发送真正的业务请求。
*   **优化策略**：
    *   **设置 Max-Age**：后端设置 `Access-Control-Max-Age: 86400`，让浏览器缓存预检结果（默认只有 5 秒），避免每次都发 OPTIONS。
    *   **改为简单请求**：尽量使用 form-data 或 text/plain（不太现实）。
    *   **同域代理**：Nginx 反向代理，避开跨域。

### 4. 前端网络全链路优化策略 (Full-Stack Optimization)

除了基础协议优化，还可以从以下五个维度深度优化网络性能：

#### A. 资源加载优化 (Resource Loading)
*   **DNS 预解析 (DNS Prefetch)**：提前解析后续可能用到的域名。
    *   `<link rel="dns-prefetch" href="//example.com">`
*   **预连接 (Preconnect)**：提前进行 TCP 握手和 TLS 协商。
    *   `<link rel="preconnect" href="//cdn.example.com" crossorigin>`
*   **预加载 (Preload)**：高优先级加载当前页面急需的资源（如首屏字体、LCP 图片）。
    *   `<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>`
*   **预获取 (Prefetch)**：空闲时低优先级加载未来页面可能用到的资源。
    *   `<link rel="prefetch" href="next-page.js">`
*   **懒加载 (Lazy Loading)**：
    *   **图片**：`loading="lazy"` 或 IntersectionObserver。
    *   **路由**：React.lazy / Vue async component + 动态 `import()`。

#### B. 传输体积优化 (Payload Size)
*   **压缩算法**：**Brotli (br)** 比 Gzip 压缩率高 20%~30%，现代浏览器标配。
*   **图片格式**：使用 **WebP / AVIF** 替代 JPEG/PNG，体积可减少 30%~50%。
*   **响应式图片**：使用 `<picture>` 或 `srcset` 根据屏幕密度加载不同倍率图片。
*   **Tree Shaking**：利用 ES Modules 静态分析移除死代码。

#### C. 请求数量优化 (Request Count)
*   **HTTP/2 多路复用**：虽然解决了队头阻塞，但请求头依然有开销（HPACK 缓解）。
*   **雪碧图 (Sprite)**：减少请求头开销，仍适用于小图标。
*   **Base64 内联**：极小图片 (< 4KB) 直接转 Base64 嵌入 HTML/CSS，省去请求。
*   **接口聚合 (BFF)**：使用 Node.js 中间层将多个后端接口聚合成一个，减少 RTT。

#### D. 关键渲染路径优化 (Critical Rendering Path)
*   **内联关键 CSS (Critical CSS)**：将首屏必需样式直接写在 `<style>` 中，避免 CSS 文件下载阻塞渲染。
*   **JS 异步加载**：
    *   `defer`：下载不阻塞，解析完 HTML 后按顺序执行（**推荐**）。
    *   `async`：下载不阻塞，下载完立即执行（可能阻塞 HTML 解析，顺序不可控）。
*   **SSR (服务端渲染) / SSG**：直接返回 HTML，FCP/LCP 指标极佳。

#### E. 服务端与 CDN
*   **CDN 分发**：让用户就近获取资源，配置合理的 TTL 缓存策略。
*   **HTTP/3 (QUIC)**：在弱网（高丢包率）环境下表现远优于 TCP。
*   **Service Worker**：实现 PWA 离线缓存，拦截请求优先读取 Cache Storage。
