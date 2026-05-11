<template>
  <!-- 导航栏 -->
  <Navbar />
  
  <!-- 移出滑动容器的图片容器，使用绝对定位 -->
  <div id="story-image-container" class="story-image-container absolute-image-container">
    <!-- 图片将通过JS动态加载 -->
    <div v-if="!currentStoryImage" class="default-story-image" style="display: none;">
      <p>暂无家族大事记</p>
    </div>
    <div v-else class="story-image" :style="{ backgroundImage: `url(${currentStoryImage})` }"></div>
  </div>
  
  <!-- 三屏滑动容器 - 修改为垂直滚动布局 -->
  <div class="page-sections-container">
    <!-- 第一屏：家族树 -->
    <div class="page-section" id="section-1">
      <FamilyTree :is-admin="isAdmin" @member-updated="handleMemberUpdated" />
    </div>
    
    <!-- 第二屏：家族大事记模块 -->
    <div class="page-section" id="section-2">
      <FamilyStory :is-admin="isAdmin" v-model:current-story-image="currentStoryImage" />
    </div>

    <!-- 第三屏：成员迁徙模块 -->
    <div class="page-section" id="section-3">
      <FamilyMap :is-admin="isAdmin" v-model:family-stats="familyStats" ref="familyMapRef" />
    </div>
  </div>

  <!-- 添加/编辑成员模态框 -->
  <div id="member-modal" class="modal" v-if="showMemberModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title">{{ isEditingMember ? '编辑家族成员' : '添加家族成员' }}</h3>
        <span class="close" @click="closeMemberModal">&times;</span>
      </div>
      <div class="modal-body">
        <form id="member-form" @submit.prevent="submitMemberForm">
          <div class="form-group">
            <label for="member-name" class="traditional-label">姓名 *</label>
            <input type="text" id="member-name" name="name" required class="traditional-input" v-model="modalMember.name">
          </div>
          <div class="form-group">
            <label for="member-generation" class="traditional-label">代数 *</label>
            <input type="number" id="member-generation" name="generation" required class="traditional-input" v-model="modalMember.generation">
          </div>
          <div class="form-group">
            <label for="member-gender" class="traditional-label">性别</label>
            <select id="member-gender" name="gender" class="traditional-select" v-model="modalMember.gender">
              <option value="">未知</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div class="form-group">
            <label for="member-birth-date" class="traditional-label">生日</label>
            <input type="date" id="member-birth-date" name="birthDate" class="traditional-input" v-model="modalMember.birthDate">
          </div>
          <div class="form-group">
            <label for="member-death-date" class="traditional-label">逝世日期</label>
            <input type="date" id="member-death-date" name="deathDate" class="traditional-input" v-model="modalMember.deathDate">
          </div>
          <div class="form-group">
            <label for="member-occupation" class="traditional-label">职业</label>
            <input type="text" id="member-occupation" name="occupation" class="traditional-input" v-model="modalMember.occupation">
          </div>
          <div class="form-group">
            <label for="member-biography" class="traditional-label">简介</label>
            <textarea id="member-biography" name="biography" rows="3" class="traditional-input" v-model="modalMember.biography"></textarea>
          </div>
          <div class="form-group">
            <label for="member-birth-year" class="traditional-label">出生年份</label>
            <input type="number" id="member-birth-year" name="birthYear" class="traditional-input" v-model="modalMember.birthYear">
          </div>
          <div class="form-group">
            <label for="member-residence" class="traditional-label">定居地</label>
            <input type="text" id="member-residence" name="residence" class="traditional-input" v-model="modalMember.residence">
          </div>
          <div class="form-group">
            <label for="member-residence-start-year" class="traditional-label">定居开始年份</label>
            <input type="number" id="member-residence-start-year" name="residenceStartYear" class="traditional-input" v-model="modalMember.residenceStartYear">
          </div>
          <div class="form-group">
            <label for="member-parent-id" class="traditional-label">父节点ID（可选，留空表示根节点）</label>
            <input type="text" id="member-parent-id" name="parentId" class="traditional-input" v-model="modalMember.parentId">
          </div>
          <div class="form-actions">
            <button type="button" id="cancel-btn" class="btn-secondary traditional-btn" @click="closeMemberModal">取消</button>
            <button type="submit" id="submit-btn" class="btn-primary traditional-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 删除确认模态框 -->
  <div id="delete-modal" class="modal" v-if="showDeleteModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>确认删除</h3>
        <span class="close" @click="closeDeleteModal">&times;</span>
      </div>
      <div class="modal-body">
        <p>确定要删除此家族成员吗？此操作不可恢复。</p>
        <div class="form-actions">
          <button type="button" id="delete-cancel" class="btn-secondary traditional-btn" @click="closeDeleteModal">取消</button>
          <button type="button" id="delete-confirm" class="btn-danger traditional-btn" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import Navbar from '../components/Navbar.vue'
import FamilyTree from '../components/FamilyTree.vue'
import FamilyStory from '../components/FamilyStory.vue'
import FamilyMap from '../components/FamilyMap.vue'

// 用户权限
const isAdmin = computed(() => {
  const currentFamilyRole = localStorage.getItem('currentFamilyRole')
  return currentFamilyRole === 'admin' || currentFamilyRole === '管理员' || currentFamilyRole === '2'
})

// 统计数据状态
const familyStats = ref({
  memberTotal: 0,
  familyGeneration: 0,
  eventTotal: 0
})

// 模态框相关
const showMemberModal = ref(false)
const showDeleteModal = ref(false)
const isEditingMember = ref(false)
const modalMember = reactive({
  name: '',
  generation: '',
  gender: '',
  birthDate: '',
  deathDate: '',
  occupation: '',
  biography: '',
  birthYear: '',
  residence: '',
  residenceStartYear: '',
  parentId: ''
})

// 家族大事记相关 - 仅保留必要的共享状态
const currentStoryImage = ref('')

// 组件引用
const familyMapRef = ref(null)

// 处理成员更新事件
const handleMemberUpdated = async () => {
  console.log('成员信息更新，准备更新迁徙地图')
  if (familyMapRef.value && typeof familyMapRef.value.updateMigrationMap === 'function') {
    await familyMapRef.value.updateMigrationMap()
    console.log('迁徙地图已更新')
  }
}

// 初始化页面
onMounted(async () => {
  console.log('Family page loaded')
  console.log('Home.vue传递的role值:', localStorage.getItem('currentFamilyRole'))
  console.log('当前是否为管理员:', isAdmin.value)
  
  // 初始化滚动监听
  initScrollListener()
})





































// 初始化滚动监听（恢复family.html的滚动行为）
const initScrollListener = () => {
  const container = document.querySelector('.page-sections-container')
  if (!container) return
  
  let isScrolling = false
  let currentScreen = 1
  
  // 监听滚动事件
  container.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true
      
      // 使用requestAnimationFrame优化性能
      requestAnimationFrame(() => {
        const scrollTop = container.scrollTop
        const screenHeight = window.innerHeight
        
        // 计算当前屏幕索引
        const newScreen = Math.round((scrollTop + screenHeight / 2) / screenHeight)
        
        // 如果屏幕发生变化
        if (newScreen !== currentScreen) {
          currentScreen = newScreen
          console.log('当前屏幕:', currentScreen)
          
          // 这里可以添加屏幕切换时的逻辑
          // 例如：加载第三屏数据等
          if (currentScreen === 3) {
            // 当滚动到第三屏时，可以加载迁徙地图数据
            console.log('滚动到第三屏，加载迁徙地图数据')
          }
        }
        
        isScrolling = false
      })
    }
  }, { passive: true })
}

// 平滑滚动到指定屏
const scrollToScreen = (screenIndex) => {
  const container = document.querySelector('.page-sections-container')
  if (!container) return
  
  const screenHeight = window.innerHeight
  const targetScrollTop = (screenIndex - 1) * screenHeight
  
  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  })
}

// 模态框相关方法
const openMemberModal = (member = null) => {
  if (member) {
    // 编辑模式
    isEditingMember.value = true
    Object.assign(modalMember, member)
  } else {
    // 添加模式
    isEditingMember.value = false
    Object.keys(modalMember).forEach(key => {
      modalMember[key] = ''
    })
  }
  showMemberModal.value = true
}

const closeMemberModal = () => {
  showMemberModal.value = false
}

const submitMemberForm = () => {
  // 这里实现提交表单的逻辑
  console.log('提交成员表单:', modalMember)
  closeMemberModal()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const confirmDelete = () => {
  // 这里实现确认删除的逻辑
  console.log('确认删除节点')
  closeDeleteModal()
}

// 组件卸载前清理
onUnmounted(() => {
  // 清理工作由子组件自己处理
})


</script>

<style scoped>
/* 三屏滑动容器 - 垂直滚动布局 */
.page-sections-container {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative;
  background-color: var(--background-color); /* 添加背景色，解决白色区域问题 */
}

/* 隐藏滚动条但保留滚动功能 */
.page-sections-container::-webkit-scrollbar {
  display: none;
}

.page-sections-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 单屏样式 - 每屏占据整个视口 */
.page-section {
  min-height: 100vh;
  padding-top: 60px; /* 为导航栏留出空间 */
  position: relative;
  scroll-snap-align: start;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
  background-color: transparent;
}

/* 第三屏：成员迁徙模块 - 向下移动 */
.page-section#section-3 {
  margin-top: 40px; /* 向下移动40px */
}
/* 第一屏布局 */
.first-screen-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.left-column {
  width: 66.67%;
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.right-column {
  width: 33.33%;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px; /* 间距缩小为原来的一半 */
}

.fixed-sidebar {
  position: relative;
  height: 100%;
  overflow-y: auto;
  border: 1px solid #1A365D;
  background-color: #F5F0E6;
}/* 主容器样式 */
.main-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 家族树样式 */
.family-tree {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 20px;
  cursor: grab;
}

/* 家族树区域 */
.family-tree-area {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: var(--background-color); /* 使用全局背景色，解决白色区域问题 */
}

.family-tree:active {
  cursor: grabbing;
}

/* 树的根节点容器，用于居中 */
.tree-root {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 家族树节点样式 - 只影响左侧家族树区域 */
.family-tree-area .tree-node {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  min-width: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.family-tree-area .tree-node:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.family-tree-area .tree-node.selected {
  transform: scale(1.1);
  box-shadow: 0 0 0 3px #ff9800;
  z-index: 101;
}

/* 根节点特定样式 - 只影响左侧家族树区域 */
.family-tree-area .tree-node.root-node {
  background-color: #fdd835; /* 更深的黄色背景 */
  width: 50px;
  height: 50px;
  border-radius: 50%; /* 圆形 */
  border: 2px solid #d4af37;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 男性节点 */
.family-tree-area .tree-node.male {
  background-color: #164962;
  border-color: #164962;
}

.family-tree-area .tree-node.male .node-content {
  color: white;
}

/* 女性节点 */
.family-tree-area .tree-node.female {
  background-color: #f48fb1;
  border-color: #f48fb1;
}

.family-tree-area .tree-node.female .node-content {
  color: white;
}

/* 姓名名片颜色 - 男生蓝色，女生粉色 */
.basic-info-display {
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.basic-info-display.male {
  background-color: rgba(22, 73, 98, 0.1);
  border: 1px solid #164962;
}

.basic-info-display.female {
  background-color: rgba(244, 143, 177, 0.1);
  border: 1px solid #f48fb1;
}

/* 节点内容样式 */
.node-content {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

/* 管理员功能栏内部间距控制 */
#admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px; /* 进一步减小间距 */
}

/* 标题间距 */
.section-title {
  margin-bottom: 0; /* 重置margin，使用gap控制 */
}

.current-node {
  font-size: 14px;
  color: #1A365D;
  text-align: left;
  margin-bottom: 10px;
}

.divider {
  height: 1px;
  background-color: #1A365D;
  width: 100%;
  margin-bottom: 15px;
}

.section-header {
  font-weight: bold;
  font-size: 16px;
  color: #1A365D;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: none;
}

/* 重置内部元素的margin，使用gap控制间距 */
.relationship-management,
.basic-info-card,
.operation-area {
  margin: 0;
}

/* 表单样式优化 - 减小字段间距 */
.form-group {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

/* 标签样式 - 右对齐 */
.traditional-label {
  display: inline-block;
  width: 90px;
  font-weight: 500;
  margin-right: 15px;
  text-align: right;
  flex-shrink: 0;
  color: var(--text-color);
}

/* 性别选择样式优化 - 水平排列 */
.gender-select {
  display: flex;
  gap: 20px;
  align-items: center;
  margin: 0;
}

/* 性别选项样式 */
.gender-select label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}

/* 输入框样式优化 - 填充剩余空间 */
.traditional-input {
  width: 200px;
  padding: 8px 12px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #1A365D;
  border-radius: 4px;
  background-color: white;
}

/* 文本域样式优化 - 标签和文本域在同一行 */
.form-group.textarea-group {
  align-items: flex-start;
}

.form-group.textarea-group .traditional-label {
  margin-top: 8px;
}

.form-group.textarea-group .traditional-input {
  min-height: 60px;
  resize: vertical;
}

/* 错误提示样式 - 位置正确 */
.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
  margin-left: 105px;
  display: block;
  width: calc(100% - 105px);
}

/* 紧凑表单布局，确保所有字段在一页内显示 */
.basic-info-card {
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

/* 关系管理按钮组 */
.relationship-management {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.relationship-management .btn-secondary {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #1A365D;
  background-color: #F5F0E6;
  color: #1A365D;
  cursor: pointer;
}

.relationship-management .btn-secondary:hover {
  background-color: #1A365D;
  color: white;
}

/* 操作按钮区 */
.operation-area {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-start;
  align-items: center;
}

/* 表单操作按钮区域 */
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.form-actions .btn-primary, .operation-area .btn-primary {
  padding: 6px 16px;
  font-size: 14px;
  background-color: #1A365D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.operation-area .btn-danger {
  padding: 6px 16px;
  font-size: 14px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 优化basic-info-card内部间距 */
.basic-info-card {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  border: none;
}
/* 第二屏布局 - 参考family.html样式 */
.stories-container.horizontal-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 第二屏容器 */
.family-modules.stories-section {
  width: 100%;
  height: 100%;
  padding: 40px 20px;
  background-image: url('/img/2.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.family-modules.stories-section .module-container {
  width: 100%;
  max-width: 1200px;
  height: 80%;
}

.family-modules.stories-section .module-content {
  height: calc(100% - 60px);
}

.story-image-container {
  width: 40%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 绝对定位的图片容器 */
.absolute-image-container {
  position: fixed;
  top: 120px; /* 导航栏高度 + 上边距 */
  left: 10%;
  width: 40%;
  height: 60vh;
  z-index: 999; /* 高于滑动容器 */
  pointer-events: none; /* 允许点击穿透到下方内容 */
  background-color: transparent; /* 确保背景透明 */
}

/* 标题容器占满宽度 */
.full-width {
  width: 100%;
}

.story-image-container .story-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease;
  animation: fadeIn 1s ease-in-out;
}

/* 故事标题布局 - 参考family.html样式 */
.story-titles.vertical-titles {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 30px;
  padding: 40px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  overflow-x: auto;
  overflow-y: hidden;
}

/* 单个故事标题 */
.story-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  padding: 20px 10px;
  cursor: pointer;
  transition: all 0.5s ease;
  border-right: 4px solid transparent;
  position: relative;
  opacity: 0;
  animation: slideInRight 0.8s ease-out forwards;
}

/* 入场动画延迟 */
.story-title:nth-child(1) { animation-delay: 0.1s; }
.story-title:nth-child(2) { animation-delay: 0.2s; }
.story-title:nth-child(3) { animation-delay: 0.3s; }
.story-title:nth-child(4) { animation-delay: 0.4s; }
.story-title:nth-child(5) { animation-delay: 0.5s; }

/* 鼠标悬停效果 */
.story-title:hover {
  color: var(--primary-color);
  transform: translateX(-10px);
  border-right-color: var(--primary-color);
  background-color: rgba(22, 73, 98, 0.1);
}

/* 激活状态 */
.story-title.active {
  color: var(--primary-color);
  border-right-color: var(--primary-color);
  background-color: rgba(22, 73, 98, 0.1);
  transform: translateX(-10px);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 第二屏背景 */
.family-modules.stories-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.family-modules.stories-section > * {
  position: relative;
  z-index: 2;
}
/* 第三屏布局 - 参考family.html样式 */
.third-screen-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.third-screen-layout .left-column {
  width: 30%;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.third-screen-layout .right-column {
  width: 70%;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 第三屏容器 - 参考family.html样式 */
.family-modules {
  width: 100%;
  height: 100%;
  padding: 40px 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.family-modules .module-container {
  width: 100%;
  max-width: 1200px;
  height: 90%;
}

.family-modules .module-content {
  height: calc(100% - 60px);
  overflow: hidden;
}

/* 家族信息容器 - 参考family.html样式 */
.family-info-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.family-info-container .stats-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.family-info-container .stats-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  justify-content: space-around;
}

/* 迁徙地图容器 - 参考family.html样式 */
.migration-map {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.migration-map .map-container {
  flex: 1;
  min-height: 500px;
  overflow: hidden;
}

#china-map {
  width: 100% !important;
  height: 100% !important;
}

.migration-map .migration-info {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  overflow: hidden;
}

/* 统计信息样式 */
.loading-container,
.error-container {
  text-align: center;
  padding: 20px;
  color: var(--text-color);
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-card {
  padding: 15px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

/* 模态框样式 */
.modal {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
  animation: fadeIn 0.3s;
}

.modal-content {
  background-color: var(--background-color);
  margin: 5% auto;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
  animation: slideIn 0.3s;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.close {
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  color: #666;
}

.close:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 动画效果 */
@keyframes fadeIn {
  from {opacity: 0;}
  to {opacity: 1;}
}

@keyframes slideIn {
  from {transform: translateY(-50px); opacity: 0;}
  to {transform: translateY(0); opacity: 1;}
}

/* 响应式设计 */
@media (max-width: 768px) {
  .first-screen-layout,
  .third-screen-layout {
    flex-direction: column;
  }
  
  .left-column,
  .right-column {
    width: 100% !important;
    height: auto;
  }
  
  .fixed-sidebar {
    position: static;
    height: auto;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
  
  .stories-container.horizontal-layout {
    flex-direction: column;
    height: auto;
  }
  
  .story-image-container,
  .story-titles.vertical-titles {
    width: 100%;
    height: 300px;
  }
  
  .story-titles.vertical-titles {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .story-title {
    writing-mode: horizontal-tb;
    border-right: none;
    border-bottom: 3px solid transparent;
  }
  
  .story-title.active {
    border-right-color: transparent;
    border-bottom-color: var(--primary-color);
  }
}

/* 中式谱系容器样式 - 开始 */
.chinese-family-tree {
  position: relative;
  width: 100%;
  min-width: 1200px;
  height: calc(100vh - 80px);
  background-color: #F5F0E6;
  border: 2px solid #9370DB;
  padding: 30px;
  overflow: auto;
}
/* 中式谱系节点样式已移至FamilyTreeNode.vue组件 */
/* 中式谱系容器样式 - 结束 */

/* Xmind组织架构图样式 */
.xmind-tree {
  position: relative;
  width: 100%;
  height: 800px;
  background-color: var(--background-color); /* 使用全局背景色，解决白色区域问题 */
  padding: 40px;
  overflow: auto; /* 滚动条 */
}

/* 节点通用样式 */
.center-node, .branch-node, .subnode {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 中心节点 */
.center-node {
  width: 180px;
  height: 100px;
  background-color: #6C756B; /* 深橄榄绿 */
  color: white;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* 分支节点 */
.branch-node {
  width: 150px;
  height: 60px;
  top: 300px;
  z-index: 9;
}

/* 分支节点颜色 */
.branch-node.branch-1 {
  background-color: #E1C7A9; /* 浅棕米色 */
  left: 20%;
}

.branch-node.branch-2 {
  background-color: #C89F7D; /* 暖棕色 */
  left: 37.5%;
}

.branch-node.branch-3 {
  background-color: #A0A890; /* 浅橄榄绿 */
  left: 52.5%;
}

.branch-node.branch-4 {
  background-color: #F9EFD2; /* 浅米色 */
  left: 80%;
  transform: translateX(-50%);
}

/* 细分节点 */
.subnode {
  width: 100px;
  height: 40px;
  top: 450px;
  font-size: 14px;
  z-index: 8;
}

/* 细分节点颜色和位置 */
.subnode.branch-1 {
  background-color: #E1C7A9; /* 浅棕米色 */
}

.subnode.branch-1:nth-of-type(1) {
  left: 16%;
}

.subnode.branch-1:nth-of-type(2) {
  left: 24%;
}

.subnode.branch-2 {
  background-color: #C89F7D; /* 暖棕色 */
}

.subnode.branch-2:nth-of-type(1) {
  left: 33.5%;
}

.subnode.branch-2:nth-of-type(2) {
  left: 41.5%;
}

.subnode.branch-3 {
  background-color: #A0A890; /* 浅橄榄绿 */
}

.subnode.branch-3:nth-of-type(1) {
  left: 48.5%;
}

.subnode.branch-3:nth-of-type(2) {
  left: 56.5%;
}

.subnode.branch-4 {
  background-color: #F9EFD2; /* 浅米色 */
}

.subnode.branch-4:nth-of-type(1) {
  left: 72%;
}

.subnode.branch-4:nth-of-type(2) {
  left: 80%;
}

/* 连线层 */
.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

/* 连线通用样式 */
.connection {
  position: absolute;
  background-color: #C1A68A;
}

/* 弧形连线（中心到分支） */
.connection.arc {
  height: 2px;
  border-radius: 50%;
  background: linear-gradient(to right, #C1A68A, #C1A68A);
}

/* 中心到分支1的连线 */
.connection.arc.branch-1 {
  width: 350px;
  top: 190px;
  left: calc(50% - 150px);
  transform: rotate(-30deg);
  transform-origin: right center;
}

/* 中心到分支2的连线 */
.connection.arc.branch-2 {
  width: 180px;
  top: 190px;
  left: calc(50% - 90px);
  transform: rotate(-10deg);
  transform-origin: right center;
}

/* 中心到分支3的连线 */
.connection.arc.branch-3 {
  width: 180px;
  top: 190px;
  right: calc(50% - 90px);
  transform: rotate(10deg);
  transform-origin: left center;
}

/* 中心到分支4的连线 */
.connection.arc.branch-4 {
  width: 350px;
  top: 190px;
  right: calc(50% - 150px);
  transform: rotate(30deg);
  transform-origin: left center;
}

/* 直线连线（分支到细分） */
.connection.straight {
  width: 2px;
  background: linear-gradient(to bottom, currentColor, currentColor);
}

/* 分支1到细分的连线 */
.connection.straight.branch-1 {
  color: #E1C7A9;
  background-color: #E1C7A9;
}

.connection.straight.branch-1:nth-of-type(1) {
  height: 130px;
  top: 360px;
  left: calc(20% + 75px);
  transform: translateX(-50%);
}

.connection.straight.branch-1:nth-of-type(2) {
  height: 130px;
  top: 360px;
  left: calc(20% + 75px);
  transform: translateX(-50%);
}

/* 分支2到细分的连线 */
.connection.straight.branch-2 {
  color: #C89F7D;
  background-color: #C89F7D;
}

.connection.straight.branch-2:nth-of-type(1) {
  height: 130px;
  top: 360px;
  left: calc(37.5% + 75px);
  transform: translateX(-50%);
}

.connection.straight.branch-2:nth-of-type(2) {
  height: 130px;
  top: 360px;
  left: calc(37.5% + 75px);
  transform: translateX(-50%);
}

/* 分支3到细分的连线 */
.connection.straight.branch-3 {
  color: #A0A890;
  background-color: #A0A890;
}

.connection.straight.branch-3:nth-of-type(1) {
  height: 130px;
  top: 360px;
  left: calc(52.5% + 75px);
  transform: translateX(-50%);
}

.connection.straight.branch-3:nth-of-type(2) {
  height: 130px;
  top: 360px;
  left: calc(52.5% + 75px);
  transform: translateX(-50%);
}

/* 分支4到细分的连线 */
.connection.straight.branch-4 {
  color: #F9EFD2;
  background-color: #F9EFD2;
}

.connection.straight.branch-4:nth-of-type(1) {
  height: 130px;
  top: 360px;
  left: calc(80% + 75px);
  transform: translateX(-50%);
}

.connection.straight.branch-4:nth-of-type(2) {
  height: 130px;
  top: 360px;
  left: calc(80% + 75px);
  transform: translateX(-50%);
}

/* 调整家族树容器样式 */
.family-tree-area {
  background-color: #F5F0E6; /* 浅米色背景 */
}
</style>