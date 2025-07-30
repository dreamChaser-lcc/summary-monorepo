import axios from 'axios';

class WebSocketClient {
  constructor(config, events) {
    this.ws = null;
    this.events = {};
    this.state = "disconnected" /* DISCONNECTED */;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    // 消息队列
    this.messageQueue = [];
    this.pendingMessages = /* @__PURE__ */ new Map();
    this.failedQueue = [];
    this.retryTimer = null;
    this.config = {
      reconnectInterval: 3e3,
      maxReconnectAttempts: 5,
      heartbeatInterval: 3e4,
      messageTimeout: 1e4,
      maxRetryCount: 3,
      retryDelay: 2e3,
      enableHeartbeat: true,
      enableQueue: true,
      debug: false,
      protocols: void 0,
      ...config
    };
    this.events = events || {};
    this.log("WebSocket \u5BA2\u6237\u7AEF\u521D\u59CB\u5316\u5B8C\u6210");
  }
  /**
   * 连接 WebSocket
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.log("\u5F00\u59CB\u8FDE\u63A5 WebSocket:", this.config.url);
        this.setState("connecting" /* CONNECTING */);
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        this.ws.onopen = (event) => {
          this.log("WebSocket \u8FDE\u63A5\u6210\u529F");
          this.setState("connected" /* CONNECTED */);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.processFailedQueue();
          this.events.onOpen?.(event);
          resolve();
        };
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
        this.ws.onerror = (event) => {
          this.log("WebSocket \u9519\u8BEF:", event);
          this.events.onError?.(event);
          reject(new Error("WebSocket \u8FDE\u63A5\u5931\u8D25"));
        };
        this.ws.onclose = (event) => {
          this.log("WebSocket \u8FDE\u63A5\u5173\u95ED:", event.code, event.reason);
          this.setState("disconnected" /* DISCONNECTED */);
          this.stopHeartbeat();
          this.events.onClose?.(event);
          if (event.code !== 1e3 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.setState("failed" /* FAILED */);
            this.events.onMaxReconnectReached?.();
          }
        };
      } catch (error) {
        this.log("\u8FDE\u63A5\u5931\u8D25:", error);
        reject(error);
      }
    });
  }
  /**
   * 断开连接
   */
  disconnect() {
    this.log("\u4E3B\u52A8\u65AD\u5F00 WebSocket \u8FDE\u63A5");
    this.clearTimers();
    if (this.ws) {
      this.ws.close(1e3, "\u4E3B\u52A8\u65AD\u5F00");
      this.ws = null;
    }
    this.setState("disconnected" /* DISCONNECTED */);
  }
  /**
   * 发送消息
   */
  async send(type, data) {
    const message = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now()
    };
    return new Promise((resolve, reject) => {
      if (this.state !== "connected" /* CONNECTED */) {
        if (this.config.enableQueue) {
          this.log("\u8FDE\u63A5\u672A\u5C31\u7EEA\uFF0C\u6D88\u606F\u52A0\u5165\u961F\u5217:", message.id);
          this.messageQueue.push(message);
          this.pendingMessages.set(message.id, { resolve, reject, timer: setTimeout(() => {
            this.pendingMessages.delete(message.id);
            reject(new Error("\u6D88\u606F\u53D1\u9001\u8D85\u65F6"));
          }, this.config.messageTimeout) });
          return;
        } else {
          reject(new Error("WebSocket \u672A\u8FDE\u63A5"));
          return;
        }
      }
      try {
        this.ws.send(JSON.stringify(message));
        this.log("\u6D88\u606F\u53D1\u9001\u6210\u529F:", message.id, type);
        const timer = setTimeout(() => {
          this.pendingMessages.delete(message.id);
          reject(new Error("\u6D88\u606F\u54CD\u5E94\u8D85\u65F6"));
        }, this.config.messageTimeout);
        this.pendingMessages.set(message.id, { resolve, reject, timer });
      } catch (error) {
        this.log("\u6D88\u606F\u53D1\u9001\u5931\u8D25:", error);
        this.addToFailedQueue(message);
        reject(error);
      }
    });
  }
  /**
   * 发送不需要响应的消息
   */
  sendNoResponse(type, data) {
    const message = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now()
    };
    if (this.state !== "connected" /* CONNECTED */) {
      if (this.config.enableQueue) {
        this.messageQueue.push(message);
        return;
      } else {
        throw new Error("WebSocket \u672A\u8FDE\u63A5");
      }
    }
    try {
      this.ws.send(JSON.stringify(message));
      this.log("\u5355\u5411\u6D88\u606F\u53D1\u9001\u6210\u529F:", message.id, type);
    } catch (error) {
      this.log("\u5355\u5411\u6D88\u606F\u53D1\u9001\u5931\u8D25:", error);
      this.addToFailedQueue(message);
      throw error;
    }
  }
  /**
   * 处理接收到的消息
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.log("\u6536\u5230\u6D88\u606F:", message.id, message.type);
      if (message.type === "pong") {
        return;
      }
      if (this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id);
        clearTimeout(pending.timer);
        this.pendingMessages.delete(message.id);
        pending.resolve(message.data);
        return;
      }
      this.events.onMessage?.(message);
    } catch (error) {
      this.log("\u6D88\u606F\u89E3\u6790\u5931\u8D25:", error);
    }
  }
  /**
   * 重连机制
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectAttempts++;
    this.setState("reconnecting" /* RECONNECTING */);
    this.log(`\u51C6\u5907\u7B2C ${this.reconnectAttempts} \u6B21\u91CD\u8FDE...`);
    this.reconnectTimer = setTimeout(async () => {
      try {
        this.events.onReconnect?.(this.reconnectAttempts);
        await this.connect();
      } catch (error) {
        this.log("\u91CD\u8FDE\u5931\u8D25:", error);
      }
    }, this.config.reconnectInterval);
  }
  /**
   * 心跳机制
   */
  startHeartbeat() {
    if (!this.config.enableHeartbeat) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.state === "connected" /* CONNECTED */) {
        this.sendNoResponse("ping", { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  /**
   * 处理消息队列
   */
  processMessageQueue() {
    if (!this.config.enableQueue || this.messageQueue.length === 0) return;
    this.log(`\u5904\u7406\u6D88\u606F\u961F\u5217\uFF0C\u5171 ${this.messageQueue.length} \u6761\u6D88\u606F`);
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    queue.forEach((message) => {
      try {
        this.ws.send(JSON.stringify(message));
        this.log("\u961F\u5217\u6D88\u606F\u53D1\u9001\u6210\u529F:", message.id);
      } catch (error) {
        this.log("\u961F\u5217\u6D88\u606F\u53D1\u9001\u5931\u8D25:", error);
        this.addToFailedQueue(message);
      }
    });
  }
  /**
   * 失败队列处理
   */
  addToFailedQueue(message) {
    const retryCount = (message.retryCount || 0) + 1;
    if (retryCount <= this.config.maxRetryCount) {
      this.failedQueue.push({
        message: { ...message, retryCount },
        retryCount,
        lastAttempt: Date.now()
      });
      this.log(`\u6D88\u606F\u52A0\u5165\u5931\u8D25\u961F\u5217\uFF0C\u91CD\u8BD5\u6B21\u6570: ${retryCount}/${this.config.maxRetryCount}`);
      this.scheduleRetry();
    } else {
      this.log("\u6D88\u606F\u91CD\u8BD5\u6B21\u6570\u8D85\u9650\uFF0C\u4E22\u5F03:", message.id);
    }
  }
  scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.processFailedQueue();
      this.retryTimer = null;
    }, this.config.retryDelay);
  }
  processFailedQueue() {
    if (this.failedQueue.length === 0 || this.state !== "connected" /* CONNECTED */) return;
    this.log(`\u5904\u7406\u5931\u8D25\u961F\u5217\uFF0C\u5171 ${this.failedQueue.length} \u6761\u6D88\u606F`);
    const queue = [...this.failedQueue];
    this.failedQueue = [];
    queue.forEach((item) => {
      try {
        this.ws.send(JSON.stringify(item.message));
        this.log("\u5931\u8D25\u961F\u5217\u6D88\u606F\u91CD\u8BD5\u6210\u529F:", item.message.id);
      } catch (error) {
        this.log("\u5931\u8D25\u961F\u5217\u6D88\u606F\u91CD\u8BD5\u5931\u8D25:", error);
        this.addToFailedQueue(item.message);
      }
    });
  }
  /**
   * 状态管理
   */
  setState(state) {
    if (this.state !== state) {
      this.state = state;
      this.log("\u72B6\u6001\u53D8\u66F4:", state);
      this.events.onStateChange?.(state);
    }
  }
  /**
   * 工具方法
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
  log(...args) {
    if (this.config.debug) {
      console.log("[WebSocket]", ...args);
    }
  }
  /**
   * 获取状态信息
   */
  getState() {
    return this.state;
  }
  getQueueInfo() {
    return {
      messageQueue: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
      failedQueue: this.failedQueue.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }
  /**
   * 清空队列
   */
  clearQueues() {
    this.messageQueue = [];
    this.failedQueue = [];
    this.pendingMessages.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new Error("\u961F\u5217\u5DF2\u6E05\u7A7A"));
    });
    this.pendingMessages.clear();
    this.log("\u6240\u6709\u961F\u5217\u5DF2\u6E05\u7A7A");
  }
}

class ConcurrencyManager {
  constructor(maxConcurrent = 10) {
    this.pending = /* @__PURE__ */ new Map();
    this.currentRequests = 0;
    this.queue = [];
    this.maxConcurrent = maxConcurrent;
  }
  // 生成请求唯一标识
  generateRequestKey(config) {
    const { method, url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }
  // 取消重复请求
  cancelDuplicateRequest(config) {
    const requestKey = this.generateRequestKey(config);
    if (this.pending.has(requestKey)) {
      const controller2 = this.pending.get(requestKey);
      controller2.abort("\u53D6\u6D88\u91CD\u590D\u8BF7\u6C42");
      this.pending.delete(requestKey);
    }
    const controller = new AbortController();
    config.signal = controller.signal;
    this.pending.set(requestKey, controller);
  }
  // 移除已完成的请求
  removePendingRequest(config) {
    const requestKey = this.generateRequestKey(config);
    this.pending.delete(requestKey);
  }
  // 并发控制
  async controlConcurrency(requestFn) {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        if (this.currentRequests >= this.maxConcurrent) {
          this.queue.push(executeRequest);
          return;
        }
        this.currentRequests++;
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.currentRequests--;
          if (this.queue.length > 0) {
            const nextRequest = this.queue.shift();
            nextRequest();
          }
        }
      };
      executeRequest();
    });
  }
  // 取消所有待处理的请求
  cancelAllRequests() {
    this.pending.forEach((controller) => {
      controller.abort("\u53D6\u6D88\u6240\u6709\u8BF7\u6C42");
    });
    this.pending.clear();
    this.queue.length = 0;
  }
}
class HttpClient {
  constructor(config = {}) {
    this.defaultConfig = {
      timeout: 1e4,
      retry: 3,
      retryDelay: 1e3,
      showLoading: false,
      ...config
    };
    this.concurrencyManager = new ConcurrencyManager(10);
    this.instance = axios.create(this.defaultConfig);
    this.setupInterceptors();
  }
  // 设置拦截器
  setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        this.concurrencyManager.cancelDuplicateRequest(config);
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.metadata = { startTime: Date.now() };
        if (config.showLoading) {
          this.showLoading();
        }
        console.log(`\u{1F680} \u8BF7\u6C42\u53D1\u9001: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error("\u274C \u8BF7\u6C42\u914D\u7F6E\u9519\u8BEF:", error);
        return Promise.reject(error);
      }
    );
    this.instance.interceptors.response.use(
      (response) => {
        const config = response.config;
        this.concurrencyManager.removePendingRequest(config);
        if (config.showLoading) {
          this.hideLoading();
        }
        const duration = config.metadata?.startTime ? Date.now() - config.metadata.startTime : 0;
        console.log(`\u2705 \u8BF7\u6C42\u6210\u529F: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`);
        return this.handleResponse(response);
      },
      async (error) => {
        const config = error.config;
        if (config) {
          this.concurrencyManager.removePendingRequest(config);
          if (config.showLoading) {
            this.hideLoading();
          }
        }
        return this.handleError(error);
      }
    );
  }
  // 处理响应数据
  handleResponse(response) {
    const { data } = response;
    if (response.headers["content-type"]?.includes("application/octet-stream")) {
      return response;
    }
    if (data && typeof data === "object") {
      if (data.code !== void 0) {
        if (data.code === 200 || data.success) {
          return data.data !== void 0 ? data.data : data;
        } else {
          throw new Error(data.message || "\u8BF7\u6C42\u5931\u8D25");
        }
      }
    }
    return data;
  }
  // 错误处理
  async handleError(error) {
    const config = error.config;
    if (axios.isCancel(error)) {
      console.log("\u{1F4CB} \u8BF7\u6C42\u5DF2\u53D6\u6D88:", error.message);
      return Promise.reject(error);
    }
    if (config && this.shouldRetry(error, config)) {
      return this.retryRequest(config);
    }
    if (config?.skipErrorHandler) {
      return Promise.reject(error);
    }
    this.handleGlobalError(error);
    return Promise.reject(error);
  }
  // 判断是否应该重试
  shouldRetry(error, config) {
    if (!config.retry || config.retry <= 0) return false;
    const retryableErrors = [
      "ECONNABORTED",
      // 超时
      "ENOTFOUND",
      // 网络错误
      "ECONNREFUSED",
      // 连接被拒绝
      "ETIMEDOUT"
      // 超时
    ];
    return !error.response || // 网络错误
    error.response.status >= 500 || // 服务器错误
    retryableErrors.includes(error.code || "");
  }
  // 重试请求
  async retryRequest(config) {
    config.retry = (config.retry || 0) - 1;
    const delay = config.retryDelay || 1e3;
    console.log(`\u{1F504} ${delay}ms \u540E\u91CD\u8BD5\u8BF7\u6C42, \u5269\u4F59\u91CD\u8BD5\u6B21\u6570: ${config.retry}`);
    await this.sleep(delay);
    return this.instance.request(config);
  }
  // 全局错误处理
  handleGlobalError(error) {
    const { response, message } = error;
    if (response) {
      const { status, data } = response;
      switch (status) {
        case 401:
          console.error("\u{1F510} \u672A\u6388\u6743\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
          this.handleUnauthorized();
          break;
        case 403:
          console.error("\u{1F6AB} \u6743\u9650\u4E0D\u8DB3");
          break;
        case 404:
          console.error("\u{1F50D} \u8BF7\u6C42\u7684\u8D44\u6E90\u4E0D\u5B58\u5728");
          break;
        case 500:
          console.error("\u{1F4A5} \u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF");
          break;
        default:
          console.error(`\u274C \u8BF7\u6C42\u9519\u8BEF ${status}:`, data?.message || message);
      }
    } else {
      console.error("\u{1F310} \u7F51\u7EDC\u9519\u8BEF:", message);
    }
  }
  // 处理未授权
  handleUnauthorized() {
    this.removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  // Token 管理
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    }
    return null;
  }
  removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }
  // 加载状态管理
  showLoading() {
    console.log("\u{1F504} \u663E\u793A\u52A0\u8F7D\u72B6\u6001");
  }
  hideLoading() {
    console.log("\u2728 \u9690\u85CF\u52A0\u8F7D\u72B6\u6001");
  }
  // 工具方法
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // 公共请求方法
  async request(config) {
    return this.concurrencyManager.controlConcurrency(
      () => this.instance.request(config)
    );
  }
  async get(url, config) {
    return this.request({ ...config, method: "GET", url });
  }
  async post(url, data, config) {
    return this.request({ ...config, method: "POST", url, data });
  }
  async put(url, data, config) {
    return this.request({ ...config, method: "PUT", url, data });
  }
  async delete(url, config) {
    return this.request({ ...config, method: "DELETE", url });
  }
  async patch(url, data, config) {
    return this.request({ ...config, method: "PATCH", url, data });
  }
  // 并发请求
  async all(requests) {
    return Promise.all(requests);
  }
  // 文件上传
  async upload(url, file, config) {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append("file", file);
    }
    return this.post(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...config?.headers
      }
    });
  }
  async download(url, filenameOrConfig, config) {
    let filename;
    let requestConfig;
    if (typeof filenameOrConfig === "string") {
      filename = filenameOrConfig;
      requestConfig = config;
    } else {
      requestConfig = filenameOrConfig;
    }
    const response = await this.request({
      ...requestConfig,
      url,
      method: "GET",
      responseType: "blob"
    });
    const blob = new Blob([response.data]);
    if (filename && typeof window !== "undefined") {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      return;
    }
    return blob;
  }
  // 设置认证 Token
  setAuthToken(token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    this.instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  // 清除认证 Token
  clearAuthToken() {
    this.removeToken();
    delete this.instance.defaults.headers.common["Authorization"];
  }
  // 取消所有请求
  cancelAllRequests() {
    this.concurrencyManager.cancelAllRequests();
  }
  // 设置默认配置
  setDefaultConfig(config) {
    Object.assign(this.defaultConfig, config);
    Object.assign(this.instance.defaults, config);
  }
  // 添加请求拦截器
  addRequestInterceptor(onFulfilled, onRejected) {
    return this.instance.interceptors.request.use(onFulfilled, onRejected);
  }
  // 添加响应拦截器
  addResponseInterceptor(onFulfilled, onRejected) {
    return this.instance.interceptors.response.use(onFulfilled, onRejected);
  }
}
new HttpClient({
  baseURL: process.env.NODE_ENV === "development" ? "http://localhost:3000/api" : "https://api.example.com",
  timeout: 1e4,
  retry: 3,
  retryDelay: 1e3
});

export { HttpClient, WebSocketClient };
