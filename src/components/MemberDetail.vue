<template>
  <div class="member-detail-container">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <button class="back-button" @click="goBack">返回家族树</button>
      <h1 class="detail-title">成员详情</h1>
      <div class="action-buttons" v-if="isAdmin">
        <button class="edit-button" @click="toggleEditMode">
          {{ isEditing ? '取消编辑' : '编辑信息' }}
        </button>
        <button class="delete-button" @click="confirmDelete">删除成员</button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="detail-content">
      <!-- 成员基本信息卡片 -->
      <div class="info-card">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img 
              :src="member.avatarUrl || defaultAvatar" 
              :alt="member.name" 
              class="member-avatar"
            >
            <button 
              class="change-avatar-button" 
              v-if="isEditing" 
              @click="triggerAvatarUpload"
            >
              更换头像
            </button>
            <input 
              type="file" 
              ref="avatarInput" 
              style="display: none;" 
              accept="image/*"
              @change="handleAvatarUpload"
            >
          </div>
        </div>

        <!-- 基本信息表单 -->
        <div class="info-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.name" 
                :disabled="!isEditing"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label">性别</label>
              <select 
                class="form-select" 
                v-model="formData.gender" 
                :disabled="!isEditing"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">出生日期</label>
              <input 
                type="date" 
                class="form-input" 
                v-model="formData.birthDate" 
                :disabled="!isEditing"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label">逝世日期</label>
              <input 
                type="date" 
                class="form-input" 
                v-model="formData.deathDate" 
                :disabled="!isEditing"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">定居地</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.residence" 
                :disabled="!isEditing"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label">职业</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="formData.occupation" 
                :disabled="!isEditing"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label">成员简介</label>
              <textarea 
                class="form-textarea" 
                v-model="formData.biography" 
                :disabled="!isEditing"
                rows="6"
                placeholder="请输入成员简介（最多支持65535字符）"
              ></textarea>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="save-section" v-if="isEditing">
            <button class="save-button" @click="saveChanges">保存修改</button>
          </div>
        </div>
      </div>

      <!-- 成员图片展示区域 -->
      <div class="images-section">
        <h2 class="section-title">成员图片</h2>
        <div class="images-container">
          <!-- 现有图片 -->
          <div 
            v-for="(image, index) in member.images" 
            :key="index" 
            class="image-item"
          >
            <img :src="image" :alt="`${member.name}的图片${index + 1}`" class="member-image">
            <button 
              class="delete-image-button" 
              v-if="isEditing" 
              @click="deleteImage(index)"
            >
              删除
            </button>
          </div>

          <!-- 上传图片区域 -->
          <div class="upload-image-area" v-if="isEditing">
            <button class="upload-button" @click="triggerImageUpload">
              + 上传图片
            </button>
            <input 
              type="file" 
              ref="imageInput" 
              style="display: none;" 
              accept="image/*"
              multiple
              @change="handleImageUpload"
            >
          </div>

          <!-- 无图片提示 -->
          <div class="no-images" v-if="member.images.length === 0">
            <p>暂无图片</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由和导航
const route = useRoute()
const router = useRouter()

// 默认头像
const defaultAvatar = '/img/account_head.jpg'

// 成员数据
const member = reactive({
  id: '',
  name: '',
  gender: '男',
  birthDate: '',
  deathDate: '',
  residence: '',
  occupation: '',
  avatarUrl: '',
  biography: '',
  images: []
})

// 编辑模式
const isEditing = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  gender: '男',
  birthDate: '',
  deathDate: '',
  residence: '',
  occupation: '',
  biography: ''
})

// 判断是否为管理员
const isAdmin = ref(true) // 实际项目中应从全局状态或路由获取

// 文件输入引用
const avatarInput = ref(null)
const imageInput = ref(null)

// 返回家族树
const goBack = () => {
  router.push('/family')
}

// 切换编辑模式
const toggleEditMode = () => {
  if (isEditing.value) {
    // 取消编辑，恢复原始数据
    resetFormData()
  } else {
    // 进入编辑模式，复制当前数据到表单
    copyMemberToForm()
  }
  isEditing.value = !isEditing.value
}

// 将成员数据复制到表单
const copyMemberToForm = () => {
  formData.name = member.name
  formData.gender = member.gender
  formData.birthDate = member.birthDate
  formData.deathDate = member.deathDate
  formData.residence = member.residence
  formData.occupation = member.occupation
  formData.biography = member.biography
}

// 重置表单数据
const resetFormData = () => {
  copyMemberToForm()
}

// 保存修改
const saveChanges = () => {
  // 验证表单数据
  if (!formData.name.trim()) {
    alert('请输入成员姓名')
    return
  }

  // 更新成员数据
  member.name = formData.name
  member.gender = formData.gender
  member.birthDate = formData.birthDate
  member.deathDate = formData.deathDate
  member.residence = formData.residence
  member.occupation = formData.occupation
  member.biography = formData.biography

  // 模拟保存到后端
  console.log('保存成员信息:', member)

  // 退出编辑模式
  isEditing.value = false
}

// 确认删除
const confirmDelete = () => {
  if (confirm('确定要删除该成员吗？')) {
    // 模拟删除操作
    console.log('删除成员:', member.id)
    // 返回家族树
    goBack()
  }
}

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理头像上传
const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 模拟上传，实际项目中应调用上传接口
    const reader = new FileReader()
    reader.onload = (e) => {
      member.avatarUrl = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 触发图片上传
const triggerImageUpload = () => {
  imageInput.value?.click()
}

// 处理图片上传
const handleImageUpload = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    // 模拟上传，实际项目中应调用上传接口
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (e) => {
        member.images.push(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }
}

// 删除图片
const deleteImage = (index) => {
  if (confirm('确定要删除这张图片吗？')) {
    member.images.splice(index, 1)
  }
}

// 模拟从后端获取成员数据
const fetchMemberData = () => {
  try {
    // 实际项目中应根据路由参数中的memberId从后端获取数据
    const memberId = route.params.id
    console.log('路由参数:', route.params)
    console.log('获取成员数据，id:', memberId)

    // 模拟数据
    const mockMember = {
      id: memberId,
      name: '陈卫国',
      gender: '男',
      birthDate: '1965-09-25',
      deathDate: '',
      residence: '广东',
      occupation: '教师',
      avatarUrl: '',
      biography: '陈卫国，1965年出生于广东省，1987年毕业于华南师范大学，毕业后一直在当地中学担任数学教师，培养了许多优秀学生。他热爱教育事业，为人师表，深受学生和家长的尊敬和喜爱。',
      images: [
        'https://via.placeholder.com/300x200',
        'https://via.placeholder.com/300x200'
      ]
    }

    // 更新成员数据
    console.log('更新前的member数据:', member)
    Object.assign(member, mockMember)
    console.log('更新后的member数据:', member)
    
    // 初始化表单数据
    copyMemberToForm()
    console.log('表单数据已初始化:', formData)
  } catch (error) {
    console.error('获取成员数据失败:', error)
    // 出错时使用默认数据
    const defaultMember = {
      id: 'default',
      name: '默认成员',
      gender: '男',
      birthDate: '1990-01-01',
      deathDate: '',
      residence: '北京',
      occupation: '工程师',
      avatarUrl: '',
      biography: '这是一个默认成员的简介。',
      images: []
    }
    Object.assign(member, defaultMember)
    copyMemberToForm()
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('MemberDetail组件已挂载')
  fetchMemberData()
  // 强制更新，确保视图能够显示最新数据
  setTimeout(() => {
    console.log('强制更新成员数据')
    Object.assign(member, member)
  }, 100)
})
</script>

<style scoped>
.member-detail-container {
  width: 100%;
  min-height: 100vh;
  /* 使用家族展厅第一页的背景色 */
  background-color: #F5F0E6;
  padding: 20px;
  box-sizing: border-box;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  background-color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.back-button {
  background-color: #436c85;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.back-button:hover {
  background-color: #3a5d73;
}

.detail-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.edit-button {
  background-color: #436c85;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.edit-button:hover {
  background-color: #3a5d73;
}

.delete-button {
  background-color: #deb4b2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.delete-button:hover {
  background-color: #d1a19f;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  width: 100%;
}

.avatar-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.member-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4a90e2;
}

.change-avatar-button {
  margin-top: 10px;
  background-color: #436c85;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.change-avatar-button:hover {
  background-color: #3a5d73;
}

.info-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group.full-width {
  flex: 100%;
  min-width: auto;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.save-section {
  display: flex;
  justify-content: flex-end;
}

.save-button {
  background-color: #436c85;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.save-button:hover {
  background-color: #3a5d73;
}

.images-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.images-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  width: 200px;
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.member-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-image-button {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(231, 76, 60, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-image-button:hover {
  background-color: rgba(231, 76, 60, 1);
}

.upload-image-area {
  width: 200px;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f9f9f9;
}

.upload-button {
  background-color: #436c85;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.upload-button:hover {
  background-color: #3a5d73;
}

.no-images {
  width: 100%;
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-card {
    flex-direction: column;
    align-items: center;
  }

  .avatar-section {
    width: auto;
  }

  .form-row {
    flex-direction: column;
  }

  .form-group {
    min-width: auto;
  }
}
</style>