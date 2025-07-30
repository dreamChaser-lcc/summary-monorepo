import { WebSocketClient, WSConnectionState, createWebSocketClient } from '../websocket'

/**
 * WebSocket 使用示例
 * 包含各种场景的使用方法和最佳实践
 */

// 数据类型定义
interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'file'
}

interface UserStatus {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeen: number
}

interface GameAction {
  playerId: string
  action: string
  data: any
  timestamp: number
}

/**
 * 聊天室示例
 */
export class ChatRoomExample {
  private wsClient: WebSocketClient
  private currentUser: { id: string; username: string } | null = null

  constructor(serverUrl: string) {
    this.wsClient = createWebSocketClient(
      {
        url: serverUrl,
        reconnectInterval: 2000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        messageTimeout: 5000,
        maxRetryCount: 3,
        retryDelay: 1000,
        enableHeartbeat: true,
        enableQueue: true,
        debug: true
      },
      {
        onOpen: () => {
          console.log('🟢 聊天室连接成功')
          this.onConnected()
        },
        onMessage: (message) => {
          this.handleChatMessage(message)
        },
        onError: (error) => {
          console.error('❌ 聊天室连接错误:', error)
        },
        onClose: (event) => {
          console.log('🔴 聊天室连接关闭:', event.reason)
        },
        onStateChange: (state) => {
          console.log('📡 连接状态变更:', state)
          this.updateConnectionStatus(state)
        },
        onReconnect: (attempt) => {
          console.log(`🔄 第 ${attempt} 次重连尝试...`)
        },
        onMaxReconnectReached: () => {
          console.log('💥 达到最大重连次数，连接失败')
          this.showConnectionError()
        }
      }
    )
  }

  // 连接聊天室
  async connect(): Promise<void> {
    try {
      await this.wsClient.connect()
    } catch (error) {
      console.error('连接聊天室失败:', error)
      throw error
    }
  }

  // 用户登录
  async login(username: string, password: string): Promise<void> {
    try {
      console.log('🔐 用户登录中...')
      const response = await this.wsClient.send('user_login', {
        username,
        password,
        timestamp: Date.now()
      })
      
      this.currentUser = response.user
      console.log('✅ 登录成功:', this.currentUser)
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw error
    }
  }

  // 发送聊天消息
  async sendMessage(content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未登录')
    }

    try {
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId: this.currentUser.id,
        username: this.currentUser.username,
        content,
        timestamp: Date.now(),
        type
      }

      console.log('💬 发送消息:', content)
      await this.wsClient.send('chat_message', message)
      console.log('✅ 消息发送成功')
    } catch (error) {
      console.error('❌ 消息发送失败:', error)
      throw error
    }
  }

  // 获取在线用户列表
  async getOnlineUsers(): Promise<UserStatus[]> {
    try {
      console.log('👥 获取在线用户列表...')
      const users = await this.wsClient.send<UserStatus[]>('get_online_users', {})
      console.log('✅ 获取成功，在线用户:', users.length)
      return users
    } catch (error) {
      console.error('❌ 获取在线用户失败:', error)
      throw error
    }
  }

  // 加入房间
  async joinRoom(roomId: string): Promise<void> {
    try {
      console.log('🏠 加入房间:', roomId)
      await this.wsClient.send('join_room', { roomId, userId: this.currentUser?.id })
      console.log('✅ 成功加入房间')
    } catch (error) {
      console.error('❌ 加入房间失败:', error)
      throw error
    }
  }

  // 离开房间
  async leaveRoom(roomId: string): Promise<void> {
    try {
      console.log('🚪 离开房间:', roomId)
      await this.wsClient.send('leave_room', { roomId, userId: this.currentUser?.id })
      console.log('✅ 成功离开房间')
    } catch (error) {
      console.error('❌ 离开房间失败:', error)
      throw error
    }
  }

  // 处理接收到的消息
  private handleChatMessage(message: any): void {
    switch (message.type) {
      case 'chat_message':
        this.displayChatMessage(message.data)
        break
      case 'user_joined':
        this.displayUserJoined(message.data)
        break
      case 'user_left':
        this.displayUserLeft(message.data)
        break
      case 'room_notification':
        this.displayRoomNotification(message.data)
        break
      default:
        console.log('未知消息类型:', message.type, message.data)
    }
  }

  private displayChatMessage(message: ChatMessage): void {
    console.log(`💬 [${message.username}]: ${message.content}`)
    // 这里可以更新 UI 显示消息
  }

  private displayUserJoined(user: { username: string }): void {
    console.log(`👋 ${user.username} 加入了聊天室`)
  }

  private displayUserLeft(user: { username: string }): void {
    console.log(`👋 ${user.username} 离开了聊天室`)
  }

  private displayRoomNotification(notification: { message: string }): void {
    console.log(`📢 系统通知: ${notification.message}`)
  }

  private onConnected(): void {
    // 连接成功后的处理
    console.log('🎉 聊天室连接就绪')
  }

  private updateConnectionStatus(state: WSConnectionState): void {
    // 更新 UI 连接状态显示
    const statusElement = document.getElementById('connection-status')
    if (statusElement) {
      statusElement.textContent = state
      statusElement.className = `status-${state}`
    }
  }

  private showConnectionError(): void {
    // 显示连接错误提示
    alert('聊天室连接失败，请检查网络连接后重试')
  }

  // 断开连接
  disconnect(): void {
    this.wsClient.disconnect()
    this.currentUser = null
  }

  // 获取连接信息
  getConnectionInfo() {
    return {
      state: this.wsClient.getState(),
      queueInfo: this.wsClient.getQueueInfo(),
      currentUser: this.currentUser
    }
  }
}

/**
 * 实时游戏示例
 */
export class GameExample {
  private wsClient: WebSocketClient
  private gameId: string | null = null
  private playerId: string | null = null

  constructor(serverUrl: string) {
    this.wsClient = createWebSocketClient(
      {
        url: serverUrl,
        reconnectInterval: 1000,
        maxReconnectAttempts: 20,
        heartbeatInterval: 15000,
        messageTimeout: 3000,
        maxRetryCount: 5,
        retryDelay: 500,
        enableHeartbeat: true,
        enableQueue: true,
        debug: true
      },
      {
        onOpen: () => console.log('🎮 游戏服务器连接成功'),
        onMessage: (message) => this.handleGameMessage(message),
        onError: (error) => console.error('🎮 游戏连接错误:', error),
        onStateChange: (state) => console.log('🎮 游戏连接状态:', state)
      }
    )
  }

  async connect(): Promise<void> {
    await this.wsClient.connect()
  }

  // 加入游戏
  async joinGame(gameId: string, playerName: string): Promise<void> {
    try {
      console.log('🎮 加入游戏:', gameId)
      const response = await this.wsClient.send('join_game', {
        gameId,
        playerName,
        timestamp: Date.now()
      })
      
      this.gameId = gameId
      this.playerId = response.playerId
      console.log('✅ 成功加入游戏，玩家ID:', this.playerId)
    } catch (error) {
      console.error('❌ 加入游戏失败:', error)
      throw error
    }
  }

  // 发送游戏动作
  async sendGameAction(action: string, data: any): Promise<void> {
    if (!this.gameId || !this.playerId) {
      throw new Error('未加入游戏')
    }

    try {
      const gameAction: GameAction = {
        playerId: this.playerId,
        action,
        data,
        timestamp: Date.now()
      }

      console.log('🎯 发送游戏动作:', action)
      await this.wsClient.send('game_action', gameAction)
    } catch (error) {
      console.error('❌ 游戏动作发送失败:', error)
      throw error
    }
  }

  // 获取游戏状态
  async getGameState(): Promise<any> {
    try {
      console.log('📊 获取游戏状态...')
      const gameState = await this.wsClient.send('get_game_state', {
        gameId: this.gameId
      })
      return gameState
    } catch (error) {
      console.error('❌ 获取游戏状态失败:', error)
      throw error
    }
  }

  private handleGameMessage(message: any): void {
    switch (message.type) {
      case 'game_state_update':
        this.updateGameState(message.data)
        break
      case 'player_action':
        this.handlePlayerAction(message.data)
        break
      case 'game_over':
        this.handleGameOver(message.data)
        break
      default:
        console.log('🎮 未知游戏消息:', message.type)
    }
  }

  private updateGameState(gameState: any): void {
    console.log('📊 游戏状态更新:', gameState)
    // 更新游戏 UI
  }

  private handlePlayerAction(action: GameAction): void {
    console.log(`🎯 玩家 ${action.playerId} 执行动作: ${action.action}`)
    // 处理其他玩家的动作
  }

  private handleGameOver(result: any): void {
    console.log('🏁 游戏结束:', result)
    // 显示游戏结果
  }

  disconnect(): void {
    this.wsClient.disconnect()
    this.gameId = null
    this.playerId = null
  }
}

/**
 * 数据同步示例
 */
export class DataSyncExample {
  private wsClient: WebSocketClient
  private subscriptions = new Set<string>()

  constructor(serverUrl: string) {
    this.wsClient = createWebSocketClient(
      {
        url: serverUrl,
        reconnectInterval: 5000,
        maxReconnectAttempts: 3,
        heartbeatInterval: 60000,
        messageTimeout: 15000,
        maxRetryCount: 2,
        retryDelay: 3000,
        enableHeartbeat: true,
        enableQueue: true,
        debug: false
      },
      {
        onOpen: () => this.resubscribeAll(),
        onMessage: (message) => this.handleDataUpdate(message),
        onError: (error) => console.error('📡 数据同步错误:', error)
      }
    )
  }

  async connect(): Promise<void> {
    await this.wsClient.connect()
  }

  // 订阅数据更新
  async subscribe(dataType: string, filters?: any): Promise<void> {
    try {
      console.log('📡 订阅数据更新:', dataType)
      await this.wsClient.send('subscribe', {
        dataType,
        filters: filters || {},
        timestamp: Date.now()
      })
      
      this.subscriptions.add(dataType)
      console.log('✅ 订阅成功')
    } catch (error) {
      console.error('❌ 订阅失败:', error)
      throw error
    }
  }

  // 取消订阅
  async unsubscribe(dataType: string): Promise<void> {
    try {
      console.log('📡 取消订阅:', dataType)
      await this.wsClient.send('unsubscribe', { dataType })
      this.subscriptions.delete(dataType)
      console.log('✅ 取消订阅成功')
    } catch (error) {
      console.error('❌ 取消订阅失败:', error)
      throw error
    }
  }

  // 推送数据更新
  async pushUpdate(dataType: string, data: any): Promise<void> {
    try {
      console.log('📤 推送数据更新:', dataType)
      await this.wsClient.send('data_update', {
        dataType,
        data,
        timestamp: Date.now()
      })
      console.log('✅ 数据推送成功')
    } catch (error) {
      console.error('❌ 数据推送失败:', error)
      throw error
    }
  }

  private handleDataUpdate(message: any): void {
    if (message.type === 'data_update') {
      console.log('📥 收到数据更新:', message.data.dataType)
      // 处理数据更新
      this.processDataUpdate(message.data)
    }
  }

  private processDataUpdate(update: any): void {
    // 根据数据类型处理更新
    switch (update.dataType) {
      case 'user_profile':
        this.updateUserProfile(update.data)
        break
      case 'order_status':
        this.updateOrderStatus(update.data)
        break
      case 'inventory':
        this.updateInventory(update.data)
        break
      default:
        console.log('未知数据类型:', update.dataType)
    }
  }

  private updateUserProfile(data: any): void {
    console.log('👤 用户资料更新:', data)
  }

  private updateOrderStatus(data: any): void {
    console.log('📦 订单状态更新:', data)
  }

  private updateInventory(data: any): void {
    console.log('📊 库存更新:', data)
  }

  // 重新订阅所有数据
  private async resubscribeAll(): Promise<void> {
    console.log('🔄 重新订阅所有数据...')
    for (const dataType of this.subscriptions) {
      try {
        await this.subscribe(dataType)
      } catch (error) {
        console.error('重新订阅失败:', dataType, error)
      }
    }
  }

  disconnect(): void {
    this.wsClient.disconnect()
    this.subscriptions.clear()
  }
}

/**
 * 使用示例演示
 */
export async function runWebSocketExamples() {
  console.log('🚀 开始 WebSocket 使用示例...\n')

  // 1. 聊天室示例
  console.log('1️⃣ 聊天室示例')
  const chatRoom = new ChatRoomExample('ws://localhost:8080/chat')
  
  try {
    await chatRoom.connect()
    await chatRoom.login('testuser', 'password123')
    await chatRoom.joinRoom('general')
    await chatRoom.sendMessage('Hello, everyone!')
    
    const onlineUsers = await chatRoom.getOnlineUsers()
    console.log('在线用户:', onlineUsers)
    
    console.log('连接信息:', chatRoom.getConnectionInfo())
  } catch (error) {
    console.error('聊天室示例失败:', error)
  }
  console.log('\n')

  // 2. 游戏示例
  console.log('2️⃣ 实时游戏示例')
  const game = new GameExample('ws://localhost:8080/game')
  
  try {
    await game.connect()
    await game.joinGame('game123', 'Player1')
    await game.sendGameAction('move', { x: 10, y: 20 })
    
    const gameState = await game.getGameState()
    console.log('游戏状态:', gameState)
  } catch (error) {
    console.error('游戏示例失败:', error)
  }
  console.log('\n')

  // 3. 数据同步示例
  console.log('3️⃣ 数据同步示例')
  const dataSync = new DataSyncExample('ws://localhost:8080/sync')
  
  try {
    await dataSync.connect()
    await dataSync.subscribe('user_profile', { userId: '123' })
    await dataSync.subscribe('order_status')
    
    await dataSync.pushUpdate('inventory', {
      productId: 'prod123',
      quantity: 50
    })
  } catch (error) {
    console.error('数据同步示例失败:', error)
  }
  console.log('\n')

  console.log('🎉 所有 WebSocket 示例演示完成!')
  
  // 清理资源
  setTimeout(() => {
    chatRoom.disconnect()
    game.disconnect()
    dataSync.disconnect()
    console.log('🧹 资源清理完成')
  }, 5000)
}

// 错误处理和重试示例
export function demonstrateErrorHandling() {
  console.log('🔧 错误处理和重试机制演示')
  
  const wsClient = createWebSocketClient(
    {
      url: 'ws://invalid-server:8080', // 故意使用无效地址
      reconnectInterval: 2000,
      maxReconnectAttempts: 3,
      maxRetryCount: 2,
      retryDelay: 1000,
      debug: true
    },
    {
      onError: (error) => {
        console.log('❌ 连接错误演示:', error)
      },
      onReconnect: (attempt) => {
        console.log(`🔄 重连演示 - 第 ${attempt} 次尝试`)
      },
      onMaxReconnectReached: () => {
        console.log('💥 达到最大重连次数演示')
      },
      onStateChange: (state) => {
        console.log('📡 状态变更演示:', state)
      }
    }
  )
  
  // 尝试连接（会失败）
  wsClient.connect().catch(error => {
    console.log('预期的连接失败:', error.message)
  })
  
  // 演示队列信息
  setTimeout(() => {
    console.log('队列信息:', wsClient.getQueueInfo())
  }, 1000)
}

// 导出主要功能
export default {
  ChatRoomExample,
  GameExample,
  DataSyncExample,
  runWebSocketExamples,
  demonstrateErrorHandling
}