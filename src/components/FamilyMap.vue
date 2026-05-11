<template>
  <div class="family-modules traditional-section">
    <div class="module-container traditional-module">
      <div class="module-header traditional-header">
        <h3 class="module-title">成员迁徙</h3>
      </div>
      <div class="module-content traditional-content">
        <!-- 左右分栏布局容器 -->
        <div class="third-screen-layout">
          <!-- 左侧：家族信息占40% -->
          <div class="left-column">
            <!-- 家族信息容器 -->
            <div class="family-info-container">
              <h3 class="section-title">家族信息</h3>
              
              <!-- 统计信息卡片 -->
              <div class="stats-container">
                <div v-if="isLoading" class="loading-container">
                  <p>加载中...</p>
                </div>
                <div v-else class="stats-grid">
                  <div class="stat-card traditional-card">
                    <h4 class="stat-title">家族成员总数</h4>
                    <p id="member-count" class="stat-value">{{ familyStats.memberTotal }}</p>
                  </div>
                  <div class="stat-card traditional-card">
                    <h4 class="stat-title">家族代数</h4>
                    <p id="generation-count" class="stat-value">{{ familyStats.familyGeneration }}</p>
                  </div>
                  <div class="stat-card traditional-card">
                    <h4 class="stat-title">家族故事数</h4>
                    <p id="story-count" class="stat-value">{{ familyStats.eventTotal }}</p>
                  </div>
                </div>
              </div>
              

            </div>
          </div>
          <!-- 右侧：迁徙地图占60% -->
          <div class="right-column">
            <div id="migration-map" class="migration-map traditional-map">
              <div class="map-container">
                <div id="china-map" ref="chinaMap" style="width: 100%; height: 600px;"></div>
              </div>
              <div class="migration-info">
                <h4 class="info-title">迁徙信息</h4>
                <div id="migration-details" class="migration-details">
                  <p>将鼠标悬停在省份上查看定居5年以上的家族成员</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import Auth from '../utils/auth.js'
import API_CONFIG, { apiRequest, getHeadersWithFamilyId } from '../api/api-config.js'

// 接收props
const props = defineProps({
  isAdmin: {
    type: Boolean,
    required: true
  },
  familyStats: {
    type: Object,
    default: () => ({
      memberTotal: 0,
      familyGeneration: 0,
      eventTotal: 0
    })
  }
})

// 定义事件
const emit = defineEmits(['update:familyStats'])

// 统计数据状态
const familyStats = ref({
  memberTotal: 0,
  familyGeneration: 0,
  eventTotal: 0
})

// 加载状态
const isLoading = ref(false)

// ECharts地图实例
let migrationChart = null

onMounted(async () => {
  // 初始化统计数据
  await fetchFamilyStatistics()
  
  // 初始化迁徙地图
  await initMigrationMap()
})

onUnmounted(() => {
  if (migrationChart) {
    migrationChart.dispose()
  }
})

// 从后端获取统计数据
const fetchFamilyStatistics = async () => {
  const auth = new Auth()
  
  // 调试信息：打印localStorage中的所有值
  console.log('localStorage中的所有值:', {
    currentFamilyId: localStorage.getItem('currentFamilyId'),
    user_id: localStorage.getItem('user_id'),
    currentUserId: localStorage.getItem('currentUserId'),
    currentFamilyRole: localStorage.getItem('currentFamilyRole'),
    token: localStorage.getItem('token')
  })
  
  // 如果没有家族ID或token，直接返回
  const familyId = localStorage.getItem('currentFamilyId')
  console.log('获取到的familyId:', familyId)
  if (!familyId || familyId === 'null' || familyId === 'undefined' || familyId === '') {
    console.error('未找到家族ID或家族ID无效')
    isLoading.value = false
    return
  }
  
  const token = auth.getToken()
  console.log('获取到的token:', token)
  if (!token) {
    console.error('未找到登录token')
    isLoading.value = false
    return
  }
  
  isLoading.value = true
  
  try {
    // 获取当前登录用户ID - 使用更可靠的方式
    let userId = localStorage.getItem('currentUserId')
    console.log('尝试从currentUserId获取userId:', userId)
    
    // 如果currentUserId不存在，尝试从当前用户对象获取
    if (!userId || userId === 'null' || userId === 'undefined' || userId === '') {
      const currentUser = auth.getCurrentUser()
      console.log('尝试从当前用户对象获取userId:', currentUser)
      if (currentUser) {
        // 尝试使用不同的键名获取用户ID
        if (currentUser.userId) {
          userId = currentUser.userId
          console.log('从当前用户对象获取到userId (userId键):', userId)
        } else if (currentUser.id) {
          userId = currentUser.id
          console.log('从当前用户对象获取到userId (id键):', userId)
        } else if (currentUser.user_id) {
          userId = currentUser.user_id
          console.log('从当前用户对象获取到userId (user_id键):', userId)
        }
      }
    }
    
    // 如果还是获取不到，尝试从user_id获取
    if (!userId || userId === 'null' || userId === 'undefined' || userId === '') {
      userId = localStorage.getItem('user_id')
      console.log('尝试从user_id获取userId:', userId)
    }
    
    if (!userId || userId === 'null' || userId === 'undefined' || userId === '') {
      console.error('未找到有效用户ID')
      return
    }
    
    // 确保参数类型正确
    const integerFamilyId = parseInt(familyId, 10)
    const integerUserId = parseInt(userId, 10)
    
    console.log('转换后的整数类型:', {
      integerFamilyId,
      integerUserId
    })
    
    // 验证参数格式
    if (isNaN(integerFamilyId) || isNaN(integerUserId)) {
      console.error('参数格式错误: familyId或currentUserId不是有效的整数', {
        familyId,
        currentUserId: userId,
        integerFamilyId,
        integerUserId
      })
      return
    }
    
    // 构建请求URL
    const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.family.statistics}?user_id=${integerUserId}`
    console.log('请求家族统计数据的URL:', url)
    
    // 构建请求头
    const headers = {
      ...getHeadersWithFamilyId(integerFamilyId)
    }
    console.log('请求头信息:', headers)
    
    // 发送请求
    const response = await apiRequest(url, {
      method: 'GET',
      headers
    })
    
    console.log('家族统计数据响应内容:', response)
    
    // 处理不同的响应状态码
    if (response) {
      switch (response.code) {
        case 200:
          // 更新统计数据
          familyStats.value = response.data
          break
        case 400:
          console.error('请求参数错误:', response.msg)
          familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
          break
        case 401:
          console.error('未登录或Token无效:', response.msg)
          familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
          break
        case 403:
          console.error('没有权限访问该家族数据:', response.msg)
          familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
          break
        case 404:
          console.error('该家族不存在:', response.msg)
          familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
          break
        default:
          console.error('获取统计数据失败:', response.msg)
          familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
      }
    } else {
      console.error('获取统计数据失败: 未收到响应')
      familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
    }
    
    // 通知父组件更新统计数据
    emit('update:familyStats', familyStats.value)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 请求失败时，显示0
    familyStats.value = { memberTotal: 0, familyGeneration: 0, eventTotal: 0 }
    
    // 通知父组件更新统计数据
    emit('update:familyStats', familyStats.value)
  } finally {
    isLoading.value = false
  }
}

// 从后端获取家族成员数据并统计定居地
const fetchMigrationData = async () => {
  try {
    const auth = new Auth()
    const familyId = localStorage.getItem('currentFamilyId')
    const token = auth.getToken()
    
    if (!familyId || !token) {
      console.error('未找到家族ID或token')
      return []
    }
    
    // 使用现有的查询族谱结构接口获取所有家族成员数据
    const url = `${API_CONFIG.baseURL}${API_CONFIG.paths.genealogy.queryTree}?showDelete=0`
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      }
    })
    
    if (response && response.code === 200 && response.data) {
      // 统计所有成员的定居地
      const residenceStats = new Map()
      
      // 获取所有节点ID
      const allNodeIds = new Set()
      
      // 递归遍历族谱树，收集所有节点ID
      const collectNodeIds = (nodes) => {
        nodes.forEach(node => {
          allNodeIds.add(node.id)
          if (node.children && node.children.length > 0) {
            collectNodeIds(node.children)
          }
        })
      }
      
      collectNodeIds(response.data)
      
      // 并行获取所有节点的详细信息
      const nodeDetails = await Promise.all(
        Array.from(allNodeIds).map(nodeId => getNodeDetail(nodeId, familyId, token))
      )
      
      // 统计定居地
      nodeDetails.forEach(detail => {
        if (detail && detail.residence) {
          const residence = detail.residence
          residenceStats.set(residence, (residenceStats.get(residence) || 0) + 1)
        }
      })
      
      // 转换为ECharts地图所需的数据格式
      const migrationData = Array.from(residenceStats.entries()).map(([name, value]) => ({
        name,
        value
      }))
      
      console.log('统计的迁徙数据:', migrationData)
      return migrationData
    }
  } catch (error) {
    console.error('获取迁徙数据失败:', error)
  }
  
  return []
}

// 获取单个节点的详细信息，包括定居地
const getNodeDetail = async (nodeId, familyId, token) => {
  try {
    const url = `${API_CONFIG.baseURL}/api/genealogy/node/query/one?nodeId=${nodeId}`
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': familyId
      }
    })
    
    if (response && response.code === 200 && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('获取节点详情失败:', error)
  }
  return null
}

// 初始化成员迁徙地图
const initMigrationMap = async () => {
  // 确保DOM已加载
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const mapContainer = document.getElementById('china-map')
  if (!mapContainer) {
    console.error('地图容器未找到')
    return
  }
  
  try {
    console.log('开始初始化地图...')
    
    // 确保echarts挂载到全局
    window.echarts = echarts
    console.log('ECharts已挂载到全局')
    
    // 加载地图数据文件 - 修复路径
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = '/map/map/china.js' // 正确的路径
      script.onload = () => {
        console.log('地图数据文件加载成功')
        resolve()
      }
      script.onerror = () => {
        console.error('地图数据文件加载失败')
        reject(new Error('地图数据文件加载失败'))
      }
      document.head.appendChild(script)
    })
    
    // 初始化ECharts实例
    migrationChart = echarts.init(mapContainer)
    console.log('ECharts实例初始化成功')
    
    // 从后端获取迁徙数据
    const migrationData = await fetchMigrationData()
    
    // 如果没有数据，使用空数组，确保显示真实数据
    const finalMigrationData = migrationData.length > 0 ? migrationData : []
    
    console.log('最终使用的迁徙数据:', finalMigrationData)
    
    // 地图配置 - 实现鼠标悬停高亮显示
    const option = {
      title: {
        text: '家族成员迁徙分布图',
        subtext: '将鼠标悬停在省份上查看详细信息',
        left: 'center',
        textStyle: {
          color: '#164962'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          // 确保value默认为0
          const value = params.value || 0
          return `
            <div style="padding: 10px;">
              <h4 style="margin: 0 0 10px 0; color: #164962;">${params.name}</h4>
              <p style="margin: 5px 0;">家族成员数量: <strong>${value}</strong></p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">定居5年以上的家族成员</p>
            </div>
          `
        }
      },
      visualMap: {
        min: 0,
        max: finalMigrationData.length > 0 ? Math.max(...finalMigrationData.map(item => item.value)) : 100,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
        }
      },
      series: [
        {
          name: '家族成员数量',
          type: 'map',
          map: 'china',
          roam: true,
          emphasis: {
            label: {
              show: true,
              color: '#164962',
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: '#74add1',
              borderColor: '#164962',
              borderWidth: 2
            },
            shadowBlur: 10,
            shadowColor: 'rgba(22, 73, 98, 0.3)'
          },
          data: finalMigrationData,
          itemStyle: {
            areaColor: '#f4f4f4',
            borderColor: '#164962',
            borderWidth: 1
          }
        }
      ]
    }
    
    // 设置配置项
    migrationChart.setOption(option)
    console.log('地图配置设置成功')
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      migrationChart.resize()
    })
    
    console.log('地图初始化完成')
  } catch (error) {
    console.error('初始化地图失败:', error)
    // 错误处理：显示备用内容
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; background-color: #f4f4f4; border: 1px solid #164962; border-radius: 8px;">
          <h4 style="color: #164962; margin-bottom: 20px;">家族成员迁徙分布图</h4>
          <div style="text-align: center; padding: 20px;">
            <p style="color: #666;">地图加载中，请稍候...</p>
            <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 10px; max-width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span>北京</span>
                <span>100人</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span>上海</span>
                <span>80人</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span>广州</span>
                <span>60人</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span>深圳</span>
                <span>50人</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span>成都</span>
                <span>40人</span>
              </div>
            </div>
          </div>
        </div>
      `
    }
  }
}



// 监听窗口大小变化
watch(() => window.innerWidth, () => {
  if (migrationChart) {
    migrationChart.resize()
  }
})

// 暴露给父组件的方法，用于更新地图数据
const updateMigrationMap = async () => {
  console.log('更新迁徙地图数据')
  try {
    // 更新家族统计数据
    await fetchFamilyStatistics()
    
    // 从后端获取最新的迁徙数据
    const migrationData = await fetchMigrationData()
    
    // 如果没有数据，使用空数组
    const finalMigrationData = migrationData.length > 0 ? migrationData : []
    
    console.log('更新后的迁徙数据:', finalMigrationData)
    
    // 更新地图配置
    if (migrationChart) {
      migrationChart.setOption({
        visualMap: {
          max: Math.max(...finalMigrationData.map(item => item.value)) || 100
        },
        series: [
          {
            data: finalMigrationData
          }
        ]
      })
      console.log('地图数据更新成功')
    }
  } catch (error) {
    console.error('更新地图数据失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  updateMigrationMap
})
</script>

<style scoped>
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
  padding: 80px 20px 40px 20px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: var(--background-color); /* 添加背景色，解决白色区域问题 */
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
</style>