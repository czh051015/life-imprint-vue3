<template>
  <!-- 导航栏 -->
  <Navbar />
  
  <div class="events-summary-container">
    <div class="events-header">
      <h1 class="events-title">家族大事记</h1>
      <div class="header-actions">
        <p class="events-subtitle">记录家族重要时刻，传承家族文化记忆</p>
      </div>
      <!-- 添加大事记按钮 -->
      <button id="add-event-btn" class="add-event-button" @click="showAddModal = true">添加大事记</button>
    </div>
    
    <!-- 滚动式事件列表 -->
    <div id="events-scroll-container" class="events-scroll-container">
      <!-- 事件项将通过JavaScript动态生成 -->
      <div v-if="events.length === 0" class="empty-events">
        <h3>暂无家族大事记</h3>
        <p>点击右上角按钮添加第一个家族大事记</p>
      </div>
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event-item"
      >
        <div class="event-image">
          <img :src="event.imageUrl" :alt="event.title">
        </div>
        <div class="event-content">
          <div class="event-date">{{ formatDate(event.createdAt) }}</div>
          <h3 class="event-title" @click="goToEventDetail(event.id)">{{ event.title }}</h3>
          <p class="event-preview">{{ getPreviewContent(event.content) }}</p>

          <!-- 多媒体文件展示 -->
          <div v-if="event.allImageUrls && event.allImageUrls.length > 1" class="media-gallery">
            <h4>相关媒体</h4>
            <div class="media-items">
              <template v-for="(url, index) in event.allImageUrls" :key="index">
                <img v-if="url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif')" 
                     :src="url" :alt="event.title + ' - ' + (index + 1)" class="media-item image">
                <video v-else 
                     :src="url" controls class="media-item video">
                  您的浏览器不支持视频播放
                </video>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 新增大事记弹框 -->
  <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
    <div class="modal-container">
      <div class="modal-header">
        <h2>新增家族大事记</h2>
        <button class="close-button" @click="showAddModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitNewEvent">
          <!-- 事件标题 -->
          <div class="form-group">
            <label for="event-title" class="required">事件标题</label>
            <input 
              type="text" 
              id="event-title" 
              v-model="newEventForm.title" 
              class="form-input" 
              placeholder="请输入事件标题（2-50字）"
              :class="{ 'error': validationErrors.title }"
            >
            <div class="error-message" v-if="validationErrors.title">{{ validationErrors.title }}</div>
          </div>
          
          <!-- 事件时间 -->
          <div class="form-group">
            <label for="event-time" class="required">事件时间</label>
            <input 
              type="date" 
              id="event-time" 
              v-model="newEventForm.eventTime" 
              class="form-input"
              :class="{ 'error': validationErrors.eventTime }"
            >
            <div class="error-message" v-if="validationErrors.eventTime">{{ validationErrors.eventTime }}</div>
          </div>
          
          <!-- 事件内容 -->
          <div class="form-group">
            <div class="content-label-row">
              <label for="event-content" class="required">事件内容</label>
              <button class="ai-polish-button" @click="aiPolishContent" :disabled="isPolishing">
                <span v-if="isPolishing">润色中...</span>
                <span v-else>AI润色</span>
              </button>
            </div>
            <textarea 
              id="event-content" 
              v-model="newEventForm.content" 
              class="form-textarea" 
              rows="6" 
              placeholder="请输入事件内容（10-500字）"
              :class="{ 'error': validationErrors.content }"
            ></textarea>
            <div class="error-message" v-if="validationErrors.content">{{ validationErrors.content }}</div>
            <div class="character-count">{{ newEventForm.content.length }}/500</div>
            
            <!-- AI润色结果展示区 -->
            <div class="ai-polish-result" v-if="polishedContent">
              <div class="ai-polish-result-header">
                <h3>AI润色结果</h3>
                <div class="ai-polish-actions">
                  <button class="use-polished-button" @click="usePolishedContent">使用此内容</button>
                  <button class="close-polished-button" @click="polishedContent = ''">关闭</button>
                </div>
              </div>
              <div class="ai-polished-content">{{ polishedContent }}</div>
            </div>
          </div>
          
          <!-- 文件上传 -->
          <div class="form-group">
            <label for="file-upload">上传图片/视频</label>
            <div class="file-upload-area">
              <label for="file-upload" class="file-upload-label" 
                     @dragover.prevent="onDragOver"
                     @dragleave.prevent="onDragLeave"
                     @drop.prevent="onDrop">
                <span class="upload-icon">+</span>
                <span>点击或拖拽文件到此处上传</span>
                <input 
                  type="file" 
                  id="file-upload" 
                  multiple 
                  accept="image/*,video/*" 
                  @change="handleFileUpload"
                  class="file-input"
                >
              </label>
            </div>
            <p class="file-hint">支持上传图片和视频文件，可上传多个</p>
          </div>
          
          <!-- 文件预览 -->
          <div class="form-group" v-if="uploadedFiles.length > 0">
            <label>已上传文件</label>
            <div class="file-preview-container">
              <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-item">
                <div class="preview-content">
                  <img v-if="file.type.startsWith('image/')" :src="file.previewUrl" alt="Preview" class="preview-image">
                  <video v-else-if="file.type.startsWith('video/')" :src="file.previewUrl" controls class="preview-video"></video>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button type="button" class="delete-file-btn" @click="deleteUploadedFile(index)" title="删除文件">
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="form-actions">
            <button type="button" class="cancel-button" @click="showAddModal = false">取消</button>
            <button type="submit" class="submit-button" :disabled="isSubmitting || !isFormValid">
              <span v-if="isSubmitting">提交中...</span>
              <span v-else>提交</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Auth from '../utils/auth.js'
import API_CONFIG, { apiRequest } from '@/api/api-config.js'
import axios from 'axios'

const router = useRouter()
const auth = new Auth()
const events = ref([])

// 新增大事记相关
const showAddModal = ref(false)
const isSubmitting = ref(false)
const isFormValid = ref(false)
const uploadedFiles = ref([])

// AI相关
const isPolishing = ref(false)
const polishedContent = ref('')

const newEventForm = reactive({
  title: '',
  eventTime: '',
  content: ''
})

const validationErrors = reactive({
  title: '',
  eventTime: '',
  content: ''
})

// 实时表单验证
watchEffect(() => {
  let isValid = true
  
  // 重置错误信息
  validationErrors.title = ''
  validationErrors.eventTime = ''
  validationErrors.content = ''
  
  // 验证标题
  if (!newEventForm.title.trim()) {
    validationErrors.title = '事件标题不能为空'
    isValid = false
  } else if (newEventForm.title.length < 2) {
    validationErrors.title = '事件标题不能少于2个字符'
    isValid = false
  } else if (newEventForm.title.length > 50) {
    validationErrors.title = '事件标题不能超过50个字符'
    isValid = false
  }
  
  // 验证事件时间
  if (!newEventForm.eventTime) {
    validationErrors.eventTime = '事件时间不能为空'
    isValid = false
  } else {
    // 验证日期格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(newEventForm.eventTime)) {
      validationErrors.eventTime = '事件时间格式错误，应为YYYY-MM-DD'
      isValid = false
    }
  }
  
  // 验证内容
  if (!newEventForm.content.trim()) {
    validationErrors.content = '事件内容不能为空'
    isValid = false
  } else if (newEventForm.content.length < 10) {
    validationErrors.content = '事件内容不能少于10个字符'
    isValid = false
  } else if (newEventForm.content.length > 500) {
    validationErrors.content = '事件内容不能超过500个字符'
    isValid = false
  }
  
  isFormValid.value = isValid
})

// 跳转到事件详情页
const goToEventDetail = (eventId) => {
  router.push(`/event-detail/${eventId}`)
}

// 页面初始化
onMounted(() => {
  checkLoginStatus()
  loadEvents()
  
  // 检查URL参数，如果有事件ID则直接跳转到详情页
  const urlParams = new URLSearchParams(window.location.search)
  const eventId = urlParams.get('id')
  if (eventId) {
    goToEventDetail(eventId)
  }
})

// 检查登录状态
const checkLoginStatus = () => {
  if (!auth.isLoggedIn()) {
    router.push('/')
  }
}

// 加载大事记
const loadEvents = async () => {
  try {
    // 获取当前选择的家族ID
    const currentFamilyId = localStorage.getItem('currentFamilyId')
    if (!currentFamilyId) {
      console.error('未选择家族')
      return
    }

    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('未登录')
      return
    }

    // 构造带分页参数的URL
    const url = new URL(API_CONFIG.baseURL + API_CONFIG.paths.event.list)
    url.searchParams.append('pageNum', '1')
    url.searchParams.append('pageSize', '10')

    // 调用API获取大事记列表
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
      }
    })

    const data = await response.json()
    
    if (data.code === 200 && data.data && data.data.list) {
      // 处理返回的数据，映射字段名并存储所有图片/视频URL
      events.value = data.data.list.map(item => {
        const imageUrls = item.imageUrl ? item.imageUrl.split(',').map(url => fixImageUrl(url)) : []
        return {
          id: item.eventId,
          title: item.title,
          content: item.content,
          createdAt: item.eventTime,
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : '/img/background-pattern-1.jpg',
          allImageUrls: imageUrls,
          FamilyMembers: [] // 如果API返回成员信息，这里可以添加映射
        }
      })
      
      // 按时间排序（最新的在前）
      events.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else {
      console.error('获取大事记失败:', data.msg || '未知错误')
      events.value = []
    }
  } catch (error) {
    console.error('加载大事记错误:', error)
    events.value = []
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取预览内容（截取前100个字符）
const getPreviewContent = (content) => {
  return content.substring(0, 100) + (content.length > 100 ? '...' : '')
}



// 拖拽上传事件处理
const isDragging = ref(false)

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  handleFiles(files)
}

// 处理文件上传
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  handleFiles(files)
  
  // 清空文件输入，允许再次选择相同文件
  event.target.value = ''
}

// 统一处理文件（无论是选择还是拖拽）
const handleFiles = (files) => {
  files.forEach(file => {
    // 验证文件类型
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('只能上传图片和视频文件')
      return
    }
    
    // 创建文件预览
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedFiles.value.push({
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: e.target.result,
        file: file
      })
    }
    reader.readAsDataURL(file)
  })
}

// 删除已上传文件
const deleteUploadedFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

// 上传单个文件到服务器
const uploadFile = async (file) => {
  try {
    // 获取当前选择的家族ID
    const currentFamilyId = localStorage.getItem('currentFamilyId')
    if (!currentFamilyId) {
      throw new Error('未选择家族')
    }
    
    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    // 创建form-data
    const formData = new FormData()
    formData.append('file', file)
    
    // 调用上传API
    const response = await axios.post(`${API_CONFIG.baseURL}/api/file/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
        // 注意：不要设置Content-Type为application/json，axios会自动设置为multipart/form-data
      }
    })
    
    if (response.data.code === 200 && response.data.data) {
      // 修复URL完整性
      const fixedUrl = fixImageUrl(response.data.data)
      return fixedUrl // 返回修复后的完整URL
    } else {
      throw new Error(response.data.msg || '上传失败')
    }
  } catch (error) {
    console.error('文件上传错误:', error)
    throw new Error('文件上传失败')
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 检查并修复图片URL的完整性
const fixImageUrl = (url) => {
  if (!url) return null
  
  // 检查URL是否已经是完整的（以http://或https://开头）
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是纯文件名，拼接完整的URL
  // 从API配置中获取基础URL
  const baseUrl = API_CONFIG.baseURL
  
  // 确保URL路径正确（添加/upload/前缀）
  let fixedUrl = url
  if (!fixedUrl.startsWith('/')) {
    fixedUrl = `/upload/${fixedUrl}`
  }
  
  return `${baseUrl}${fixedUrl}`
}

// 验证表单
const validateForm = () => {
  let isValid = true
  
  // 重置错误信息
  validationErrors.title = ''
  validationErrors.eventTime = ''
  validationErrors.content = ''
  
  // 验证标题
  if (!newEventForm.title.trim()) {
    validationErrors.title = '事件标题不能为空'
    isValid = false
  } else if (newEventForm.title.length < 2) {
    validationErrors.title = '事件标题不能少于2个字符'
    isValid = false
  } else if (newEventForm.title.length > 50) {
    validationErrors.title = '事件标题不能超过50个字符'
    isValid = false
  }
  
  // 验证事件时间
  if (!newEventForm.eventTime) {
    validationErrors.eventTime = '事件时间不能为空'
    isValid = false
  } else {
    // 验证日期格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(newEventForm.eventTime)) {
      validationErrors.eventTime = '事件时间格式错误，应为YYYY-MM-DD'
      isValid = false
    }
  }
  
  // 验证内容
  if (!newEventForm.content.trim()) {
    validationErrors.content = '事件内容不能为空'
    isValid = false
  } else if (newEventForm.content.length < 10) {
    validationErrors.content = '事件内容不能少于10个字符'
    isValid = false
  } else if (newEventForm.content.length > 500) {
    validationErrors.content = '事件内容不能超过500个字符'
    isValid = false
  }
  
  return isValid
}

// AI润色内容
const aiPolishContent = async () => {
  if (!newEventForm.content.trim()) {
    alert('请先输入事件内容')
    return
  }
  
  try {
    isPolishing.value = true
    
    // 调用AI润色接口
    const response = await apiRequest(`${API_CONFIG.baseURL}${API_CONFIG.paths.ai.polish}`, {
      method: 'POST',
      body: JSON.stringify({
        content: newEventForm.content.trim(),
        scene: 'general' // 默认使用通用文案场景
      })
    })
    
    if (response.code === 200 && response.data) {
      polishedContent.value = response.data
    } else {
      alert(`润色失败：${response.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('AI润色错误:', error)
    alert('AI润色失败，请稍后重试')
  } finally {
    isPolishing.value = false
  }
}

// 使用AI润色结果
const usePolishedContent = () => {
  if (polishedContent.value) {
    newEventForm.content = polishedContent.value
    polishedContent.value = ''
  }
}

// 提交新事件
const submitNewEvent = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }
  
  try {
    isSubmitting.value = true
    
    // 获取当前选择的家族ID
    const currentFamilyId = localStorage.getItem('currentFamilyId')
    if (!currentFamilyId) {
      alert('请先选择一个家族')
      return
    }
    
    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/')
      return
    }
    
    // 构造表单数据
    const formData = {
      title: newEventForm.title.trim(),
      content: newEventForm.content.trim(),
      eventTime: newEventForm.eventTime
    }
    
    // 如果有上传文件，上传文件并获取URL
    if (uploadedFiles.value.length > 0) {
      // 上传所有文件并收集URL
      const uploadedUrls = []
      let uploadSuccess = true
      
      for (const [index, uploadedFile] of uploadedFiles.value.entries()) {
        try {
          const fileUrl = await uploadFile(uploadedFile.file)
          if (fileUrl) {
            uploadedUrls.push(fileUrl)
          }
        } catch (error) {
          uploadSuccess = false
          alert(`第 ${index + 1} 个文件上传失败: ${error.message}`)
          break // 遇到上传失败，停止后续上传
        }
      }
      
      if (!uploadSuccess) {
        return // 上传失败，停止提交
      }
      
      if (uploadedUrls.length > 0) {
        formData.imageUrl = uploadedUrls.join(',')
      }
    }
    
    // 调用新增大事记API
    let response
    try {
      response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.event.add, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'family-id': currentFamilyId
        },
        body: JSON.stringify(formData)
      })
      
      // 检查HTTP状态码
      if (!response.ok) {
        throw new Error(`HTTP错误：${response.status}`)
      }
    } catch (error) {
      console.error('请求新增大事记API失败:', error)
      alert('网络请求失败，请检查网络连接后重试')
      return
    }
    
    const data = await response.json()
    
    if (data.code === 200) {
      // 清空表单和文件
      newEventForm.title = ''
      newEventForm.eventTime = ''
      newEventForm.content = ''
      uploadedFiles.value = []
      
      // 关闭弹框
      showAddModal.value = false
      
      // 重新加载大事记列表
      await loadEvents()
      
      alert('家族大事记添加成功！')
    } else {
      alert(`添加失败：${data.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('添加大事记错误:', error)
    alert('添加大事记失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 查看事件详情函数已移除，因为家族大事记功能已集中到EventsSummary页面
</script>

<style scoped>
/* 汇总页面样式 */
.events-summary-container {
  width: 90%;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* 固定背景图片 */
.events-summary-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/img/familytree.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

/* 导航栏半透明效果（仅当前页面） */
nav.traditional-navbar {
  background-color: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

/* 当前家族显示样式 - 半透明 */
nav.traditional-navbar .current-family {
  background: rgba(245, 247, 250, 0.7) !important;
  border: 1px solid rgba(228, 231, 237, 0.7) !important;
}

.events-header {
  margin-bottom: 60px;
  margin-top: 40px;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 20px;
  border-radius: 12px;
}

.header-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.events-title {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 20px;
  font-family: 'Noto Serif SC', serif;
  text-align: center;
}

.events-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
  text-align: center;
}

/* 添加按钮样式 */
.add-event-button {
  position: relative;
  background-color: var(--primary-color);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  float: right;
}

.add-event-button:hover {
  background-color: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 滚动式布局样式 */
.events-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 40px 0;
}

.event-item {
  display: flex;
  gap: 40px;
  align-items: center;
  padding: 40px;
  border-radius: 12px;
  box-shadow: none;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.5);
}

.event-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.event-image {
  flex: 0 0 300px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.event-item:hover .event-image img {
  transform: scale(1.05);
}

.event-content {
  flex: 1;
}

.event-date {
  font-size: 16px;
  color: var(--secondary-color);
  margin-bottom: 10px;
  font-weight: bold;
  text-align: right;
}

.event-title {
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 15px;
  font-family: 'Noto Serif SC', serif;
  text-align: right;
}

.event-preview {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: left;
}

.event-members {
  font-size: 14px;
  color: #888;
}

/* 媒体库样式 */
.media-gallery {
  margin-top: 20px;
}

.media-gallery h4 {
  font-size: 16px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.media-items {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  max-height: 120px;
  overflow-y: auto;
}

.media-item {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.media-item:hover {
  transform: scale(1.05);
}

.media-item.video {
  background-color: #000;
}

/* 空状态样式 */
.empty-events {
  text-align: center;
  padding: 100px 20px;
  color: #666;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.empty-events h3 {
  font-size: 24px;
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .event-item {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .event-image {
    flex: 0 0 250px;
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .events-title {
    font-size: 36px;
  }
  
  .event-title {
    font-size: 24px;
  }
  
  .event-item {
    padding: 20px;
  }
  
  .events-summary-container {
    width: 95%;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  width: 100%;
  box-sizing: border-box;
}

.modal-header h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 24px;
  font-family: 'Noto Serif SC', serif;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: var(--text-color);
  font-size: 16px;
}

.form-group label.required::after {
  content: ' *';
  color: #ff4d4f;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

.form-input.error,
.form-textarea.error {
  border-color: #ff4d4f;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.error-message {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 4px;
}

.character-count {
  color: #999;
  font-size: 14px;
  text-align: right;
  margin-top: 4px;
}

/* 内容标签行 - 包含标签和AI按钮 */
.content-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

/* AI按钮容器 */
.ai-buttons {
  display: flex;
  gap: 8px;
}

/* AI润色按钮 */
.ai-polish-button {
  background-color: transparent;
  color: #999;
  border: 1px solid #d9d9d9;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ai-polish-button:hover:not(:disabled) {
  background-color: #f5f5f5;
  color: #666;
  border-color: #c0c0c0;
}

.ai-polish-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* AI生成按钮 */
.ai-generate-button {
  background-color: transparent;
  color: #999;
  border: 1px solid #d9d9d9;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ai-generate-button:hover:not(:disabled) {
  background-color: #f5f5f5;
  color: #666;
  border-color: #c0c0c0;
}

.ai-generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* AI润色结果展示区 */
.ai-polish-result {
  margin-top: 20px;
  padding: 16px;
  background-color: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
}

.ai-polish-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ai-polish-result-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e40af;
}

.ai-polish-actions {
  display: flex;
  gap: 8px;
}

.use-polished-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.use-polished-button:hover {
  background-color: var(--secondary-color);
}

.close-polished-button {
  background-color: white;
  color: #666;
  border: 1px solid #d9d9d9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-polished-button:hover {
  background-color: #f5f5f5;
  border-color: #c0c0c0;
}

.ai-polished-content {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

/* 文件上传样式 */
.file-upload-area {
  margin-bottom: 12px;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.file-upload-label:hover {
  border-color: var(--primary-color);
  background-color: rgba(82, 196, 26, 0.04);
}

.upload-icon {
  font-size: 48px;
  color: #999;
  margin-bottom: 12px;
  transition: color 0.3s;
}

.file-upload-label:hover .upload-icon {
  color: var(--primary-color);
}

.file-input {
  display: none;
}

.file-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 文件预览样式 */
.file-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.file-preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-content {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

.file-name {
  display: block;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  display: block;
  font-size: 11px;
  color: #666;
}

.delete-file-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 77, 79, 0.9);
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.8;
}

.delete-file-btn:hover {
  opacity: 1;
  background-color: #ff4d4f;
}

/* 表单按钮样式 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.cancel-button,
.submit-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.cancel-button {
  background-color: white;
  border: 1px solid #d9d9d9;
  color: var(--text-color);
}

.cancel-button:hover {
  background-color: #f5f5f5;
  border-color: #c0c0c0;
}

.submit-button {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式模态框 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-button,
  .submit-button {
    width: 100%;
  }
  
  .file-preview-container {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>