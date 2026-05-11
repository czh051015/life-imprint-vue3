<template>
  <!-- 导航栏 -->
  <Navbar />
  
  <!-- 全屏背景容器 -->
  <div class="background-container"></div>
  
  <div class="account-container">
    <h2 class="page-title">个人信息设置</h2>
    
    <!-- 主体区：左侧头像昵称区 + 右侧表单区 -->
    <div class="main-content">
      <!-- 左侧头像昵称区 -->
      <div class="left-section">
        <div class="avatar-container">
          <el-upload
            class="avatar-uploader"
            action=""
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleAvatarChange"
            accept="image/*"
          >
            <el-avatar :size="150" :src="userInfo.avatarUrl" class="avatar">
              {{ userInfo.nickname ? userInfo.nickname.charAt(0) : 'U' }}
            </el-avatar>
          </el-upload>
        </div>
        
        <div class="nickname-display">
          <span class="nickname-text">{{ userInfo.nickname || '未设置昵称' }}</span>
        </div>
      </div>
      
      <!-- 右侧表单区 -->
      <div class="right-section">
        <el-form :model="userInfo" label-width="100px" size="large" asterisk-position="right">
          <el-form-item label="手机号">
            <el-input v-model="userInfo.phone" readonly placeholder="手机号" />
          </el-form-item>
          
          <el-form-item label="昵称">
            <el-input v-model="userInfo.nickname" placeholder="请输入昵称" clearable />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="showChangePasswordDialog = true">忘记密码</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 分割线 -->
    <el-divider></el-divider>
    
    <!-- 家族管理专区 -->
    <div class="family-management">
      <!-- 我加入的家族 -->
      <div class="family-section">
        <h3 class="section-subtitle">我加入的家族</h3>
        <!-- 关键修改点1：仅显示role=1的家族 -->
        <el-table v-if="joinedFamilies.length > 0" :data="joinedFamilies.filter(family => family.role === 1)" stripe style="width: 100%">
          <el-table-column prop="name" label="家族名称" width="300" />
          <el-table-column prop="role" label="我的角色" width="150">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.role === 2 ? 'danger' : 'info'">
                {{ scope.row.role === 2 ? '管理员' : '普通成员' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="memberCount" label="家族人数" width="100" />
          <el-table-column label="邀请码" width="180">
            <template #default="scope">
              <div class="invite-code-cell">
                <span v-if="!scope.row.showInviteCode" class="invite-code-hidden">******</span>
                <span v-else class="invite-code-visible">{{ scope.row.inviteCode }}</span>
                <el-button 
                  size="small" 
                  type="text" 
                  @click="scope.row.showInviteCode = !scope.row.showInviteCode"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button size="small" type="danger" @click="leaveFamily(scope.row.familyId)">退出家族</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无加入的家族"></el-empty>
      </div>
      
      <!-- 我创建/管理的家族成员 -->
      <div class="family-section">
        <h3 class="section-subtitle">我创建的家族</h3>
        <!-- 关键修改点2：外层仅展示家族列表 -->
        <el-table v-if="adminFamilies.length > 0" :data="adminFamilies" stripe style="width: 100%">
          <el-table-column prop="name" label="家族名称" width="300" />
          <el-table-column label="我的角色" width="150">
            <template #default="scope">
              <el-tag size="small" type="danger">家族管理员</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="memberCount" label="家族人数" width="100" />
          <el-table-column label="邀请码" width="180">
            <template #default="scope">
              <div class="invite-code-cell">
                <span v-if="!scope.row.showInviteCode" class="invite-code-hidden">******</span>
                <span v-else class="invite-code-visible">{{ scope.row.inviteCode }}</span>
                <el-button 
                  size="small" 
                  type="text" 
                  @click="scope.row.showInviteCode = !scope.row.showInviteCode"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" @click="openMemberManagement(scope.row)">修改</el-button>
              <el-button size="small" type="danger" @click="showDeleteFamilyConfirm(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无创建/管理的家族"></el-empty>
      </div>
    </div>
    

  </div>
  
  <!-- 修改密码弹窗 -->
  <el-dialog
    v-model="showChangePasswordDialog"
    title="修改密码"
    width="400px"
  >
    <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" asterisk-position="right">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="isChangingPassword">确认修改</el-button>
      </div>
    </template>
  </el-dialog>
  
  <!-- 关键修改点3：家族成员管理弹窗 -->
  <el-dialog
    v-model="showMemberDialog"
    :title="`${currentFamily.name} - 成员管理`"
    width="600px"
  >
    <div v-if="isLoadingMembers[`loading_${currentFamily.familyId}`]" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    <el-table v-else-if="adminFamilyMembers[currentFamily.familyId]?.length > 0" :data="adminFamilyMembers[currentFamily.familyId]" stripe style="width: 100%">
      <el-table-column prop="nickname" label="成员昵称" width="200" />
      <el-table-column prop="role" label="成员角色" width="150">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.role === 2 ? 'danger' : 'info'">
            {{ scope.row.role === 2 ? '管理员' : '普通成员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button 
            size="small" 
            type="danger" 
            @click="showDeleteConfirm(scope.row)"
            :disabled="scope.row.role === 2"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="该家族暂无成员"></el-empty>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showMemberDialog = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
  
  <!-- 关键修改点4：删除确认对话框（成员） -->
  <el-dialog
    v-model="showDeleteConfirmDialog"
    title="删除确认"
    width="300px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="delete-confirm-content">
      <p>你确认是否删除该成员？</p>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showDeleteConfirmDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteMember" :loading="isDeleting">确认</el-button>
      </div>
    </template>
  </el-dialog>
  
  <!-- 删除家族确认对话框 -->
  <el-dialog
    v-model="showDeleteFamilyDialog"
    title="删除家族确认"
    width="300px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="delete-confirm-content">
      <p>你确认是否删除该家族？</p>
      <p style="color: #f56c6c; margin-top: 10px;">删除后不可恢复，请谨慎操作！</p>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showDeleteFamilyDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteFamily" :loading="isDeletingFamily">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import Navbar from '../components/Navbar.vue'
import API_CONFIG from '@/api/api-config.js'

const router = useRouter()

// 表单数据
const userInfo = reactive({
  avatarUrl: '',
  nickname: '',
  phone: ''
})

// 原始用户信息，用于重置表单
const originalUserInfo = reactive({})

// 加载状态
const isSaving = ref(false)
const isLoadingFamilies = ref(false)
const isChangingPassword = ref(false)
const isLoadingMembers = reactive({})
const isDeleting = ref(false)

// 密码修改表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref(null)
const showChangePasswordDialog = ref(false)

// 关键修改点5：家族成员管理弹窗相关
const showMemberDialog = ref(false)
const currentFamily = reactive({ familyId: '', name: '' })

// 关键修改点6：删除确认对话框相关
const showDeleteConfirmDialog = ref(false)
const memberToDelete = reactive({ familyId: '', userId: '', role: 0 })

// 删除家族确认对话框相关
const showDeleteFamilyDialog = ref(false)
const familyToDelete = ref(null)
const isDeletingFamily = ref(false)

// 密码验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 16, message: '新密码长度必须在6-16位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 家族相关数据
const joinedFamilies = ref([])
const adminFamilies = ref([])
const adminFamilyMembers = reactive({})

// 获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const token = getToken()
    if (!token) {
      router.push('/')
      return
    }

    // 这里应该调用获取用户信息的接口，暂时使用localStorage中的数据
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    userInfo.avatarUrl = user.avatarUrl || '/img/account_head.jpg'
    userInfo.nickname = user.nickname || user.username || ''
    userInfo.phone = user.phone || ''
    
    // 保存原始数据用于重置
    Object.assign(originalUserInfo, JSON.parse(JSON.stringify(userInfo)))
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
  }
}

// 加载家族信息
const loadFamilies = async () => {
  try {
    isLoadingFamilies.value = true
    const token = getToken()
    if (!token) return

    // 调用获取我的家族列表接口
    const response = await fetch(API_CONFIG.baseURL + '/api/family/my/list/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    
    if (data.code === 200) {
      // 后端返回的是familyName，前端用name，需映射
      joinedFamilies.value = (data.data || []).map(family => ({
        ...family,
        name: family.familyName // 把familyName映射为name，兼容原有模板
      }))
      // 添加调试信息
      console.log('joinedFamilies:', joinedFamilies.value)
      // 关键修改点7：筛选出我是管理员的家族（role=2）
      adminFamilies.value = joinedFamilies.value.filter(family => family.role === 2)
      // 添加调试信息
      console.log('adminFamilies:', adminFamilies.value)
      // 加载管理员家族的成员列表
      adminFamilies.value.forEach(family => {
        console.log('Loading members for familyId:', family.familyId)
        loadFamilyMembers(family.familyId)
      })
    } else {
      // 接口返回错误时，兜底为空数组
      joinedFamilies.value = []
      adminFamilies.value = []
      ElMessage.warning('获取家族列表失败：' + (data.msg || '未知错误'))
    }
  } catch (error) {
    console.error('加载家族信息失败:', error)
    // 异常时兜底为空数组
    joinedFamilies.value = []
    adminFamilies.value = []
    ElMessage.error('加载家族信息失败')
  } finally {
    isLoadingFamilies.value = false
  }
}

// 加载家族成员列表
const loadFamilyMembers = async (familyId) => {
  try {
    if (!familyId) return
    
    // 设置该家族的加载状态
    const loadingKey = `loading_${familyId}`
    isLoadingMembers[loadingKey] = true
    
    const token = getToken()
    if (!token) return

    console.log('Calling member list API for familyId:', familyId)
    const response = await fetch(API_CONFIG.baseURL + '/api/family/member/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      }
    })
    
    console.log('Member list response status:', response.status)
    const data = await response.json()
    console.log('Member list response data:', data)
    
    if (data.code === 200) {
      // 确保familyId作为键存在
      adminFamilyMembers[familyId] = data.data || []
      console.log('Admin family members after load:', adminFamilyMembers)
    } else {
      console.error('Failed to load members for family', familyId, data.msg)
    }
  } catch (error) {
    console.error('加载家族成员失败:', error)
    ElMessage.error('加载家族成员失败')
  } finally {
    // 清除该家族的加载状态
    const loadingKey = `loading_${familyId}`
    isLoadingMembers[loadingKey] = false
  }
}

// 处理头像上传
const handleAvatarChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    userInfo.avatarUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 触发头像上传
const triggerAvatarUpload = () => {
  document.querySelector('.avatar-uploader input[type="file"]').click()
}

// 保存修改
const saveChanges = async () => {
  try {
    isSaving.value = true
    const token = getToken()
    if (!token) return

    // 调用修改用户信息接口
    const response = await fetch(API_CONFIG.baseURL + '/api/user/updateInfo', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nickname: userInfo.nickname,
        avatarUrl: userInfo.avatarUrl
      })
    })

    const data = await response.json()
    if (data.code === 200) {
      ElMessage.success('个人信息修改成功')
      // 更新localStorage中的用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      Object.assign(user, userInfo)
      localStorage.setItem('user', JSON.stringify(user))
      // 更新原始数据
      Object.assign(originalUserInfo, JSON.parse(JSON.stringify(userInfo)))
    } else {
      ElMessage.error(data.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(userInfo, JSON.parse(JSON.stringify(originalUserInfo)))
}

// 修改密码
const changePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    isChangingPassword.value = true
    const token = getToken()
    if (!token) return

    const response = await fetch(API_CONFIG.baseURL + '/api/user/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
    })

    const data = await response.json()
    if (data.code === 200) {
      ElMessage.success('密码修改成功')
      showChangePasswordDialog.value = false
      // 清空密码表单
      Object.keys(passwordForm).forEach(key => {
        passwordForm[key] = ''
      })
    } else {
      ElMessage.error(data.msg || '密码修改失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('密码修改失败:', error)
      ElMessage.error('密码修改失败')
    }
  } finally {
    isChangingPassword.value = false
  }
}

// 退出家族
const leaveFamily = async (familyId) => {
  try {
    const token = getToken()
    if (!token) return

    // 调用退出家族接口
    const response = await fetch(API_CONFIG.baseURL + '/api/family/quit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      }
    })

    const data = await response.json()
    if (data.code === 200) {
      ElMessage.success('退出家族成功')
      // 重新加载家族列表
      loadFamilies()
    } else {
      ElMessage.error(data.msg || '退出家族失败')
    }
  } catch (error) {
    console.error('退出家族失败:', error)
    ElMessage.error('退出家族失败')
  }
}

// 关键修改点8：打开家族成员管理弹窗
const openMemberManagement = (family) => {
  Object.assign(currentFamily, family)
  showMemberDialog.value = true
}

// 关键修改点9：显示删除确认对话框
const showDeleteConfirm = (member) => {
  // 禁止删除管理员
  if (member.role === 2) {
    ElMessage.error('禁止删除管理员')
    return
  }
  
  memberToDelete.familyId = currentFamily.familyId
  memberToDelete.userId = member.userId
  memberToDelete.role = member.role
  showDeleteConfirmDialog.value = true
}

// 关键修改点10：确认删除成员
const confirmDeleteMember = async () => {
  try {
    isDeleting.value = true
    await kickMember(memberToDelete.familyId, memberToDelete.userId, memberToDelete.role)
    // 删除成功后关闭对话框
    showDeleteConfirmDialog.value = false
    // 刷新成员列表
    loadFamilyMembers(memberToDelete.familyId)
    // 重新加载家族列表，同步更新家族人数
    loadFamilies()
  } catch (error) {
    console.error('删除成员失败:', error)
  } finally {
    isDeleting.value = false
  }
}

// 踢出成员
const kickMember = async (familyId, userId, role) => {
  try {
    if (!familyId || !userId) return
    
    // 禁止踢出管理员
    if (role === 2) {
      ElMessage.error('禁止踢出其他管理员')
      return
    }
    
    const token = getToken()
    if (!token) return

    // 调用踢出成员接口
    const response = await fetch(API_CONFIG.baseURL + '/api/family/kick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      },
      body: JSON.stringify({
        targetUserId: userId
      })
    })

    const data = await response.json()
    if (data.code === 200) {
      ElMessage.success('踢出成功')
    } else {
      ElMessage.error(data.msg || '踢出成员失败')
    }
  } catch (error) {
    console.error('踢出成员失败:', error)
    ElMessage.error('踢出成员失败')
  }
}

// 显示删除家族确认对话框
const showDeleteFamilyConfirm = (family) => {
  familyToDelete.value = family
  showDeleteFamilyDialog.value = true
}

// 确认删除家族
const confirmDeleteFamily = async () => {
  try {
    if (!familyToDelete.value) return
    
    isDeletingFamily.value = true
    await deleteFamily(familyToDelete.value.familyId)
    
    // 删除成功后关闭对话框
    showDeleteFamilyDialog.value = false
    // 重新加载家族列表
    loadFamilies()
  } catch (error) {
    console.error('删除家族失败:', error)
  } finally {
    isDeletingFamily.value = false
  }
}

// 删除家族API调用
const deleteFamily = async (familyId) => {
  try {
    if (!familyId) {
      ElMessage.error('家族ID不能为空')
      return
    }
    
    const token = getToken()
    if (!token) {
      ElMessage.error('未登录')
      return
    }

    // 调用删除家族接口
    const response = await fetch(API_CONFIG.baseURL + '/api/family/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      }
    })

    const data = await response.json()
    if (data.code === 200) {
      ElMessage.success('家族删除成功')
      // 如果删除的是当前选中的家族，清除当前家族
      const currentFamilyId = localStorage.getItem('currentFamilyId')
      if (currentFamilyId && currentFamilyId === familyId) {
        localStorage.removeItem('currentFamily')
        localStorage.removeItem('currentFamilyId')
      }
    } else {
      let errorMsg = data.msg || '删除家族失败'
      // 根据错误码提供更友好的错误信息
      switch (data.code) {
        case 403:
          errorMsg = '您非该家族创建者，无权限删除'
          break
        case 404:
          errorMsg = '该家族不存在'
          break
        case 500:
          errorMsg = '删除家族失败（关联数据清理异常）'
          break
      }
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    console.error('删除家族失败:', error)
    ElMessage.error('网络错误，删除家族失败')
  }
}

// 页面初始化
onMounted(() => {
  loadUserInfo()
  loadFamilies()
})
</script>

<style scoped>
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/img/account.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

/* 导航栏半透明效果（与家族大事记页面保持一致） */
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

.account-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 40px;
  min-height: 100vh;
}

.page-title {
  text-align: center;
  font-size: 36px;
  margin-bottom: 40px;
  color: var(--primary-color);
  font-weight: bold;
}

.main-content {
  display: flex;
  margin-bottom: 40px;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.left-section {
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.right-section {
  width: 70%;
  display: flex;
  flex-direction: column;
}

/* 忘记密码按钮居中 */
.right-section .el-form-item:last-child {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 隐藏label占位 */
.right-section .el-form-item:last-child .el-form-item__label {
  display: none;
}

/* 让内容区域占满宽度 */
.right-section .el-form-item:last-child .el-form-item__content {
  margin-left: 0 !important;
  width: 100%;
  text-align: center;
}

/* 修改忘记密码按钮颜色 */
.right-section .el-button--primary {
  background-color: #436C85 !important;
  border-color: #436C85 !important;
  font-family: 'Noto Serif SC', serif !important;
}

/* 增大表单label字号 */
.right-section .el-form-item__label {
  font-size: 18px !important;
  font-weight: bold !important;
}

/* 保存修改按钮颜色 */
.bottom-actions .el-button--primary {
  background-color: #0B4081 !important;
  border-color: #0B4081 !important;
  font-family: 'Noto Serif SC', serif !important;
}

/* 修改家族按钮颜色 */
.family-section .el-button--primary {
  background-color: #436C85 !important;
  border-color: #436C85 !important;
  font-family: 'Noto Serif SC', serif !important;
}

/* 删除家族按钮颜色 */
.family-section .el-button--danger {
  background-color: #DEB4B2 !important;
  border-color: #DEB4B2 !important;
  font-family: 'Noto Serif SC', serif !important;
  color: black !important;
}

.avatar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.avatar-uploader {
  cursor: pointer;
}

.avatar {
  cursor: pointer;
}

.nickname-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -10px;
}

.nickname-text {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  text-align: center;
}

.family-management {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-height: 600px;
}

.section-subtitle {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--primary-color);
  font-weight: bold;
  text-align: left;
}

.admin-family-member-section {
  margin-bottom: 30px;
}

.admin-family-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #606266;
  font-weight: bold;
}

.family-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.family-section .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.family-section .el-table__inner-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.family-section .el-table__body-wrapper {
  flex: 1;
  min-height: 200px;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

/* 增大底部按钮尺寸 */
.bottom-actions .el-button {
  padding: 18px 40px !important;
  font-size: 20px !important;
  min-width: 150px !important;
  height: auto !important;
  font-family: 'Noto Serif SC', serif !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.loading-state {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.delete-confirm-content {
  text-align: center;
  padding: 20px 0;
}

.invite-code-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-code-hidden,
.invite-code-visible {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 14px;
}

.invite-code-visible {
  color: var(--primary-color);
}

.invite-code-cell .el-button {
  padding: 0;
  min-width: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-section,
  .right-section {
    width: 100%;
  }
}
</style>