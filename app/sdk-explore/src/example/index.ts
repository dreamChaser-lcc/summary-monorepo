import { httpClient, HttpClient } from '../request'

/**
 * Axios 封装库使用示例
 * 包含基本请求、文件操作、错误处理、认证等核心功能演示
 */

// 数据类型定义
interface User {
  id: number
  name: string
  email: string
  avatar?: string
  createdAt: string
}

interface ApiResponse<T> {
  data: T
  message: string
  code: number
}

/**
 * 基本请求示例
 */
export class HttpClientExample {

  // 1. 基本 GET 请求
  static async getUsers(): Promise<User[]> {
    try {
      console.log('📋 获取用户列表...')
      const users = await httpClient.get<User[]>('/users')
      console.log('✅ 获取成功:', users.length, '个用户')
      return users
    } catch (error) {
      console.error('❌ 获取用户列表失败:', error)
      throw error
    }
  }

  // 2. 带参数的 GET 请求
  static async getUsersWithPagination(page: number = 1, size: number = 10) {
    try {
      console.log(`📋 分页获取用户 (第${page}页, ${size}条/页)...`)
      const result = await httpClient.get('/users', {
        params: { page, size },
        showLoading: true
      })
      console.log('✅ 分页获取成功')
      return result
    } catch (error) {
      console.error('❌ 分页获取失败:', error)
      throw error
    }
  }

  // 3. POST 请求创建用户
  static async createUser(userData: { name: string; email: string; password: string }) {
    try {
      console.log('➕ 创建用户...', userData.email)
      const newUser = await httpClient.post<User>('/users', userData, {
        showLoading: true,
        timeout: 15000
      })
      console.log('✅ 创建用户成功:', newUser.id)
      return newUser
    } catch (error) {
      console.error('❌ 创建用户失败:', error)
      throw error
    }
  }

  // 4. PUT 请求更新用户
  static async updateUser(id: number, userData: Partial<User>) {
    try {
      console.log(`✏️ 更新用户 ID: ${id}`)
      const updatedUser = await httpClient.put<User>(`/users/${id}`, userData)
      console.log('✅ 更新用户成功')
      return updatedUser
    } catch (error) {
      console.error('❌ 更新用户失败:', error)
      throw error
    }
  }

  // 5. DELETE 请求删除用户
  static async deleteUser(id: number) {
    try {
      console.log(`🗑️ 删除用户 ID: ${id}`)
      await httpClient.delete(`/users/${id}`)
      console.log('✅ 删除用户成功')
    } catch (error) {
      console.error('❌ 删除用户失败:', error)
      throw error
    }
  }

  // 6. 文件上传示例
  static async uploadFile(file: File) {
    try {
      console.log('📤 上传文件:', file.name)
      const result = await httpClient.upload('/upload', file, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`📊 上传进度: ${progress}%`)
        },
        timeout: 60000
      })
      console.log('✅ 文件上传成功:', result)
      return result
    } catch (error) {
      console.error('❌ 文件上传失败:', error)
      throw error
    }
  }

  // 7. 文件下载示例
  static async downloadFile(fileId: string, filename: string) {
    try {
      console.log(`📥 下载文件: ${filename}`)
      const blob = await httpClient.download(`/download/${fileId}`)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('✅ 文件下载成功')
      return blob
    } catch (error) {
      console.error('❌ 文件下载失败:', error)
      throw error
    }
  }

  // 8. 并发请求示例
  static async concurrentRequests() {
    try {
      console.log('🚀 发起并发请求...')
      
      const requests = [
        httpClient.get('/users/1'),
        httpClient.get('/users/2'),
        httpClient.get('/users/3'),
        httpClient.get('/posts'),
        httpClient.get('/comments')
      ]
      
      const results = await Promise.all(requests)
      console.log('✅ 并发请求完成，结果数量:', results.length)
      return results
    } catch (error) {
      console.error('❌ 并发请求失败:', error)
      throw error
    }
  }

  // 9. 请求重试示例
  static async requestWithRetry() {
    try {
      console.log('🔄 带重试的请求...')
      const result = await httpClient.get('/unreliable-endpoint', {
        retry: 3,
        retryDelay: 1000,
        retryCondition: (error: any) => {
          return error.response?.status >= 500
        }
      })
      console.log('✅ 重试请求成功')
      return result
    } catch (error) {
      console.error('❌ 重试请求失败:', error)
      throw error
    }
  }

  // 10. 请求取消示例
  static async cancelableRequest() {
    try {
      console.log('🛑 可取消的请求...')
      const controller = new AbortController()
      
      // 3秒后取消请求
      setTimeout(() => {
        console.log('🛑 取消请求')
        controller.abort()
      }, 3000)
      
      const result = await httpClient.get('/slow-endpoint', {
        signal: controller.signal,
        timeout: 10000
      })
      
      console.log('✅ 请求完成')
      return result
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🛑 请求已被取消')
      } else {
        console.error('❌ 请求失败:', error)
      }
      throw error
    }
  }

  // 11. 认证相关示例
  static async loginExample(email: string, password: string) {
    try {
      console.log('🔐 用户登录...')
      const response = await httpClient.post<{
        user: User
        accessToken: string
        refreshToken: string
      }>('/auth/login', { email, password })
      
      // 设置认证 token
      httpClient.setAuthToken(response.accessToken)
      
      // 保存 token 到本地存储
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      console.log('✅ 登录成功')
      return response
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw error
    }
  }

  // 12. 错误处理示例
  static async errorHandlingExample() {
    try {
      console.log('❌ 错误处理示例...')
      await httpClient.get('/non-existent-endpoint')
    } catch (error: any) {
      console.log('捕获错误:')
      console.log('  状态码:', error.response?.status)
      console.log('  错误消息:', error.message)
      console.log('  错误类型:', error.name)
      
      // 根据不同错误类型进行处理
      switch (error.response?.status) {
        case 401:
          console.log('💡 需要重新登录')
          break
        case 403:
          console.log('💡 权限不足')
          break
        case 404:
          console.log('💡 资源不存在')
          break
        case 500:
          console.log('💡 服务器错误')
          break
        default:
          console.log('💡 未知错误')
      }
    }
  }

  // 13. 自定义配置示例
  static createCustomClient() {
    console.log('🔧 创建自定义客户端...')
    
    const customClient = new HttpClient({
      baseURL: 'https://api.example.com',
      timeout: 15000,
      headers: {
        'X-Custom-Header': 'custom-value'
      },
      retry: 5,
      retryDelay: 2000
    })
    
    console.log('✅ 自定义客户端创建成功')
    return customClient
  }
}

/**
 * 完整使用示例
 */
export async function runAllExamples() {
  console.log('🚀 开始 Axios 封装库使用示例...\n')

  try {
    // 1. 基本请求
    console.log('1️⃣ 基本请求示例')
    await HttpClientExample.getUsers()
    await HttpClientExample.getUsersWithPagination(1, 5)
    console.log('\n')

    // 2. CRUD 操作
    console.log('2️⃣ CRUD 操作示例')
    const newUser = await HttpClientExample.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    
    if (newUser?.id) {
      await HttpClientExample.updateUser(newUser.id, { name: 'Updated User' })
      await HttpClientExample.deleteUser(newUser.id)
    }
    console.log('\n')

    // 3. 并发请求
    console.log('3️⃣ 并发请求示例')
    await HttpClientExample.concurrentRequests()
    console.log('\n')

    // 4. 重试机制
    console.log('4️⃣ 重试机制示例')
    await HttpClientExample.requestWithRetry()
    console.log('\n')

    // 5. 请求取消
    console.log('5️⃣ 请求取消示例')
    await HttpClientExample.cancelableRequest()
    console.log('\n')

    // 6. 错误处理
    console.log('6️⃣ 错误处理示例')
    await HttpClientExample.errorHandlingExample()
    console.log('\n')

    // 7. 认证示例
    console.log('7️⃣ 认证示例')
    await HttpClientExample.loginExample('user@example.com', 'password')
    console.log('\n')

    // 8. 自定义客户端
    console.log('8️⃣ 自定义客户端示例')
    const customClient = HttpClientExample.createCustomClient()
    console.log('\n')

    console.log('🎉 所有示例执行完成!')
  } catch (error) {
    console.error('💥 示例执行失败:', error)
  }
}

/**
 * 浏览器环境文件操作示例
 * 需要用户交互才能执行
 */
export function setupFileOperationExamples() {
  console.log('📁 设置文件操作示例...')
  
  // 创建文件上传按钮
  const uploadButton = document.createElement('button')
  uploadButton.textContent = '选择文件上传'
  uploadButton.onclick = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        await HttpClientExample.uploadFile(file)
      }
    }
    fileInput.click()
  }
  
  // 创建文件下载按钮
  const downloadButton = document.createElement('button')
  downloadButton.textContent = '下载示例文件'
  downloadButton.onclick = () => {
    HttpClientExample.downloadFile('example-file-id', 'example.txt')
  }
  
  console.log('💡 文件操作按钮已创建，可以添加到页面中使用')
  return { uploadButton, downloadButton }
}

// 导出主要功能
export default {
  HttpClientExample,
  runAllExamples,
  setupFileOperationExamples
}