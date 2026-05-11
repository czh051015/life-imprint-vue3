<template>
  <!-- 背景图片 -->
  <div class="background-image-container">
    <img src="/img/home.jpg" alt="背景图片" class="background-image">
  </div>
  
  <!-- 全屏动画容器 -->
  <div class="fullscreen-animation" id="fullscreen-animation">
    <!-- 上排矩形 -->
    <div class="slot-row top-row">
      <div class="slot-track" v-for="i in 20" :key="'top-' + i">
        <div class="slot-item" :class="'color' + i"></div>
      </div>
    </div>
    
    <!-- 下排矩形 -->
    <div class="slot-row bottom-row">
      <div class="slot-track" v-for="i in 20" :key="'bottom-' + i">
        <div class="slot-item" :class="'color' + (i + 20)"></div>
      </div>
    </div>
  </div>
  
  <!-- 导航栏 -->
  <Navbar />
  
  <!-- 内容容器（在动画之上） -->
  <div class="home-container">
    <!-- 主内容布局 -->
    <div class="main-content-layout">
      <!-- 左侧：家族列表（75%宽度） -->
      <div class="families-container">
        <div class="families-header">
          <p>我的家族</p>
        </div>
        
        <div id="families-list" class="families-list">
          <div v-if="loading" class="family-card" style="text-align: center; color: #666; padding: 40px;">
            加载中...
          </div>
          <div v-else-if="families.length === 0" class="family-card" style="text-align: center; color: #666; padding: 40px;">
            您还没有加入或创建任何家族
          </div>
          <div v-for="family in families" :key="family.familyId" class="family-card">
            <div class="family-name">{{ family.familyName }} <span style="font-size: 14px; color: #666; font-weight: normal;">({{ family.roleName }})</span></div>
            <div class="family-members">成员数量: {{ family.memberCount }}人</div>
            <button class="enter-family-btn" @click="enterFamily(family)" style="margin-top: 10px; background: none; color: var(--primary-color); text-decoration: underline; font-weight: bold; font-size: 16px; border: none; cursor: pointer;">进入家族</button>
          </div>
        </div>
      </div>
      
      <!-- 右侧：操作区域（25%宽度） -->
      <div class="actions-container">
        <div class="actions-content">
          <!-- 输入邀请码模块 -->
          <div class="action-module">
            <label for="invitation-code">家族管理</label>
            <input type="text" id="invitation-code" v-model="invitationCode" placeholder="请输入6位邀请码" maxlength="6">
          </div>
          
          <!-- 加入家族模块 -->
          <div class="action-module">
            <button id="join-family-btn" class="btn-join" @click="joinFamily">加入家族</button>
          </div>
          
          <!-- 创建家族模块 -->
          <div class="action-module">
            <button id="create-family-btn" class="btn-create" @click="showCreateFamilyModal">创建家族</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 创建家族弹窗 -->
  <div id="create-family-modal" class="modal" :style="{ display: showCreateModal ? 'block' : 'none' }">
    <div class="modal-content">
      <div class="modal-header">
        <h3>创建家族</h3>
        <span class="close" @click="hideCreateFamilyModal">&times;</span>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 15px;">
          <label for="family-name" style="display: block; margin-bottom: 5px; font-weight: bold;">家族名称</label>
          <input type="text" id="family-name" v-model="familyName" placeholder="请输入2-20字的家族名称" maxlength="20" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
          <div id="family-name-error" style="color: red; font-size: 12px; margin-top: 5px;">{{ familyNameError }}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="cancel-create-btn" class="btn-cancel" @click="hideCreateFamilyModal" style="padding: 8px 16px; background-color: #f1f1f1; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">取消</button>
        <button id="confirm-create-btn" class="btn-confirm" @click="confirmCreateFamily" style="padding: 8px 16px; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">创建家族</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Auth from '../utils/auth.js'
import API_CONFIG from '../api/api-config.js'
import { useFamilyStore } from '../stores/familyStore'

const router = useRouter()
const auth = new Auth()

// 响应式数据
const families = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const familyName = ref('')
const familyNameError = ref('')
const invitationCode = ref('')

// 页面初始化
onMounted(() => {
  checkLoginStatus()
  
  // 首页加载时，清空当前家族状态
  const familyStore = useFamilyStore()
  familyStore.clearCurrentFamily()
  
  loadFamilies()
  initFullscreenAnimation()
})

// 检查登录状态
const checkLoginStatus = () => {
  if (!auth.isLoggedIn()) {
    router.push('/')
  }
}

// 加载家族列表
const loadFamilies = async () => {
  loading.value = true
  try {
    const familiesList = await auth.getMyFamilyInfo()
    families.value = familiesList
  } catch (error) {
    console.error('加载家族列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加入家族
const joinFamily = async () => {
  if (!invitationCode.value) {
    alert('请输入邀请码！')
    return
  }
  
  if (invitationCode.value.length !== 6) {
    alert('邀请码必须是6位！')
    return
  }
  
  try {
    const result = await auth.joinFamily(invitationCode.value)
    
    if (result.code === 200) {
      alert('加入家族成功')
      // 清空输入框
      invitationCode.value = ''
      // 重新加载家族列表
      loadFamilies()
    } else {
      alert(result.msg || '加入家族失败')
    }
  } catch (error) {
    alert(error.message || '加入家族失败，请稍后重试')
    console.error('加入家族错误:', error)
  }
}

// 显示创建家族弹窗
const showCreateFamilyModal = () => {
  showCreateModal.value = true
  // 清空输入框和错误信息
  familyName.value = ''
  familyNameError.value = ''
}

// 隐藏创建家族弹窗
const hideCreateFamilyModal = () => {
  showCreateModal.value = false
}

// 验证家族名称
const validateFamilyName = (name) => {
  if (!name || name.trim().length < 2) {
    return '家族名称不能少于2个字符'
  }
  if (name.trim().length > 20) {
    return '家族名称不能超过20个字符'
  }
  return null
}

// 确认创建家族
const confirmCreateFamily = async () => {
  // 验证家族名称
  const validationError = validateFamilyName(familyName.value)
  if (validationError) {
    familyNameError.value = validationError
    return
  }
  
  try {
    const result = await auth.createFamily(familyName.value)
    
    if (result.code === 200) {
      alert('家族创建成功')
      // 隐藏弹窗
      hideCreateFamilyModal()
      // 重新加载家族列表
      loadFamilies()
    } else {
      familyNameError.value = result.msg || '创建家族失败'
    }
  } catch (error) {
    familyNameError.value = error.message || '创建家族失败，请稍后重试'
    console.error('创建家族错误:', error)
  }
}

// 进入家族页面
const enterFamily = (family) => {
  // 获取当前用户ID
  const currentUser = auth.getCurrentUser()
  const userId = currentUser ? currentUser.id : ''
  
  // 保存当前选择的家族信息到Pinia全局状态
  const familyStore = useFamilyStore()
  familyStore.setCurrentFamily({
    id: family.familyId,
    name: family.familyName
  })
  
  // 保存当前选择的家族信息到localStorage
  localStorage.setItem('currentFamilyId', family.familyId)
  localStorage.setItem('currentUserId', userId)
  localStorage.setItem('currentFamilyRole', family.role)
  
  // 跳转到家族页面
  router.push('/family')
}

// 全屏动画逻辑
import gsap from 'gsap'

const initFullscreenAnimation = () => {
  const container = document.getElementById('fullscreen-animation')
  if (!container) return
  
  const topRow = container.querySelector('.top-row')
  const bottomRow = container.querySelector('.bottom-row')
  
  // 获取所有矩形元素
  const topItems = topRow.querySelectorAll('.slot-item')
  const bottomItems = bottomRow.querySelectorAll('.slot-item')
  const topTracks = topRow.querySelectorAll('.slot-track')
  const bottomTracks = bottomRow.querySelectorAll('.slot-track')
  
  // 1. 设置初始位置 - 创建40个轨道，均匀分布在整个屏幕宽度上
  setupTrackPositions(topTracks, false) // 上方矩形：保持原高度
  setupTrackPositions(bottomTracks, true) // 下方矩形：缩短为原来的一半
  
  // 2. 立即开始上下汇聚动画
  animateConvergence(topItems, bottomItems)
}

const setupTrackPositions = (tracks, isBottomRow = false) => {
  // 计算每个轨道的位置（等间距分布）
  const trackCount = tracks.length
  const trackWidth = 100 / trackCount // 每轨道宽度百分比
  
  tracks.forEach((track, index) => {
    // 设置轨道水平位置 - 确保每个轨道均匀分布在整个屏幕宽度上
    const position = (index * trackWidth)
    track.style.left = `${position}%`
    track.style.width = `${trackWidth}%`
    
    // 设置高度和延迟（创建波浪效果）
    const item = track.querySelector('.slot-item')
    const delay = index * 0.02 // 每个元素延迟0.02秒，形成波浪效果
    
    // 计算高度：两侧高，中间低，使用余弦函数实现
    const centerFactor = 1 - Math.abs((index / (trackCount - 1)) * 2 - 1)
    // 基础高度（中间最低）
    let baseHeight
    
    // 检查是否是需要拉长的四个矩形之一（上下两行的第一个和最后一个）
    const isSpecialRect = (index === 0 || index === trackCount - 1)
    
    if (isBottomRow) {
      if (isSpecialRect) {
        // 下方的第一个和最后一个矩形：拉长
        baseHeight = 30 + (1 - centerFactor) * 40 // 中间30-70%，两侧70-90%
      } else {
        // 下方其他矩形：保持当前高度
        baseHeight = 10 + (1 - centerFactor) * 15 // 中间10-25%，两侧25-40%
      }
    } else {
      if (isSpecialRect) {
        // 上方的第一个和最后一个矩形：拉长
        baseHeight = 60 + (1 - centerFactor) * 40 // 中间60-100%，两侧100%
      } else {
        // 上方其他矩形：保持原高度不变
        baseHeight = 40 + (1 - centerFactor) * 40 // 中间40-80%，两侧80-100%
      }
    }
    
    // 添加随机因素，确保相邻矩形高度不一致
    const randomVariation = Math.random() * 5
    const finalHeight = baseHeight + randomVariation
    
    item.style.height = `${finalHeight}%`
    
    // 设置不同的动画延迟，但所有动画都立即开始
    item.setAttribute('data-delay', delay)
  })
}

const animateConvergence = (topItems, bottomItems) => {
  // 上排矩形动画：从上向下移动
  topItems.forEach((item, index) => {
    const delay = parseFloat(item.getAttribute('data-delay')) || 0
    const duration = 1.5 + Math.random() * 0.5
    
    // 使用GSAP动画实现
    gsap.fromTo(item, duration, {
      top: '-100%',
      opacity: 0,
      rotation: Math.random() * 30 - 15, // 随机旋转角度
      scale: 0.8
    }, {
      top: '0%',
      opacity: 0.8,
      rotation: 0,
      scale: 1,
      delay: delay,
      ease: 'back.out(1.5)',
      onComplete: () => {
        // 添加微弱的呼吸效果
        gsap.to(item, 3, {
          opacity: 0.7 + Math.random() * 0.2,
          yoyo: true,
          repeat: -1,
          repeatDelay: 0.5,
          ease: 'power1.inOut'
        })
      }
    })
  })
  
  // 下排矩形动画：从下向上移动
  bottomItems.forEach((item, index) => {
    const delay = parseFloat(item.getAttribute('data-delay')) || 0
    const duration = 1.5 + Math.random() * 0.5
    
    // 使用GSAP动画实现
    gsap.fromTo(item, duration, {
      bottom: '-100%',
      opacity: 0,
      rotation: Math.random() * 30 - 15, // 随机旋转角度
      scale: 0.8
    }, {
      bottom: '0%',
      opacity: 0.8,
      rotation: 0,
      scale: 1,
      delay: delay,
      ease: 'back.out(1.5)',
      onComplete: () => {
        // 添加微弱的呼吸效果
        gsap.to(item, 3, {
          opacity: 0.7 + Math.random() * 0.2,
          yoyo: true,
          repeat: -1,
          repeatDelay: 0.5,
          ease: 'power1.inOut'
        })
      }
    })
  })
}
</script>

<style scoped>
/* 全屏动画样式 */
.fullscreen-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

/* 背景图片容器 */
.background-image-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

/* 背景图片 */
.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}

/* 上排矩形容器 */
.slot-row.top-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
}

/* 下排矩形容器 */
.slot-row.bottom-row {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
}

/* 轨道容器 */
.slot-track {
  position: absolute;
  height: 100%;
}

/* 单个矩形 */
.slot-item {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
}

/* 上排矩形的初始位置 */
.top-row .slot-item {
  top: -100%;
}

/* 下排矩形的初始位置 */
.bottom-row .slot-item {
  bottom: -100%;
}

/* 内容容器（在动画之上） */
.home-container {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 主内容布局 - 左右分栏 */
.main-content-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

/* 左侧：家族列表（75%宽度） */
.families-container {
  flex: 0 0 75%;
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px 35px;
  display: flex;
  flex-direction: column;
}

/* 家族列表样式 */
.families-list {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  overflow-x: auto;
  white-space: nowrap;
}

/* 家族卡片样式 */
.family-card {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  width: 250px;
  flex-shrink: 0;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.family-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.family-name {
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--primary-color);
}

.family-members {
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.enter-family-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.enter-family-btn:hover {
  background-color: var(--highlight-color);
}

/* 右侧：操作区域（25%宽度） */
.actions-container {
  flex: 0 0 25%;
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px 35px;
  display: flex;
  flex-direction: column;
  max-height: 230px;
}

/* 中国传统颜色 - 40种不同颜色 */
.color1 { background-color: rgb(49, 112, 166); }
.color2 { background-color: rgb(16, 32, 48); }
.color3 { background-color: rgb(57, 70, 175); }
.color4 { background-color: rgb(147, 183, 177); }
.color5 { background-color: rgb(173, 216, 251); }
.color6 { background-color: rgb(32, 41, 84); }
.color7 { background-color: rgb(19, 71, 93); }
.color8 { background-color: rgb(195, 214, 212); }
.color9 { background-color: rgb(158, 178, 189); }
.color10 { background-color: rgb(79, 125, 161); }
.color11 { background-color: rgb(17, 94, 172); }
.color12 { background-color: rgb(16, 22, 54); }
.color13 { background-color: rgb(176, 213, 222); }
.color14 { background-color: rgb(23, 79, 126); }
.color15 { background-color: rgb(21, 86, 154); }
.color16 { background-color: rgb(41, 65, 103); }
.color17 { background-color: rgb(34, 119, 184); }
.color18 { background-color: rgb(19, 59, 94); }
.color19 { background-color: rgb(4, 57, 72); }
.color20 { background-color: rgb(14, 20, 34); }
.color21 { background-color: rgb(20, 36, 52); }
.color22 { background-color: rgba(63, 81, 181, 0.7); }
.color23 { background-color: rgb(40, 67, 122); }
.color24 { background-color: rgb(43, 113, 173); }
.color25 { background-color: rgb(122, 171, 229); }
.color26 { background-color: rgb(0, 49, 82); }
.color27 { background-color: rgb(47, 94, 146); }
.color28 { background-color: rgb(187, 214, 225); }
.color29 { background-color: rgb(22, 163, 209); }
.color30 { background-color: rgba(33, 150, 243, 0.7); }
.color31 { background-color: rgb(199, 230, 232); }
.color32 { background-color: rgb(140, 155, 184); }
.color33 { background-color: rgb(103, 169, 201); }
.color34 { background-color: rgb(76, 135, 177); }
.color35 { background-color: rgba(96, 125, 139, 0.7); }
.color36 { background-color: rgb(47, 52, 107); }
.color37 { background-color: rgb(55, 109, 181); }
.color38 { background-color: rgb(4, 18, 53); }
.color39 { background-color: rgb(62, 94, 134); }
.color40 { background-color: rgb(28, 41, 57); }
</style>