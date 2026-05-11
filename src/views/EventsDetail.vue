<template>
  <!-- 导航栏 -->
  <Navbar />
  
  <!-- 事件详情页 -->
  <div class="event-detail-container">
    <!-- 详情页顶部 -->
    <div class="event-detail-header">
      <button class="back-button" @click="goBack">
        <span class="back-icon">&lt;</span> 返回
      </button>
      <h1 class="event-detail-title">{{ eventDetail.title }}</h1>
      <div class="header-placeholder"></div>
    </div>
    
    <!-- 详情内容区 -->
    <div class="event-detail-content">
      <!-- 1. 事件基本信息 -->
      <div class="event-basic-info">
        <div class="event-date">{{ formatDate(eventDetail.createdAt) }}</div>
        <div class="event-content">
          {{ eventDetail.content }}
        </div>
      </div>
      
      <!-- 2. 关联媒体区 -->
      <div class="event-media-section">
        <!-- 封面图 -->
        <div class="cover-image-container">
          <img 
            v-if="eventDetail.imageUrl" 
            :src="eventDetail.imageUrl" 
            :alt="eventDetail.title" 
            class="cover-image"
            @click="openImageViewer(eventDetail.imageUrl)"
          >
          <div v-else class="no-cover-image">
            <span class="no-image-icon">📷</span>
            <p>暂无封面图片</p>
          </div>
        </div>
        
        <!-- 所有上传的图片/视频 -->
        <div v-if="eventDetail.allImageUrls && eventDetail.allImageUrls.length > 1" class="all-media-container">
          <h3 class="media-section-title">相关媒体</h3>
          <div class="media-grid">
            <div 
              v-for="(url, index) in eventDetail.allImageUrls" 
              :key="index" 
              class="media-item"
            >
              <img 
                v-if="url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif')" 
                :src="url" 
                :alt="eventDetail.title + ' - ' + (index + 1)"
                class="media-thumbnail"
                @click="openImageViewer(url)"
              >
              <div v-else class="video-thumbnail-container">
                <video :src="url" class="media-thumbnail video-thumbnail" controls></video>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 3. 操作按钮区 -->
      <div class="event-actions">
        <div class="action-buttons">
          <button class="edit-button" @click="openEditModal()">
            修改
          </button>
          <button class="delete-button" @click="showDeleteModal = true">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图片查看器 -->
  <div class="image-viewer-overlay" v-if="imageViewerVisible" @click="closeImageViewer">
    <div class="image-viewer-content">
      <img v-if="currentImageUrl" :src="currentImageUrl" alt="Image View" class="viewer-image">
      <button class="close-viewer-button" @click="closeImageViewer">×</button>
    </div>
  </div>
  
  <!-- 修改弹框 -->
  <div class="modal-overlay" v-if="showEditModal" @click.self="showEditModal = false">
    <div class="modal-container">
      <div class="modal-header">
        <h2>修改家族大事记</h2>
        <button class="close-button" @click="showEditModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitEditEvent">
          <!-- 事件标题 -->
          <div class="form-group">
            <label for="edit-event-title" class="required">事件标题</label>
            <input 
              type="text" 
              id="edit-event-title" 
              v-model="editEventForm.title" 
              class="form-input" 
              placeholder="请输入事件标题（2-50字）"
              :class="{ 'error': validationErrors.title }"
            >
            <div class="error-message" v-if="validationErrors.title">{{ validationErrors.title }}</div>
          </div>
          
          <!-- 事件时间 -->
          <div class="form-group">
            <label for="edit-event-time" class="required">事件时间</label>
            <input 
              type="date" 
              id="edit-event-time" 
              v-model="editEventForm.eventTime" 
              class="form-input"
              :class="{ 'error': validationErrors.eventTime }"
            >
            <div class="error-message" v-if="validationErrors.eventTime">{{ validationErrors.eventTime }}</div>
          </div>
          
          <!-- 事件内容 -->
          <div class="form-group">
            <div class="content-label-row">
              <label for="edit-event-content" class="required">事件内容</label>
              <button class="ai-polish-button" @click="aiPolishContent" :disabled="isPolishing">
                <span v-if="isPolishing">润色中...</span>
                <span v-else>AI润色</span>
              </button>
            </div>
            <textarea 
              id="edit-event-content" 
              v-model="editEventForm.content" 
              class="form-textarea" 
              rows="6" 
              placeholder="请输入事件内容（10-500字）"
              :class="{ 'error': validationErrors.content }"
            ></textarea>
            <div class="error-message" v-if="validationErrors.content">{{ validationErrors.content }}</div>
            <div class="character-count">{{ editEventForm.content.length }}/500</div>
            
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
            <label for="edit-file-upload">上传图片/视频</label>
            <div class="file-upload-area">
              <label for="edit-file-upload" class="file-upload-label" 
                     @dragover.prevent="onDragOverEdit" 
                     @dragleave.prevent="onDragLeaveEdit"
                     @drop.prevent="onDropEdit">
                <span class="upload-icon">+</span>
                <span>点击或拖拽文件到此处上传</span>
                <input 
                  type="file" 
                  id="edit-file-upload" 
                  multiple 
                  accept="image/*,video/*" 
                  @change="handleFileUploadEdit"
                  class="file-input"
                >
              </label>
            </div>
            <p class="file-hint">支持上传图片和视频文件，可上传多个</p>
          </div>
          
          <!-- 文件预览 -->
          <div class="form-group" v-if="editUploadedFiles.length > 0">
            <label>已上传文件</label>
            <div class="file-preview-container">
              <div v-for="(file, index) in editUploadedFiles" :key="index" class="file-preview-item">
                <div class="preview-content">
                  <img v-if="file.type.startsWith('image/')" :src="file.previewUrl" alt="Preview" class="preview-image">
                  <video v-else-if="file.type.startsWith('video/')" :src="file.previewUrl" controls class="preview-video"></video>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button type="button" class="delete-file-btn" @click="deleteEditUploadedFile(index)" title="删除文件">
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="form-actions">
            <button type="button" class="cancel-button" @click="showEditModal = false">取消</button>
            <button type="submit" class="submit-button" :disabled="isEditing || !isEditFormValid">
              <span v-if="isEditing">提交中...</span>
              <span v-else>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <!-- 删除确认弹框 -->
  <div class="modal-overlay" v-if="showDeleteModal" @click.self="showDeleteModal = false">
    <div class="modal-container delete-modal">
      <div class="modal-header">
        <h2>确认删除</h2>
        <button class="close-button" @click="showDeleteModal = false">&times;</button>
      </div>
      <div class="modal-body delete-modal-body">
        <p class="delete-message">确定删除该事件吗？</p>
        <div class="form-actions delete-actions">
          <button type="button" class="cancel-button" @click="showDeleteModal = false">取消</button>
          <button type="button" class="delete-button" @click="confirmDelete">
            <span v-if="isDeleting">删除中...</span>
            <span v-else>删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Auth from '../utils/auth.js'
import API_CONFIG, { apiRequest } from '@/api/api-config.js'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const auth = new Auth()

// 事件详情数据
const eventDetail = ref({
  id: '',
  title: '',
  content: '',
  createdAt: '',
  imageUrl: '',
  allImageUrls: []
})

// 图片查看器
const imageViewerVisible = ref(false)
const currentImageUrl = ref('')

// 修改弹框相关
const showEditModal = ref(false)
const isEditing = ref(false)
const isEditFormValid = ref(false)
const editUploadedFiles = ref([])

const editEventForm = reactive({
  title: '',
  eventTime: '',
  content: ''
})

const validationErrors = reactive({
  title: '',
  eventTime: '',
  content: ''
})

// 删除弹框相关
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// AI润色相关
const isPolishing = ref(false)
const polishedContent = ref('')

// AI生成相关
const isGenerating = ref(false)

// 拖拽上传事件处理（修改弹框）
const isDraggingEdit = ref(false)

// 页面初始化
onMounted(async () => {
  checkLoginStatus()
  await loadEventDetail()
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 检查登录状态
const checkLoginStatus = () => {
  if (!auth.isLoggedIn()) {
    router.push('/')
  }
}

// 返回上一页
const goBack = () => {
  router.push('/events-summary')
}

// 加载事件详情
const loadEventDetail = async () => {
  try {
    // 获取事件ID
    const eventId = route.params.id
    if (!eventId) {
      console.error('未找到事件ID')
      return
    }
    
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

    // 构造URL
    const url = new URL(API_CONFIG.baseURL + API_CONFIG.paths.event.list)
    url.searchParams.append('pageNum', '1')
    url.searchParams.append('pageSize', '10')

    // 调用API获取大事记列表，然后找到当前事件
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
      }
    })

    const data = await response.json()
    
    if (data.code === 200 && data.data && data.data.list) {
      // 找到当前事件
      const currentEvent = data.data.list.find(item => item.eventId == eventId)
      if (currentEvent) {
        // 处理返回的数据
        const imageUrls = currentEvent.imageUrl ? currentEvent.imageUrl.split(',').map(url => fixImageUrl(url)) : []
        eventDetail.value = {
          id: currentEvent.eventId,
          title: currentEvent.title,
          content: currentEvent.content,
          createdAt: currentEvent.eventTime,
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
          allImageUrls: imageUrls
        }
      } else {
        console.error('未找到事件详情')
      }
    } else {
      console.error('获取大事记失败:', data.msg || '未知错误')
    }
  } catch (error) {
    console.error('加载大事记详情错误:', error)
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

// 打开图片查看器
const openImageViewer = (url) => {
  currentImageUrl.value = url
  imageViewerVisible.value = true
}

// 关闭图片查看器
const closeImageViewer = () => {
  imageViewerVisible.value = false
  currentImageUrl.value = ''
}

// ESC键关闭图片查看器
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && imageViewerVisible.value) {
    closeImageViewer()
  }
}

// 打开修改弹框
const openEditModal = () => {
  // 填充当前事件数据
  editEventForm.title = eventDetail.value.title
  editEventForm.eventTime = eventDetail.value.createdAt.split('T')[0]
  editEventForm.content = eventDetail.value.content
  
  // 清空之前的上传文件
  editUploadedFiles.value = []
  
  // 添加现有文件到预览
  if (eventDetail.value.allImageUrls && eventDetail.value.allImageUrls.length > 0) {
    eventDetail.value.allImageUrls.forEach((url, index) => {
      // 判断文件类型
      const isImage = url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif')
      const fileName = `existing-file-${index + 1}.${isImage ? 'jpg' : 'mp4'}`
      
      // 添加到上传文件列表
      editUploadedFiles.value.push({
        name: fileName,
        type: isImage ? 'image/jpeg' : 'video/mp4',
        size: 0,
        previewUrl: url,
        file: null, // 标记为已有文件
        isExisting: true
      })
    })
  }
  
  showEditModal.value = true
}

// 拖拽上传事件处理（修改弹框）
const onDragOverEdit = () => {
  isDraggingEdit.value = true
}

const onDragLeaveEdit = () => {
  isDraggingEdit.value = false
}

const onDropEdit = (event) => {
  isDraggingEdit.value = false
  const files = Array.from(event.dataTransfer.files)
  handleEditFiles(files)
}

// 处理文件上传（修改弹框）
const handleFileUploadEdit = (event) => {
  const files = Array.from(event.target.files)
  handleEditFiles(files)
  
  // 清空文件输入，允许再次选择相同文件
  event.target.value = ''
}

// 统一处理文件（修改弹框）
const handleEditFiles = (files) => {
  files.forEach(file => {
    // 验证文件类型
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('只能上传图片和视频文件')
      return
    }
    
    // 创建文件预览
    const reader = new FileReader()
    reader.onload = (e) => {
      editUploadedFiles.value.push({
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

// 删除已上传文件（修改弹框）
const deleteEditUploadedFile = (index) => {
  editUploadedFiles.value.splice(index, 1)
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
    // 提取相对路径，去掉域名部分，使用Vite代理
    const urlObj = new URL(url)
    return urlObj.pathname
  }
  
  // 如果是纯文件名，拼接相对路径
  let fixedUrl = url
  if (!fixedUrl.startsWith('/')) {
    fixedUrl = `/upload/${fixedUrl}`
  }
  
  return fixedUrl
}

// 验证修改表单
const validateEditForm = () => {
  let isValid = true
  
  // 重置错误信息
  validationErrors.title = ''
  validationErrors.eventTime = ''
  validationErrors.content = ''
  
  // 验证标题
  if (!editEventForm.title.trim()) {
    validationErrors.title = '事件标题不能为空'
    isValid = false
  } else if (editEventForm.title.length < 2) {
    validationErrors.title = '事件标题不能少于2个字符'
    isValid = false
  } else if (editEventForm.title.length > 50) {
    validationErrors.title = '事件标题不能超过50个字符'
    isValid = false
  }
  
  // 验证事件时间
  if (!editEventForm.eventTime) {
    validationErrors.eventTime = '事件时间不能为空'
    isValid = false
  } else {
    // 验证日期格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(editEventForm.eventTime)) {
      validationErrors.eventTime = '事件时间格式错误，应为YYYY-MM-DD'
      isValid = false
    }
  }
  
  // 验证内容
  if (!editEventForm.content.trim()) {
    validationErrors.content = '事件内容不能为空'
    isValid = false
  } else if (editEventForm.content.length < 10) {
    validationErrors.content = '事件内容不能少于10个字符'
    isValid = false
  } else if (editEventForm.content.length > 500) {
    validationErrors.content = '事件内容不能超过500个字符'
    isValid = false
  }
  
  return isValid
}

// 提交修改事件
const submitEditEvent = async () => {
  // 验证表单
  if (!validateEditForm()) {
    return
  }
  
  try {
    isEditing.value = true
    
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
      eventId: eventDetail.value.id,
      title: editEventForm.title.trim(),
      content: editEventForm.content.trim(),
      eventTime: editEventForm.eventTime
    }
    
    // 处理文件
    const uploadedUrls = []
    let uploadSuccess = true
    
    if (editUploadedFiles.value.length > 0) {
      for (const [index, uploadedFile] of editUploadedFiles.value.entries()) {
        try {
          if (uploadedFile.isExisting) {
            // 如果是已有文件，直接使用现有URL
            uploadedUrls.push(uploadedFile.previewUrl)
          } else if (uploadedFile.file) {
            // 如果是新上传的文件，上传到服务器
            const fileUrl = await uploadFile(uploadedFile.file)
            if (fileUrl) {
              uploadedUrls.push(fileUrl)
            }
          }
        } catch (error) {
          uploadSuccess = false
          alert(`第 ${index + 1} 个文件处理失败: ${error.message}`)
          break // 遇到失败，停止后续处理
        }
      }
      
      if (!uploadSuccess) {
        return // 处理失败，停止提交
      }
      
      if (uploadedUrls.length > 0) {
        formData.imageUrl = uploadedUrls.join(',')
      }
    }
    
    // 调用修改大事记API
    const response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.event.update, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
      },
      body: JSON.stringify(formData)
    })
    
    const data = await response.json()
    
    if (data.code === 200) {
      // 更新事件详情
      await loadEventDetail()
      
      // 关闭弹框
      showEditModal.value = false
      
      alert('家族大事记修改成功！')
    } else {
      alert(`修改失败：${data.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('修改大事记错误:', error)
    alert('修改大事记失败，请稍后重试')
  } finally {
    isEditing.value = false
  }
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

// 确认删除事件
const confirmDelete = async () => {
  try {
    isDeleting.value = true
    
    // 获取事件ID
    const eventId = route.params.id
    if (!eventId) {
      console.error('未找到事件ID')
      return
    }
    
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

    // 调用删除大事记API
    const response = await fetch(API_CONFIG.baseURL + API_CONFIG.paths.event.delete + `?eventId=${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
      }
    })

    const data = await response.json()
    
    if (data.code === 200) {
      // 关闭弹框
      showDeleteModal.value = false
      
      // 跳转到大事记列表页面
      router.push('/events-summary')
      
      alert('家族大事记删除成功！')
    } else {
      alert(`删除失败：${data.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('删除大事记错误:', error)
    alert('删除大事记失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

// AI润色内容
const aiPolishContent = async () => {
  if (!editEventForm.content.trim()) {
    alert('请先输入事件内容')
    return
  }
  
  try {
    isPolishing.value = true
    
    // 调用AI润色接口
    const response = await apiRequest(`${API_CONFIG.baseURL}${API_CONFIG.paths.ai.polish}`, {
      method: 'POST',
      body: JSON.stringify({
        content: editEventForm.content.trim(),
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
    editEventForm.content = polishedContent.value
    polishedContent.value = ''
  }
}

// AI生成内容
const aiGenerateContent = async () => {
  try {
    isGenerating.value = true
    
    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/')
      return
    }
    
    // 调用AI生成接口
    const response = await axios.post(`${API_CONFIG.baseURL}/api/ai/text/generate`, {
      title: editEventForm.title // 使用标题作为生成内容的提示
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data.code === 200 && response.data.data) {
      editEventForm.content = response.data.data
    } else {
      alert(`生成失败：${response.data.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('AI生成错误:', error)
    alert('AI生成失败，请稍后重试')
  } finally {
    isGenerating.value = false
  }
}

// 实时表单验证
watchEffect(() => {
  isEditFormValid.value = validateEditForm()
})
</script>

<style scoped>
/* 事件详情页样式 */
.event-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  background-color: #f8f3e9;
  min-height: 100vh;
}

/* 详情页顶部 */
.event-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0d9c5;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  border: none;
  color: var(--primary-color);
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: rgba(82, 196, 26, 0.1);
}

.back-icon {
  font-size: 20px;
}

.event-detail-title {
  font-size: 32px;
  color: var(--primary-color);
  font-family: 'Noto Serif SC', serif;
  margin: 0;
  text-align: center;
  flex: 1;
}

.header-placeholder {
  width: 80px;
}

/* 详情内容区 */
.event-detail-content {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 事件基本信息 */
.event-basic-info {
  margin-bottom: 40px;
}

.event-date {
  font-size: 18px;
  color: var(--secondary-color);
  margin-bottom: 20px;
  font-weight: bold;
}

.event-content {
  font-size: 18px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 关联媒体区 */
.event-media-section {
  margin-bottom: 40px;
}

/* 封面图 */
.cover-image-container {
  margin-bottom: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.cover-image-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
}

.no-cover-image {
  width: 100%;
  height: 300px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
}

.no-image-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 所有上传的图片/视频 */
.all-media-container {
  margin-top: 40px;
}

.media-section-title {
  font-size: 20px;
  color: var(--primary-color);
  margin-bottom: 20px;
  font-family: 'Noto Serif SC', serif;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.media-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
  position: relative;
}

.media-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.media-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.video-thumbnail-container {
  position: relative;
  width: 100%;
  height: 150px;
  background-color: #000;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--primary-color);
  font-size: 20px;
  font-weight: bold;
}

/* 操作按钮区 */
.event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0d9c5;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.edit-button {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button:hover {
  background-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.delete-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-button:hover {
  background-color: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

/* 图片查看器 */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  cursor: pointer;
}

.image-viewer-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  cursor: default;
}

.viewer-image {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
}

.close-viewer-button {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.close-viewer-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

/* 修改弹框样式 */
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

/* 内容标签行 - 包含标签和AI润色按钮 */
.content-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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

/* 删除确认弹框 */
.delete-modal {
  max-width: 400px;
}

.delete-modal-body {
  text-align: center;
}

.delete-message {
  font-size: 18px;
  margin-bottom: 32px;
  color: #333;
}

.delete-actions {
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .event-detail-container {
    padding: 20px;
  }
  
  .event-detail-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .event-detail-title {
    font-size: 24px;
  }
  
  .header-placeholder {
    display: none;
  }
  
  .event-detail-content {
    padding: 20px;
  }
  
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
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
  
  .close-viewer-button {
    right: 10px;
    top: -30px;
  }
}
</style>