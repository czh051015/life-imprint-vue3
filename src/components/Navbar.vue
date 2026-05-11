<template>
  <nav class="traditional-navbar">
    <div class="nav-left">
      <h1 class="traditional-title">家族印记</h1>
    </div>
    <div class="nav-right">
      <router-link to="/home" class="nav-link traditional-link" :class="{ active: $route.path === '/home' }">首页</router-link>
      
      <!-- 动态显示：有当前家族时，显示家族名称 + 展厅/大事记链接 -->
      <template v-if="familyStore.currentFamily">
        <span class="current-family">当前家族：{{ familyStore.currentFamily.name }}</span>
        <router-link to="/family" class="nav-link traditional-link" :class="{ active: $route.path === '/family' }">家族展厅</router-link>
        <router-link to="/events-summary" class="nav-link traditional-link" :class="{ active: $route.path === '/events-summary' }">家族大事记</router-link>
        <router-link to="/account" class="nav-link traditional-link" :class="{ active: $route.path === '/account' }">个人信息</router-link>
      </template>
      
      <button id="logout-btn" class="btn-secondary traditional-btn">退出登录</button>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Auth from '../utils/auth.js'
import { useFamilyStore } from '../stores/familyStore'

// 获取家族状态
const familyStore = useFamilyStore()

const router = useRouter()

onMounted(() => {
  // 从localStorage加载当前家族信息
  familyStore.loadCurrentFamilyFromStorage()
  
  // 绑定退出登录事件
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const auth = new Auth()
      auth.logout()
    })
  }
})
</script>

<style scoped>
.traditional-navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: #eff0f1;
  border-bottom: 1px solid var(--border-color);
}

.nav-left {
  float: left;
  padding: 8px 20px;
}

.nav-right {
  float: right;
  padding: 8px 20px;
  display: flex;
  align-items: center;
}

.traditional-title {
  font-size: 24px;
  margin: 0;
  line-height: 1.4;
}

.nav-link {
  display: inline-block;
  padding: 0 8px;
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s ease;
  margin: 0 8px;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link.active {
  font-weight: bold;
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.btn-secondary {
  padding: 8px 15px;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-left: 16px;
}

.btn-secondary:hover {
  background-color: var(--highlight-color);
}

/* 当前家族显示样式 - 优化为标识块 */
.current-family {
  display: inline-flex;
  align-items: center;
  background: #f5f7fa; /* 浅灰背景，和页面底色区分 */
  padding: 4px 10px;
  border-radius: 4px;
  margin: 0 8px;
  font-weight: 500; /* 轻微加粗，突出标识 */
  color: var(--text-color);
  font-size: 16px;
  white-space: nowrap;
  border: 1px solid #e4e7ed;
}

/* 家族图标样式 */
.current-family::before {
  content: '🏠'; /* 家族/房子图标 */
  margin-right: 6px;
  font-size: 14px;
}
</style>