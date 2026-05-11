<template>
  <div class="container">
    <div class="logo">
      <h1>Life Imprint</h1>
      <p>家族非物质文化遗产馆</p>
    </div>
    
    <div class="auth-form">
      <div class="form-tabs">
        <button class="tab-btn active skeleton" data-tab="login">登录</button>
        <button class="tab-btn skeleton" data-tab="register">注册</button>
      </div>
      
      <!-- 登录表单 -->
      <div id="login" class="form-content active">
        <input type="text" id="login-phone" placeholder="手机号" value="13800138001" class="skeleton" />
        <input type="password" id="login-password" placeholder="密码" class="skeleton" />
        <div id="login-error" class="error-message"></div>
        <button id="login-btn" class="btn-primary skeleton">登录</button>
      </div>
      
      <!-- 注册表单 -->
      <div id="register" class="form-content">
        <input type="text" id="register-nickname" placeholder="昵称" class="skeleton" />
        <input type="text" id="register-phone" placeholder="手机号" class="skeleton" />
        <input type="password" id="register-password" placeholder="密码" class="skeleton" />
        <div id="register-error" class="error-message"></div>
        <button id="register-btn" class="btn-primary skeleton">注册</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import Auth from '../utils/auth.js'
import API_CONFIG from '../api/api-config.js'

onMounted(() => {
  // 添加登录页面特定的CSS类
  document.body.classList.add('login-page');
  
  // 初始化认证功能
  new Auth()
  
  // 探照灯效果
  document.addEventListener('mousemove', handleMouseMove);
  
  // 点击开灯效果
  document.addEventListener('click', handleClick);
});

onUnmounted(() => {
  // 移除登录页面特定的CSS类和事件监听器
  document.body.classList.remove('login-page');
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
  
  // 确保探照灯效果完全移除
  document.body.style.removeProperty('--x');
  document.body.style.removeProperty('--y');
  document.body.classList.remove('light-on');
});

// 探照灯效果处理函数
const handleMouseMove = (e) => {
  const x = e.clientX;
  const y = e.clientY;
  document.body.style.setProperty('--x', x + 'px');
  document.body.style.setProperty('--y', y + 'px');
}

// 点击开灯效果处理函数
const handleClick = () => {
  document.body.classList.add('light-on');
};
</script>

<style>
/* 探照灯效果 - 仅在登录页面生效 */
body.login-page::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000000;
    z-index: -1;
    /* 探照灯效果 - 使用mask创建透明区域 */
    mask-image: radial-gradient(circle at var(--x, 0) var(--y, 0), 
                                transparent 0px, 
                                transparent 150px, 
                                #000 250px);
    -webkit-mask-image: radial-gradient(circle at var(--x, 0) var(--y, 0), 
                                       transparent 0px, 
                                       transparent 150px, 
                                       #000 250px);
    opacity: 1;
    transition: opacity 0.8s ease, background-image 0.8s ease;
}

/* 探照灯内显示的背景图 */
body.login-page::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/img/background-pattern-2.jpg');
    background-position: center;
    background-size: cover;
    background-attachment: fixed;
    background-repeat: no-repeat;
    z-index: -2;
    opacity: 1;
    transition: opacity 0.8s ease;
}

/* 内容容器 - 关灯时隐藏 */
body.login-page .container {
    position: relative;
    z-index: 1;
    padding: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: transparent;
    opacity: 0;
    transition: opacity 0.8s ease;
}

/* 开灯状态 - 显示不同的背景图 */
body.login-page.light-on::after {
    background-image: url('/img/background-pattern-1.jpg');
    opacity: 1;
}

/* 开灯状态 - 隐藏探照灯遮罩效果 */
body.login-page.light-on::before {
    opacity: 0;
}

/* 开灯状态 - 显示内容容器 */
body.login-page.light-on .container {
    opacity: 1;
}
</style>

<style scoped>

/* 登录页面样式 */
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-image: url('/img/background-pattern.jpg');
  background-size: cover;
  background-position: center;
}

.logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo h1 {
  color: var(--primary-color);
  font-size: 3rem;
  margin-bottom: 10px;
}

.logo p {
  font-size: 1.2rem;
  color: #666;
}

.auth-form {
  max-width: 400px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.form-tabs {
  display: flex;
  margin-bottom: 20px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background-color: rgba(248, 243, 233, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  color: var(--text-color);
}

.tab-btn:hover {
  background-color: rgba(248, 243, 233, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tab-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(22, 73, 98, 0.3);
}

.form-content {
  display: none;
  background-color: transparent;
}

.form-content.active {
  display: block;
  background-color: transparent;
}

input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid rgba(22, 73, 98, 0.3);
  border-radius: 8px;
  font-size: 16px;
  background-color: rgba(248, 243, 233, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  color: var(--text-color);
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 73, 98, 0.2);
  background-color: rgba(248, 243, 233, 0.9);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-primary:hover {
  background-color: var(--primary-color);
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(22, 73, 98, 0.3);
}

.error-message {
  color: red;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}
</style>