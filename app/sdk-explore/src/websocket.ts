/**
 * WebSocket 封装类
 * 支持重连、心跳、消息队列、失败重试等功能
 */

// 消息类型定义
export interface WSMessage {
  id: string
  type: string
  data: any
  timestamp: number
  retryCount?: number
}

// WebSocket 配置
export interface WSConfig {
  url: string
  protocols?: string | string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  messageTimeout?: number
  maxRetryCount?: number
  retryDelay?: number
  enableHeartbeat?: boolean
  enableQueue?: boolean
  debug?: boolean
}

// 连接状态
export enum WSConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

// 事件类型
export interface WSEvents {
  onOpen?: (event: Event) => void
  onMessage?: (message: WSMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  onStateChange?: (state: WSConnectionState) => void
  onReconnect?: (attempt: number) => void
  onMaxReconnectReached?: () => void
}

// 失败队列项
interface FailedQueueItem {
  message: WSMessage
  retryCount: number
  lastAttempt: number
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: Required<WSConfig>
  private events: WSEvents = {}
  private state: WSConnectionState = WSConnectionState.DISCONNECTED
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  
  // 消息队列
  private messageQueue: WSMessage[] = []
  private pendingMessages = new Map<string, { resolve: Function; reject: Function; timer: NodeJS.Timeout }>()
  private failedQueue: FailedQueueItem[] = []
  private retryTimer: NodeJS.Timeout | null = null

  constructor(config: WSConfig, events?: WSEvents) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      messageTimeout: 10000,
      maxRetryCount: 3,
      retryDelay: 2000,
      enableHeartbeat: true,
      enableQueue: true,
      debug: false,
      protocols: undefined,
      ...config
    }
    
    this.events = events || {}
    this.log('WebSocket 客户端初始化完成')
  }

  /**
   * 获取原生 readyState
   * 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
   */
  get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED
  }

  /**
   * 连接 WebSocket
   */
  async connect(): Promise<void> {
    // 如果当前已经是连接状态，直接返回
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('WebSocket 已经是连接状态')
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.log('开始连接 WebSocket:', this.config.url)
        this.setState(WSConnectionState.CONNECTING)
        
        this.ws = new WebSocket(this.config.url, this.config.protocols)
        
        this.ws.onopen = (event) => {
          this.log('WebSocket 连接成功')
          this.setState(WSConnectionState.CONNECTED)
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.processFailedQueue()
          this.events.onOpen?.(event)
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }
        
        this.ws.onerror = (event) => {
          this.log('WebSocket 错误:', event)
          this.events.onError?.(event)
          reject(new Error('WebSocket 连接失败'))
        }
        
        this.ws.onclose = (event) => {
          this.log('WebSocket 连接关闭:', event.code, event.reason)
          this.setState(WSConnectionState.DISCONNECTED)
          this.stopHeartbeat()
          this.events.onClose?.(event)
          
          // 非正常关闭时尝试重连
          if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
          } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.setState(WSConnectionState.FAILED)
            this.events.onMaxReconnectReached?.()
          }
        }
      } catch (error) {
        this.log('连接失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.log('主动断开 WebSocket 连接')
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close(1000, '主动断开')
      this.ws = null
    }
    
    this.setState(WSConnectionState.DISCONNECTED)
  }

  /**
   * 发送消息
   */
  async send<T = any>(type: string, data: any): Promise<T> {
    const message: WSMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      // 优先使用原生 readyState 判断连接是否可用
      const isConnected = this.ws?.readyState === WebSocket.OPEN && this.state === WSConnectionState.CONNECTED
      
      if (!isConnected) {
        if (this.config.enableQueue) {
          this.log('连接未就绪，消息加入队列:', message.id)
          this.messageQueue.push(message)
          this.pendingMessages.set(message.id, { resolve, reject, timer: setTimeout(() => {
            this.pendingMessages.delete(message.id)
            reject(new Error('消息发送超时'))
          }, this.config.messageTimeout) })
          return
        } else {
          reject(new Error('WebSocket 未连接'))
          return
        }
      }

      try {
        this.ws!.send(JSON.stringify(message))
        this.log('消息发送成功:', message.id, type)
        
        // 设置超时处理
        const timer = setTimeout(() => {
          this.pendingMessages.delete(message.id)
          reject(new Error('消息响应超时'))
        }, this.config.messageTimeout)
        
        this.pendingMessages.set(message.id, { resolve, reject, timer })
      } catch (error) {
        this.log('消息发送失败:', error)
        this.addToFailedQueue(message)
        reject(error)
      }
    })
  }

  /**
   * 发送不需要响应的消息
   */
  sendNoResponse(type: string, data: any): void {
    const message: WSMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now()
    }

    if (this.ws?.readyState !== WebSocket.OPEN || this.state !== WSConnectionState.CONNECTED) {
      if (this.config.enableQueue) {
        this.messageQueue.push(message)
        return
      } else {
        throw new Error('WebSocket 未连接')
      }
    }

    try {
      this.ws!.send(JSON.stringify(message))
      this.log('单向消息发送成功:', message.id, type)
    } catch (error) {
      this.log('单向消息发送失败:', error)
      this.addToFailedQueue(message)
      throw error
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data)
      this.log('收到消息:', message.id, message.type)
      
      // 处理心跳响应
      if (message.type === 'pong') {
        return
      }
      
      // 处理消息响应
      if (this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!
        clearTimeout(pending.timer)
        this.pendingMessages.delete(message.id)
        pending.resolve(message.data)
        return
      }
      
      // 触发消息事件
      this.events.onMessage?.(message)
    } catch (error) {
      this.log('消息解析失败:', error)
    }
  }

  /**
   * 重连机制
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectAttempts++
    this.setState(WSConnectionState.RECONNECTING)
    this.log(`准备第 ${this.reconnectAttempts} 次重连...`)
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        this.events.onReconnect?.(this.reconnectAttempts)
        await this.connect()
      } catch (error) {
        this.log('重连失败:', error)
      }
    }, this.config.reconnectInterval)
  }

  /**
   * 心跳机制
   */
  private startHeartbeat(): void {
    if (!this.config.enableHeartbeat) return
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === WSConnectionState.CONNECTED) {
        this.sendNoResponse('ping', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    if (!this.config.enableQueue || this.messageQueue.length === 0) return
    
    this.log(`处理消息队列，共 ${this.messageQueue.length} 条消息`)
    
    const queue = [...this.messageQueue]
    this.messageQueue = []
    
    queue.forEach(message => {
      try {
        this.ws!.send(JSON.stringify(message))
        this.log('队列消息发送成功:', message.id)
      } catch (error) {
        this.log('队列消息发送失败:', error)
        this.addToFailedQueue(message)
      }
    })
  }

  /**
   * 失败队列处理
   */
  private addToFailedQueue(message: WSMessage): void {
    const retryCount = (message.retryCount || 0) + 1
    
    if (retryCount <= this.config.maxRetryCount) {
      this.failedQueue.push({
        message: { ...message, retryCount },
        retryCount,
        lastAttempt: Date.now()
      })
      this.log(`消息加入失败队列，重试次数: ${retryCount}/${this.config.maxRetryCount}`)
      this.scheduleRetry()
    } else {
      this.log('消息重试次数超限，丢弃:', message.id)
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return
    
    this.retryTimer = setTimeout(() => {
      this.processFailedQueue()
      this.retryTimer = null
    }, this.config.retryDelay)
  }

  private processFailedQueue(): void {
    if (this.failedQueue.length === 0 || this.state !== WSConnectionState.CONNECTED) return
    
    this.log(`处理失败队列，共 ${this.failedQueue.length} 条消息`)
    
    const queue = [...this.failedQueue]
    this.failedQueue = []
    
    queue.forEach(item => {
      try {
        this.ws!.send(JSON.stringify(item.message))
        this.log('失败队列消息重试成功:', item.message.id)
      } catch (error) {
        this.log('失败队列消息重试失败:', error)
        this.addToFailedQueue(item.message)
      }
    })
  }

  /**
   * 状态管理
   */
  private setState(state: WSConnectionState): void {
    if (this.state !== state) {
      this.state = state
      this.log('状态变更:', state)
      this.events.onStateChange?.(state)
    }
  }

  /**
   * 工具方法
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args)
    }
  }

  /**
   * 获取状态信息
   */
  getState(): WSConnectionState {
    return this.state
  }

  getQueueInfo() {
    return {
      messageQueue: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
      failedQueue: this.failedQueue.length,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * 清空队列
   */
  clearQueues(): void {
    this.messageQueue = []
    this.failedQueue = []
    this.pendingMessages.forEach(pending => {
      clearTimeout(pending.timer)
      pending.reject(new Error('队列已清空'))
    })
    this.pendingMessages.clear()
    this.log('所有队列已清空')
  }
}

// 创建默认实例
export const createWebSocketClient = (config: WSConfig, events?: WSEvents) => {
  return new WebSocketClient(config, events)
}

export default WebSocketClient