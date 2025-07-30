import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios'

// 扩展 InternalAxiosRequestConfig 接口
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number
    }
    showLoading?: boolean
    retry?: number
    retryDelay?: number
    skipErrorHandler?: boolean
    retryCondition?: (error: AxiosError) => boolean
    maxConcurrent?: number
    onProgress?: (progress: number) => void
  }
}

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  retry?: number // 重试次数
  retryDelay?: number // 重试延迟
  skipErrorHandler?: boolean // 跳过全局错误处理
  showLoading?: boolean // 是否显示加载状态
  timeout?: number // 超时时间
  retryCondition?: (error: AxiosError) => boolean // 重试条件
  maxConcurrent?: number // 最大并发数
  onProgress?: (progress: number) => void // 进度回调
  onUploadProgress?: (progressEvent: any) => void // 上传进度回调
}

// 响应数据接口
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

// 并发控制器
class ConcurrencyManager {
  private pending: Map<string, AbortController> = new Map()
  private maxConcurrent: number
  private currentRequests: number = 0
  private queue: Array<() => void> = []

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent
  }

  // 生成请求唯一标识
  private generateRequestKey(config: InternalAxiosRequestConfig): string {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  // 取消重复请求
  cancelDuplicateRequest(config: InternalAxiosRequestConfig): void {
    const requestKey = this.generateRequestKey(config)
    
    if (this.pending.has(requestKey)) {
      const controller = this.pending.get(requestKey)!
      controller.abort('取消重复请求')
      this.pending.delete(requestKey)
    }

    // 创建新的 AbortController
    const controller = new AbortController()
    config.signal = controller.signal
    this.pending.set(requestKey, controller)
  }

  // 移除已完成的请求
  removePendingRequest(config: InternalAxiosRequestConfig): void {
    const requestKey = this.generateRequestKey(config)
    this.pending.delete(requestKey)
  }

  // 并发控制
  async controlConcurrency<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        if (this.currentRequests >= this.maxConcurrent) {
          this.queue.push(executeRequest)
          return
        }

        this.currentRequests++
        
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.currentRequests--
          
          // 处理队列中的下一个请求
          if (this.queue.length > 0) {
            const nextRequest = this.queue.shift()!
            nextRequest()
          }
        }
      }

      executeRequest()
    })
  }

  // 取消所有待处理的请求
  cancelAllRequests(): void {
    this.pending.forEach(controller => {
      controller.abort('取消所有请求')
    })
    this.pending.clear()
    this.queue.length = 0
  }
}

// HTTP 客户端类
class HttpClient {
  private instance: AxiosInstance
  private concurrencyManager: ConcurrencyManager
  private defaultConfig: RequestConfig

  constructor(config: RequestConfig = {}) {
    this.defaultConfig = {
      timeout: 10000,
      retry: 3,
      retryDelay: 1000,
      showLoading: false,
      ...config
    }

    this.concurrencyManager = new ConcurrencyManager(10)
    this.instance = axios.create(this.defaultConfig)
    
    this.setupInterceptors()
  }

  // 设置拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 取消重复请求
        this.concurrencyManager.cancelDuplicateRequest(config)

        // 添加认证 token
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求时间戳
        config.metadata = { startTime: Date.now() }

        // 显示加载状态
        if (config.showLoading) {
          this.showLoading()
        }

        console.log(`🚀 请求发送: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error: AxiosError) => {
        console.error('❌ 请求配置错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as InternalAxiosRequestConfig & { metadata?: any }
        
        // 移除待处理请求
        this.concurrencyManager.removePendingRequest(config)

        // 隐藏加载状态
        if (config.showLoading) {
          this.hideLoading()
        }

        // 计算请求耗时
        const duration = config.metadata?.startTime 
          ? Date.now() - config.metadata.startTime 
          : 0

        console.log(`✅ 请求成功: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`)

        // 统一处理响应数据
        return this.handleResponse(response)
      },
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig

        if (config) {
          // 移除待处理请求
          this.concurrencyManager.removePendingRequest(config)

          // 隐藏加载状态
          if (config.showLoading) {
            this.hideLoading()
          }
        }

        // 处理错误
        return this.handleError(error)
      }
    )
  }

  // 处理响应数据
  private handleResponse(response: AxiosResponse): any {
    const { data } = response

    // 如果是文件下载等特殊响应，直接返回
    if (response.headers['content-type']?.includes('application/octet-stream')) {
      return response
    }

    // 统一的 API 响应格式处理
    if (data && typeof data === 'object') {
      if (data.code !== undefined) {
        if (data.code === 200 || data.success) {
          return data.data !== undefined ? data.data : data
        } else {
          throw new Error(data.message || '请求失败')
        }
      }
    }

    return data
  }

  // 错误处理
  private async handleError(error: AxiosError): Promise<any> {
    const config = error.config as RequestConfig

    // 如果请求被取消，直接返回
    if (axios.isCancel(error)) {
      console.log('📋 请求已取消:', error.message)
      return Promise.reject(error)
    }

    // 重试逻辑
    if (config && this.shouldRetry(error, config)) {
      return this.retryRequest(config)
    }

    // 跳过全局错误处理
    if (config?.skipErrorHandler) {
      return Promise.reject(error)
    }

    // 全局错误处理
    this.handleGlobalError(error)
    return Promise.reject(error)
  }

  // 判断是否应该重试
  private shouldRetry(error: AxiosError, config: RequestConfig): boolean {
    if (!config.retry || config.retry <= 0) return false

    // 网络错误或超时错误才重试
    const retryableErrors = [
      'ECONNABORTED', // 超时
      'ENOTFOUND',    // 网络错误
      'ECONNREFUSED', // 连接被拒绝
      'ETIMEDOUT'     // 超时
    ]

    return (
      !error.response || // 网络错误
      error.response.status >= 500 || // 服务器错误
      retryableErrors.includes(error.code || '')
    )
  }

  // 重试请求
  private async retryRequest(config: RequestConfig): Promise<any> {
    config.retry = (config.retry || 0) - 1
    
    const delay = config.retryDelay || 1000
    console.log(`🔄 ${delay}ms 后重试请求, 剩余重试次数: ${config.retry}`)
    
    await this.sleep(delay)
    return this.instance.request(config)
  }

  // 全局错误处理
  private handleGlobalError(error: AxiosError): void {
    const { response, message } = error

    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          console.error('🔐 未授权，请重新登录')
          this.handleUnauthorized()
          break
        case 403:
          console.error('🚫 权限不足')
          break
        case 404:
          console.error('🔍 请求的资源不存在')
          break
        case 500:
          console.error('💥 服务器内部错误')
          break
        default:
          console.error(`❌ 请求错误 ${status}:`, (data as any)?.message || message)
      }
    } else {
      console.error('🌐 网络错误:', message)
    }
  }

  // 处理未授权
  private handleUnauthorized(): void {
    // 清除 token
    this.removeToken()
    
    // 跳转到登录页面
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Token 管理
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
    }
  }

  // 加载状态管理
  private showLoading(): void {
    // 这里可以集成你的 loading 组件
    console.log('🔄 显示加载状态')
  }

  private hideLoading(): void {
    // 这里可以集成你的 loading 组件
    console.log('✨ 隐藏加载状态')
  }

  // 工具方法
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 公共请求方法
  async request<T = any>(config: RequestConfig): Promise<T> {
    return this.concurrencyManager.controlConcurrency(() => 
      this.instance.request<any, T>(config)
    )
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  // 并发请求
  async all<T = any>(requests: Array<Promise<T>>): Promise<T[]> {
    return Promise.all(requests)
  }

  // 文件上传
  async upload<T = any>(
    url: string, 
    file: File | FormData, 
    config?: RequestConfig & {
      onUploadProgress?: (progressEvent: any) => void
    }
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    return this.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  }

  // 文件下载
  async download(url: string, config?: RequestConfig): Promise<Blob>
  async download(url: string, filename?: string, config?: RequestConfig): Promise<void>
  async download(url: string, filenameOrConfig?: string | RequestConfig, config?: RequestConfig): Promise<Blob | void> {
    let filename: string | undefined
    let requestConfig: RequestConfig | undefined

    if (typeof filenameOrConfig === 'string') {
      filename = filenameOrConfig
      requestConfig = config
    } else {
      requestConfig = filenameOrConfig
    }

    const response = await this.request<AxiosResponse>({
      ...requestConfig,
      url,
      method: 'GET',
      responseType: 'blob'
    })

    const blob = new Blob([response.data])

    if (filename && typeof window !== 'undefined') {
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      return
    }

    return blob
  }

  // 设置认证 Token
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    // 更新默认请求头
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // 清除认证 Token
  clearAuthToken(): void {
    this.removeToken()
    delete this.instance.defaults.headers.common['Authorization']
  }

  // 取消所有请求
  cancelAllRequests(): void {
    this.concurrencyManager.cancelAllRequests()
  }

  // 设置默认配置
  setDefaultConfig(config: RequestConfig): void {
    Object.assign(this.defaultConfig, config)
    Object.assign(this.instance.defaults, config)
  }

  // 添加请求拦截器
  addRequestInterceptor(
    onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig,
    onRejected?: (error: any) => any
  ): number {
    return this.instance.interceptors.request.use(onFulfilled, onRejected)
  }

  // 添加响应拦截器
  addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => AxiosResponse,
    onRejected?: (error: any) => any
  ): number {
    return this.instance.interceptors.response.use(onFulfilled, onRejected)
  }
}

// 创建默认实例
const httpClient = new HttpClient({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api' 
    : 'https://api.example.com',
  timeout: 10000,
  retry: 3,
  retryDelay: 1000
})

// 导出实例和类
export { HttpClient, httpClient }
export type { RequestConfig, ApiResponse }

// 使用示例
export const apiExamples = {
  // 基本请求
  async getUsers() {
    return httpClient.get<{ id: number; name: string }[]>('/users')
  },

  // 带参数的请求
  async getUserById(id: number) {
    return httpClient.get(`/users/${id}`, {
      retry: 5, // 自定义重试次数
      showLoading: true // 显示加载状态
    })
  },

  // POST 请求
  async createUser(userData: { name: string; email: string }) {
    return httpClient.post('/users', userData, {
      skipErrorHandler: false // 使用全局错误处理
    })
  },

  // 文件上传
  async uploadAvatar(file: File) {
    return httpClient.upload('/upload/avatar', file, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        console.log(`上传进度: ${progress}%`)
      }
    })
  },

  // 文件下载
  async downloadReport() {
    return httpClient.download('/reports/monthly', 'monthly-report.pdf')
  },

  // 并发请求
  async getBatchData() {
    const requests = [
      httpClient.get('/users'),
      httpClient.get('/posts'),
      httpClient.get('/comments')
    ]
    
    return httpClient.all(requests)
  }
}