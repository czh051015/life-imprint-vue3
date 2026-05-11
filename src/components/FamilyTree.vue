<template>
  <div class="main-container traditional-border">
    <!-- 左右分栏布局容器 -->
    <div class="first-screen-layout">
      <!-- 左侧：家族树占66.67% -->
      <div class="left-column family-tree-area">
        <!-- 家族树容器 -->
        <div class="family-tree-container">

          <!-- 家族树内容 - 动态生成 -->
          <div class="family-tree-content" id="family-tree-content" 
               :style="{ 
                 transform: `scale(${scale}) translate(${currentX}px, ${currentY}px)`, 
                 transformOrigin: 'center center' 
               }" 
               @mousedown="startDrag" 
               @mousemove="drag" 
               @mouseup="stopDrag" 
               @mouseleave="stopDrag"
               @wheel="handleWheel">
            <!-- SVG 连接线容器 -->
            <svg class="family-tree-lines" width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">
              <!-- 动态渲染所有连接线 -->
              <template v-for="line in familyLines" :key="line.id">
                <polyline 
                  :points="line.points" 
                  stroke="#999" 
                  stroke-width="2" 
                  fill="none" 
                />
              </template>
            </svg>
            
            <!-- 动态渲染每一代 -->
            <template v-for="generation in generations" :key="generation">
              <!-- 代际行 -->
              <div class="generation-row">
                <!-- 渲染该代的所有家庭单元 -->
                <template v-for="node in getNodesByGeneration(generation)" :key="node.id">
                  <!-- 家庭单元容器：包含核心节点+配偶节点 -->
                  <div class="parent-container">
                    <!-- 家庭单元：核心节点+配偶节点 -->
                    <div class="family-unit">
                      <!-- 核心节点 -->
                      <div 
                        class="family-node" 
                        :class="{ 
                          selected: selectedNode?.id === node.id, 
                          male: node.gender === '男',
                          female: node.gender === '女'
                        }" 
                        @click="selectNode(node)"
                        @dblclick="goToDetail(node.id)"
                        :data-node-id="node.id"
                      >
                        <div class="node-content">
                          <div class="node-name">{{ node.name }}</div>
                          <div class="node-details">第{{ node.generation }}代</div>
                        </div>
                      </div>
                      <!-- 配偶节点 -->
                      <div 
                        v-for="spouse in getSpouseNodes(node)" 
                        :key="spouse.id"
                        class="family-node" 
                        :class="{ 
                          selected: selectedNode?.id === spouse.id, 
                          male: spouse.gender === '男',
                          female: spouse.gender === '女'
                        }" 
                        @click="selectNode(spouse)"
                        @dblclick="goToDetail(spouse.id)"
                        :data-node-id="spouse.id"
                      >
                        <div class="node-content">
                          <div class="node-name">{{ spouse.name }}</div>
                          <div class="node-details">第{{ spouse.generation }}代</div>
                        </div>
                      </div>
                    </div>
                    <!-- 子区域：只用于显示连接线，子女节点由getNodesByGeneration在对应的世代中渲染 -->
                    <!-- 移除了错误的子节点嵌套渲染，避免层级关系错乱 -->
                    <div class="child-area"></div>
                  </div>
                </template>
              </div>
              <!-- 代际分隔线 -->
              <div class="generation-divider"></div>
            </template>
          </div>
        </div>
      </div>
      
      <!-- 右侧：功能区域占30%，固定 -->
      <div class="right-column fixed-sidebar">
        <!-- 管理员功能栏 -->
        <div id="admin-sidebar" class="sidebar-content" v-if="isAdmin">
          <div class="current-node">当前选中节点：{{ selectedMember.name || '--' }}</div>
          <div class="divider"></div>
          
          <!-- 关系管理 -->
          <div class="section-header">关系管理</div>
          <div class="relationship-management">
            <button id="add-child-btn" class="btn-secondary traditional-btn" @click="addChildBtnClick" :disabled="!selectedNode">添加子女</button>
            <button id="add-spouse-btn" class="btn-secondary traditional-btn" @click="addSpouseBtnClick" :disabled="!selectedNode">添加配偶</button>
          </div>
          
          <div class="basic-info-card">
            <div class="form-group">
              <label for="member-name" class="traditional-label">姓名</label>
              <input type="text" id="member-name" placeholder="输入姓名" class="traditional-input" v-model="currentMember.name">
            </div>
            <div class="form-group">
              <label for="member-gender" class="traditional-label">性别</label>
              <select id="member-gender" class="traditional-input" v-model="currentMember.gender">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div class="form-group">
              <label for="member-birth" class="traditional-label">出生日期</label>
              <input type="date" id="member-birth" class="traditional-input" v-model="currentMember.birthDate" @input="validateDate($event, 'birth')">
              <span id="birth-error" class="error-message">{{ birthError }}</span>
            </div>
            <div class="form-group">
              <label for="member-death" class="traditional-label">逝世日期</label>
              <input type="date" id="member-death" class="traditional-input" v-model="currentMember.deathDate" @input="validateDate($event, 'death')">
              <span id="death-error" class="error-message">{{ deathError }}</span>
            </div>
            <div class="form-group">
              <label for="member-residence" class="traditional-label">定居地</label>
              <select id="member-residence" class="traditional-input" v-model="currentMember.residence">
                <option value="">请选择省份</option>
                <option value="北京">北京</option>
                <option value="天津">天津</option>
                <option value="河北">河北</option>
                <option value="山西">山西</option>
                <option value="内蒙古">内蒙古</option>
                <option value="辽宁">辽宁</option>
                <option value="吉林">吉林</option>
                <option value="黑龙江">黑龙江</option>
                <option value="上海">上海</option>
                <option value="江苏">江苏</option>
                <option value="浙江">浙江</option>
                <option value="安徽">安徽</option>
                <option value="福建">福建</option>
                <option value="江西">江西</option>
                <option value="山东">山东</option>
                <option value="河南">河南</option>
                <option value="湖北">湖北</option>
                <option value="湖南">湖南</option>
                <option value="广东">广东</option>
                <option value="广西">广西</option>
                <option value="海南">海南</option>
                <option value="重庆">重庆</option>
                <option value="四川">四川</option>
                <option value="贵州">贵州</option>
                <option value="云南">云南</option>
                <option value="西藏">西藏</option>
                <option value="陕西">陕西</option>
                <option value="甘肃">甘肃</option>
                <option value="青海">青海</option>
                <option value="宁夏">宁夏</option>
                <option value="新疆">新疆</option>
                <option value="香港">香港</option>
                <option value="澳门">澳门</option>
                <option value="台湾">台湾</option>
              </select>
            </div>
            <div class="form-group">
              <label for="member-occupation" class="traditional-label">职业</label>
              <input type="text" id="member-occupation" placeholder="输入职业" class="traditional-input" v-model="currentMember.occupation">
            </div>
            <div class="form-group textarea-group">
              <label for="member-biography" class="traditional-label">成员简介</label>
              <textarea id="member-biography" placeholder="输入成员简介" class="traditional-input" style="height: 80px;" v-model="currentMember.biography"></textarea>
            </div>
          </div>
          
          <div class="operation-area">
            <button id="add-member-btn" class="btn-primary traditional-btn" @click="addMember">添加</button>
            <button id="delete-node-btn" class="btn-danger traditional-btn" :disabled="!selectedNode" @click="deleteNode">删除</button>
            <button id="view-detail-btn" class="btn-primary traditional-btn" @click="viewDetail">查看详情</button>
          </div>
        </div>
        
        <!-- 普通用户功能栏 - 简化版，无编辑功能 -->
        <div id="user-sidebar" class="sidebar-content" v-else>
          <div class="current-node">当前选中节点：{{ selectedMember.name || '--' }}</div>
          <div class="divider"></div>
          
          <!-- 成员基础信息区 -->
          <div class="basic-info-display" :class="selectedMember.gender">
            <div class="info-item">
              <label class="info-label">姓名：</label>
              <span id="display-name">{{ selectedMember.name || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">性别：</label>
              <span id="display-gender">{{ selectedMember.gender || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">出生日期：</label>
              <span id="display-birth">{{ selectedMember.birthDate || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">逝世日期：</label>
              <span id="display-death">{{ selectedMember.deathDate || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">定居地：</label>
              <span id="display-residence">{{ selectedMember.residence || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">职业：</label>
              <span id="display-occupation">{{ selectedMember.occupation || '-' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">成员简介：</label>
              <span id="display-biography">{{ selectedMember.biography || '-' }}</span>
            </div>
          </div>
          
          <!-- 查看详情按钮 -->
          <div class="detail-button">
            <button id="view-detail-btn" class="btn-secondary traditional-btn" @click="viewDetail">查看详情</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import API_CONFIG, { genealogyAPI } from '../api/api-config.js'

// 接收props
const props = defineProps({
  isAdmin: {
    type: Boolean,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['member-updated'])

// 缩放功能相关变量和函数
const scale = ref(1);

// 鼠标滚轮缩放处理函数
const handleWheel = (event) => {
  event.preventDefault();
  
  // 计算缩放比例，使用较小的步长以获得更平滑的缩放效果
  const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
  
  // 更新缩放比例，限制在0.5到2之间
  scale.value = Math.max(0.5, Math.min(2, scale.value * scaleFactor));
};

const resetZoom = () => { 
  scale.value = 1;
  currentX.value = 0;
  currentY.value = 0;
};

// 拖拽功能相关变量和函数
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const currentX = ref(0);
const currentY = ref(0);

const startDrag = (event) => {
  isDragging.value = true;
  dragStartX.value = event.clientX - currentX.value;
  dragStartY.value = event.clientY - currentY.value;
  document.body.style.cursor = 'grabbing';
};

const drag = (event) => {
  if (!isDragging.value) return;
  currentX.value = event.clientX - dragStartX.value;
  currentY.value = event.clientY - dragStartY.value;
};

const stopDrag = () => {
  isDragging.value = false;
  document.body.style.cursor = 'default';
};

// 日期验证函数
const validateDate = (event, type) => {
  const value = event.target.value
  if (type === 'birth') {
    birthError.value = ''
  } else if (type === 'death') {
    deathError.value = ''
  }
  
  // 这里可以添加日期验证逻辑
  // 例如：确保逝世日期不在出生日期之前
}

// 当前选中的成员
const currentMember = reactive({
  name: '',
  gender: '男',
  birthDate: '',
  deathDate: '',
  residence: '',
  occupation: '',
  biography: ''
})

// 选中显示的成员（普通用户查看）
const selectedMember = reactive({
  name: '',
  gender: '',
  birthDate: '',
  deathDate: '',
  residence: '',
  occupation: '',
  biography: ''
})

// 错误消息
const birthError = ref('')
const deathError = ref('')

// 移除加载状态，直接刷新数据
const errorMessage = ref('')

// 获取当前家族ID
const familyId = ref(localStorage.getItem('currentFamilyId') || '1') // 从localStorage获取，默认1

// 节点ID生成器
let nodeIdCounter = 2

// 路由实例
const router = useRouter()

// 跳转到个人详情页
const goToDetail = (nodeId) => {
  console.log('双击节点，跳转到详情页，nodeId:', nodeId)
  router.push(`/member/${nodeId}`)
}

// 家族树节点数据 - 核心数据结构
const nodes = ref([])

// 当前选中的节点
const selectedNode = ref(null)

// 家族树连接线数据
const familyLines = ref([])

// 计算属性：获取所有节点的层级映射
const nodeGenerationMap = computed(() => {
  const map = {};
  nodes.value.forEach(node => {
    if (!map[node.generation]) {
      map[node.generation] = [];
    }
    map[node.generation].push(node);
  });
  return map;
});

// 计算家族树连接线 - 基于实际DOM元素位置
const calculateFamilyLines = () => {
  const lines = [];
  let lineId = 0;
  
  // 获取家族树内容容器的位置，用于计算相对坐标
  const familyTreeContent = document.getElementById('family-tree-content');
  if (!familyTreeContent) return;
  
  const treeRect = familyTreeContent.getBoundingClientRect();
  
  // 遍历所有父节点，为每个父节点生成与子女的连接线
  nodes.value.forEach(parentNode => {
    // 获取当前父节点的所有子女
    const children = getChildrenNodes(parentNode);
    if (children.length === 0) return;
    
    // 查找父节点的DOM元素
    const parentElement = document.querySelector(`[data-node-id="${parentNode.id}"]`);
    if (!parentElement) return;
    
    // 获取父节点的配偶节点DOM元素
    let spouseElement = null;
    const spouse = getSpouseNodes(parentNode)[0];
    if (spouse) {
      spouseElement = document.querySelector(`[data-node-id="${spouse.id}"]`);
    }
    
    // 计算父节点家庭单元的底部中心点
    let parentBottomCenterX, parentBottomCenterY;
    
    if (spouseElement) {
      // 双亲家庭：计算父母节点组成的家庭单元的底部中心点
      const parentRect = parentElement.getBoundingClientRect();
      const spouseRect = spouseElement.getBoundingClientRect();
      
      // 家庭单元的总宽度是从父节点左侧到配偶节点右侧
      const familyLeft = Math.min(parentRect.left, spouseRect.left);
      const familyRight = Math.max(parentRect.right, spouseRect.right);
      const familyWidth = familyRight - familyLeft;
      
      // 底部中心点坐标
      parentBottomCenterX = familyLeft + familyWidth / 2 - treeRect.left;
      parentBottomCenterY = Math.max(parentRect.bottom, spouseRect.bottom) - treeRect.top;
    } else {
      // 单亲家庭：直接使用父节点的底部中心点
      const parentRect = parentElement.getBoundingClientRect();
      parentBottomCenterX = parentRect.left + parentRect.width / 2 - treeRect.left;
      parentBottomCenterY = parentRect.bottom - treeRect.top;
    }
    
    // 为每个子女生成连接线
    children.forEach(childNode => {
      // 查找子节点的DOM元素
      const childElement = document.querySelector(`[data-node-id="${childNode.id}"]`);
      if (!childElement) return;
      
      // 获取子节点的顶部中心点
      const childRect = childElement.getBoundingClientRect();
      const childTopCenterX = childRect.left + childRect.width / 2 - treeRect.left;
      const childTopCenterY = childRect.top - treeRect.top;
      
      // 计算折线的中间点Y坐标
      const midY = (parentBottomCenterY + childTopCenterY) / 2;
      
      // 创建折线点数组
      const points = [
        `${parentBottomCenterX},${parentBottomCenterY}`,  // 起点：父节点家庭单元底部中心点
        `${parentBottomCenterX},${midY}`,               // 中间点1：垂直向下到中间位置
        `${childTopCenterX},${midY}`,                    // 中间点2：水平连接到子女节点位置
        `${childTopCenterX},${childTopCenterY}`          // 终点：子节点顶部中心点
      ];
      
      // 添加连接线到数组
      lines.push({
        id: lineId++,
        points: points
      });
    });
  });
  
  familyLines.value = lines;
};

// 计算属性：获取所有世代
const generations = computed(() => {
  if (nodes.value.length === 0) return []
  const allGenerations = nodes.value.map(node => node.generation)
  console.log('所有节点的世代:', allGenerations)
  const maxGeneration = Math.max(...allGenerations)
  console.log('最大世代:', maxGeneration)
  const generationsArray = Array.from({ length: maxGeneration }, (_, i) => i + 1)
  console.log('生成的世代数组:', generationsArray)
  return generationsArray
})

// 根据ID获取节点
const getNodeById = (id) => {
  console.log('根据ID', id, '获取节点，nodes数组:', nodes.value)
  const node = nodes.value.find(node => node.id === id)
  console.log('找到的节点:', node)
  return node
}

// 根据世代获取节点 - 显示所有主节点和没有配偶的节点，确保子女节点能正确显示
const getNodesByGeneration = (generation) => {
  // 🔴 核心修复：只返回指定世代的节点，直接使用数据库返回的generation字段
  const nodesByGen = nodes.value.filter(node => {
    // 直接使用节点的generation字段，不进行任何修改
    console.log('检查节点', node.name, 'ID:', node.id, '的generation:', node.generation, '目标generation:', generation)
    return node.generation === generation
  })
  console.log('根据世代', generation, '获取节点:', nodesByGen)
  
  // 🔴 核心修复：改进主节点筛选逻辑，确保正确处理家庭单元
  const mainNodes = nodesByGen.filter(node => {
    // 1. 根节点总是显示
    if (node.isRoot) return true
    
    // 2. 非根节点：
    //    - 如果有配偶，只保留id更小的那个作为主节点
    //    - 如果是子女节点，确保只显示一次
    if (node.spouseId) {
      // 检查是否有配偶，且当前节点是id更小的那个
      return node.id < node.spouseId
    }
    
    // 3. 没有配偶的节点：
    //    - 检查是否是其他节点的配偶
    //    - 如果不是配偶，直接显示
    const isSpouseOfOthers = nodes.value.some(n => n.spouseId === node.id)
    return !isSpouseOfOthers
  })
  
  // 🔴 核心修复：按父节点ID分组排序，确保同一家庭的子女节点相邻显示
  // 先按父节点ID分组，再按节点ID排序
  const groupedByParent = {};
  mainNodes.forEach(node => {
    const parentId = node.parentId || node.fatherId || 'root';
    if (!groupedByParent[parentId]) {
      groupedByParent[parentId] = [];
    }
    groupedByParent[parentId].push(node);
  });
  
  // 按父节点分组后排序，确保同一家庭的节点相邻
  let sortedNodes = [];
  Object.values(groupedByParent).forEach(group => {
    // 按节点ID排序，确保稳定的显示顺序
    group.sort((a, b) => a.id - b.id);
    sortedNodes = [...sortedNodes, ...group];
  });
  
  console.log('获取到的主节点:', sortedNodes)
  return sortedNodes
}

// 获取配偶节点
const getSpouseNodes = (node) => {
  console.log('获取配偶节点，node:', node)
  if (!node.spouseId) {
    console.log('节点没有spouseId，返回空数组')
    return []
  }
  console.log('节点的spouseId:', node.spouseId)
  const spouse = getNodeById(node.spouseId)
  console.log('根据spouseId', node.spouseId, '找到配偶:', spouse)
  return spouse ? [spouse] : []
}

// 获取子女节点
const getChildrenNodes = (node) => {
  // 🔴 核心修复：兼容fatherId和parentId两种情况，确保正确找到所有子女节点
  return nodes.value.filter(child => {
    return child.parentId === node.id || child.fatherId === node.id
  })
}

// 选择节点
const selectNode = async (node) => {
  console.log('选中的节点:', node)
  selectedNode.value = node
  
  // 🔴 调试日志：显示节点的所有属性
  console.log('节点完整属性:', {
    name: node.name,
    gender: node.gender,
    birthDate: node.birthDate,
    deathDate: node.deathDate,
    residence: node.residence,
    occupation: node.occupation,
    biography: node.biography,
    career: node.career,
    intro: node.intro
  })
  
  // 🔴 核心修改：调用新的接口查询节点详情
  try {
    // 只有当节点有id时才调用接口查询详情
    if (node.id) {
      console.log('调用queryNodeById接口，查询节点详情，nodeId:', node.id)
      const response = await genealogyAPI.queryNodeById(familyId.value, node.id)
      console.log('查询节点详情响应:', response)
      
      // 如果查询成功且有数据，则使用查询到的数据
      if (response.code === 200 && response.data) {
        const detailedNode = response.data
        console.log('查询到的节点详情:', detailedNode)
        
        // 🔴 核心优化：区分新节点和数据库节点，设置不同的默认值
        // 新节点：name为"未命名"或"始祖"，且其他属性为空
        // 数据库节点：有完整的属性信息
        const isNewNode = (detailedNode.name === "未命名" || detailedNode.name === "始祖") && 
                          !detailedNode.birthDate && 
                          !detailedNode.deathDate && 
                          !detailedNode.residence && 
                          !detailedNode.career && 
                          !detailedNode.intro
        
        console.log('isNewNode判断结果:', isNewNode)
        
        // 更新当前成员信息
        currentMember.name = detailedNode.name || ''
        currentMember.gender = detailedNode.gender === 1 ? '男' : '女'
        // 🔴 核心修改：总是显示实际数据，不区分新节点和数据库节点
        // 新节点显示空默认值，数据库节点显示实际数据
        currentMember.birthDate = detailedNode.birthDate || ''
        currentMember.deathDate = detailedNode.deathDate || ''
        currentMember.residence = detailedNode.residence || ''
        // 🔴 核心修改：使用career字段，对应后端的职业字段
        currentMember.occupation = detailedNode.career || ''
        // 🔴 核心修改：使用intro字段，对应后端的简介字段
        currentMember.biography = detailedNode.intro || ''
        
        // 更新选中成员信息（普通用户查看）
        selectedMember.name = detailedNode.name || ''
        selectedMember.gender = detailedNode.gender === 1 ? '男' : '女'
        selectedMember.birthDate = detailedNode.birthDate || ''
        selectedMember.deathDate = detailedNode.deathDate || ''
        selectedMember.residence = detailedNode.residence || ''
        selectedMember.occupation = detailedNode.career || ''
        selectedMember.biography = detailedNode.intro || ''
      } else {
        // 查询失败或无数据，使用节点的现有数据
        console.log('查询节点详情失败或无数据，使用现有数据')
        // 更新当前成员信息
        currentMember.name = node.name || ''
        currentMember.gender = node.gender || '男'
        currentMember.birthDate = node.birthDate || ''
        currentMember.deathDate = node.deathDate || ''
        currentMember.residence = node.residence || ''
        currentMember.occupation = node.occupation || node.career || ''
        currentMember.biography = node.biography || node.intro || ''
        
        // 更新选中成员信息（普通用户查看）
        selectedMember.name = node.name || ''
        selectedMember.gender = node.gender || ''
        selectedMember.birthDate = node.birthDate || ''
        selectedMember.deathDate = node.deathDate || ''
        selectedMember.residence = node.residence || ''
        selectedMember.occupation = node.occupation || node.career || ''
        selectedMember.biography = node.biography || node.intro || ''
      }
    } else {
      // 节点没有id，使用现有数据
      console.log('节点没有id，使用现有数据')
      // 更新当前成员信息
      currentMember.name = node.name || ''
      currentMember.gender = node.gender || '男'
      currentMember.birthDate = node.birthDate || ''
      currentMember.deathDate = node.deathDate || ''
      currentMember.residence = node.residence || ''
      currentMember.occupation = node.occupation || node.career || ''
      currentMember.biography = node.biography || node.intro || ''
      
      // 更新选中成员信息（普通用户查看）
      selectedMember.name = node.name || ''
      selectedMember.gender = node.gender || ''
      selectedMember.birthDate = node.birthDate || ''
      selectedMember.deathDate = node.deathDate || ''
      selectedMember.residence = node.residence || ''
      selectedMember.occupation = node.occupation || node.career || ''
      selectedMember.biography = node.biography || node.intro || ''
    }
  } catch (error) {
    console.error('查询节点详情失败:', error)
    // 发生错误，使用节点的现有数据
    // 更新当前成员信息
    currentMember.name = node.name || ''
    currentMember.gender = node.gender || '男'
    currentMember.birthDate = node.birthDate || ''
    currentMember.deathDate = node.deathDate || ''
    currentMember.residence = node.residence || ''
    currentMember.occupation = node.occupation || node.career || ''
    currentMember.biography = node.biography || node.intro || ''
    
    // 更新选中成员信息（普通用户查看）
    selectedMember.name = node.name || ''
    selectedMember.gender = node.gender || ''
    selectedMember.birthDate = node.birthDate || ''
    selectedMember.deathDate = node.deathDate || ''
    selectedMember.residence = node.residence || ''
    selectedMember.occupation = node.occupation || node.career || ''
    selectedMember.biography = node.biography || node.intro || ''
  }
  
  console.log('更新后的currentMember:', currentMember)
  console.log('更新后的selectedMember:', selectedMember)
}

// 添加子女 - 从按钮点击
const addChildBtnClick = () => {
  if (!props.isAdmin) {
    return
  }
  
  if (!selectedNode.value) {
    return
  }
  
  addChild()
}

// 添加配偶 - 从按钮点击
const addSpouseBtnClick = () => {
  if (!props.isAdmin) {
    return
  }
  
  if (!selectedNode.value) {
    return
  }
  
  addSpouse()
}

// 添加子女
const addChild = async () => {
  if (!selectedNode.value) return
  
  errorMessage.value = ''
  
  try {
    // 记录当前节点列表，用于后续查找新添加的节点
    const currentNodeIds = new Set(nodes.value.map(node => node.id))
    
    // 准备请求数据
    const requestData = {
      parentNodeId: selectedNode.value.id,
      parentType: selectedNode.value.gender === '男' ? 1 : 2, // 1=父亲/2=母亲
      name: "未命名",
      // 🔴 核心修改：将性别字符串转换为数字，适配后端Integer类型
      gender: 1
    }
    
    // 调用新增/编辑子女接口
    const response = await genealogyAPI.addOrUpdateChild(familyId.value, requestData)
    
    // 处理响应
        if (response && response.code === 200) {
          // 重新加载家族树数据
          await loadFamilyTreeData()
          
          // 触发成员更新事件，通知父组件更新地图数据
          emit('member-updated')
          
          // 🔴 核心优化：找到并选中新添加的节点
          // 遍历重新加载后的节点列表，找到新增的节点
          for (const node of nodes.value) {
            // 如果节点ID不在原来的列表中，且名称为"未命名"，则认为是刚添加的节点
            if (!currentNodeIds.has(node.id) && node.name === "未命名") {
              selectNode(node)
              break
            }
          }
        }
  } catch (error) {
    console.error('添加子女错误:', error)
  }
}

// 添加配偶
const addSpouse = async () => {
  if (!selectedNode.value) return
  
  // 检查是否已有配偶
  if (selectedNode.value.spouseId) {
    // 查找配偶节点，确认是否真正存在
    const existingSpouse = getNodeById(selectedNode.value.spouseId)
    if (existingSpouse) {
      return
    }
  }
  
  errorMessage.value = ''
  
  try {
    // 记录当前节点列表，用于后续查找新添加的节点
    const currentNodeIds = new Set(nodes.value.map(node => node.id))
    
    // 准备请求数据
    const requestData = {
      nodeId: selectedNode.value.id,
      name: "未命名",
      // 🔴 核心修改：将性别字符串转换为数字，适配后端Integer类型
      gender: selectedNode.value.gender === '男' ? 2 : 1
    }
    
    console.log('添加配偶请求数据:', requestData)
    console.log('当前家族ID:', familyId.value)
    
    // 调用新增/编辑配偶接口
    const response = await genealogyAPI.addOrUpdateSpouse(familyId.value, requestData)
    
    // 🔴 详细日志：显示完整的响应数据
    console.log('添加配偶响应:', response)
    console.log('响应状态码:', response.code)
    console.log('响应消息:', response.msg)
    console.log('响应数据:', response.data)
    
    // 处理响应
    if (response && response.code === 200) {
      // 重新加载家族树数据
      await loadFamilyTreeData()
      
      // 触发成员更新事件，通知父组件更新地图数据
      emit('member-updated')
      
      // 🔴 核心优化：找到并选中新添加的节点
      // 遍历重新加载后的节点列表，找到新增的节点
      for (const node of nodes.value) {
        // 如果节点ID不在原来的列表中，且名称为"未命名"，则认为是刚添加的节点
        if (!currentNodeIds.has(node.id) && node.name === "未命名") {
          selectNode(node)
          break
        }
      }
    } else {
      // 显示详细的错误信息
      console.error('添加配偶失败，响应码:', response?.code, '响应消息:', response?.msg)
    }
  } catch (error) {
    console.error('添加配偶错误:', error)
    console.error('错误详情:', error.message)
    console.error('错误栈:', error.stack)
  }
}

// 添加成员（更新节点信息）
const addMember = async () => {
  if (!props.isAdmin) {
    return
  }
  
  if (!selectedNode.value) {
    return
  }
  
  if (!currentMember.name.trim()) {
    return
  }
  
  // 校验姓名长度（2-10字）
  if (currentMember.name.length < 2 || currentMember.name.length > 10) {
    return
  }
  
  errorMessage.value = ''
  
  try {
    // 准备请求数据
    const requestData = {
      name: currentMember.name,
      gender: currentMember.gender === '男' ? 1 : 2, // 转换为数字类型：男=1，女=2
      birthDate: currentMember.birthDate || '',
      deathDate: currentMember.deathDate || '',
      residence: currentMember.residence || '',
      career: currentMember.occupation || '', // 注意：前端字段是occupation，后端字段是career
      intro: currentMember.biography || '' // 注意：前端字段是biography，后端字段是intro
    }
    
    // 🔴 核心修改：判断是新增还是修改
    const isUpdate = selectedNode.value && selectedNode.value.id 
      && nodes.value.some(node => node.id === selectedNode.value.id)
    
    // 只有在修改时才传递id
    if (isUpdate) {
      requestData.id = selectedNode.value.id
    }
    
    // 根据节点类型调用不同的接口
    let response
    let apiCallMade = false
    
    console.log('开始API调用，节点类型分析:')
    console.log('selectedNode:', selectedNode.value)
    console.log('isRoot:', selectedNode.value.isRoot)
    console.log('parentId:', selectedNode.value.parentId)
    console.log('fatherId:', selectedNode.value.fatherId)
    console.log('spouseId:', selectedNode.value.spouseId)
    
    // 🔴 核心修改：优先使用isRoot判断，确保根节点能正确处理
    if (selectedNode.value.isRoot) {
      // 根节点，调用新增/编辑根节点接口
      console.log('调用根节点接口，请求数据:', requestData)
      response = await genealogyAPI.addOrUpdateRoot(familyId.value, requestData)
      apiCallMade = true
      console.log('根节点接口响应:', response)
    } else {
      // 非根节点，进一步判断是配偶节点还是子女节点
      // 🔴 核心修改：兼容fatherId和parentId两种情况
      const hasParent = selectedNode.value.parentId || selectedNode.value.fatherId
      const hasSpouse = selectedNode.value.spouseId
      
      if (!hasParent && hasSpouse) {
        // 配偶节点，调用新增/编辑配偶接口
        const coreNode = nodes.value.find(node => node.spouseId === selectedNode.value.id)
        if (coreNode) {
          requestData.nodeId = coreNode.id
          console.log('调用配偶节点接口，请求数据:', requestData)
          response = await genealogyAPI.addOrUpdateSpouse(familyId.value, requestData)
          apiCallMade = true
          console.log('配偶节点接口响应:', response)
        } else {
          console.error('无法找到配偶对应的核心节点，coreNode:', coreNode)
          console.error('nodes数组:', nodes.value)
        }
      } else {
        // 子女节点，调用新增/编辑子女接口
        // 🔴 核心修改：兼容fatherId和parentId两种情况
        const parentId = selectedNode.value.parentId || selectedNode.value.fatherId
        const parentNode = getNodeById(parentId)
        if (parentNode) {
          requestData.parentNodeId = parentNode.id
          requestData.parentType = parentNode.gender === '男' ? 1 : 2 // 1=父亲/2=母亲
          console.log('调用子女节点接口，请求数据:', requestData)
          response = await genealogyAPI.addOrUpdateChild(familyId.value, requestData)
          apiCallMade = true
          console.log('子女节点接口响应:', response)
        } else {
          console.error('无法找到父节点，parentId:', parentId)
          console.error('getNodeById返回:', getNodeById(parentId))
        }
      }
    }
    
    // 检查是否成功调用了API
    if (!apiCallMade) {
      console.error('API调用失败：未找到对应的节点类型或关联节点')
      console.error('当前节点信息:', selectedNode.value)
      console.error('nodes数组:', nodes.value)
    } else {
      // 处理响应
        console.log('API响应处理，response:', response)
        if (response && response.code === 200) {
          // 🔴 核心修改：移除alert弹窗，直接重新加载数据
          // 重新加载家族树数据
          await loadFamilyTreeData()
          
          // 触发成员更新事件，通知父组件更新地图数据
          emit('member-updated')
          
          // 清空表单
          Object.keys(currentMember).forEach(key => {
            currentMember[key] = ''
          })
          currentMember.gender = '男'
        }
    }
  } catch (error) {
    console.error('保存节点信息错误:', error)
  }
}

// 获取节点的所有子孙后代（递归）
const getAllDescendants = (nodeId) => {
  let descendants = [];
  const getChildren = (id) => {
    const children = getChildrenNodes({ id });
    if (children.length > 0) {
      descendants = [...descendants, ...children];
      children.forEach(child => {
        getChildren(child.id);
      });
    }
  };
  getChildren(nodeId);
  return descendants;
};

// 删除节点
const deleteNode = async () => {
  console.log('🔄 开始执行删除节点函数');
  
  // 检查是否是管理员
  if (!props.isAdmin) {
    console.log('❌ 非管理员用户，禁止删除操作');
    return;
  }
  
  // 检查是否选中了节点
  if (!selectedNode.value) {
    console.log('❌ 没有选中节点，无法执行删除操作');
    // 可以添加一个提示给用户
    errorMessage.value = '请先选择要删除的节点';
    return;
  }
  
  // 获取选中节点的数据
  const nodeData = selectedNode.value;
  console.log('📌 选中的节点:', nodeData);
  
  // 🔴 根据用户要求：移除根节点删除限制，允许删除所有节点
  if (nodeData.isRoot) {
    console.log('⚠️  根节点将被删除，请注意：这将删除整个家族树');
    // 更新确认消息，明确告知用户删除根节点的后果
    confirmMessage = `确定要删除根节点"${nodeData.name}"吗？\n\n⚠️  警告：删除根节点将删除整个家族树，包括所有子孙后代！\n\n此操作不可恢复，请谨慎执行。`;
    // 重新显示确认对话框
    console.log('💬 显示根节点删除确认对话框');
    const confirmed = confirm(confirmMessage);
    console.log('✅ 用户确认结果:', confirmed);
    if (!confirmed) {
      console.log('❌ 用户取消了删除操作');
      return;
    }
  }
  
  // 获取节点的直接子女
  const children = getChildrenNodes(nodeData);
  console.log('👶 直接子女:', children);
  
  // 获取节点的所有子孙后代
  const allDescendants = getAllDescendants(nodeData.id);
  console.log('👪 所有子孙后代:', allDescendants);
  
  // 检查节点是否有配偶
  const hasSpouse = !!nodeData.spouseId;
  console.log('💑 是否有配偶:', hasSpouse);
  
  // 根据不同场景生成确认消息
  let confirmMessage;
  if (children.length > 0) {
    // 🔴 场景2：有子女的节点
    confirmMessage = `确定要删除该节点及其所有子孙后代吗？\n\n当前节点：${nodeData.name}\n直接子女数：${children.length}\n所有子孙后代数：${allDescendants.length}`;
  } else if (hasSpouse) {
    // 🔴 场景3：无子女、有配偶的节点
    confirmMessage = `确定要删除该节点吗？\n\n当前节点：${nodeData.name}\n该节点有配偶，配偶将被保留`;
  } else {
    // 🔴 场景4：无子女、无配偶的节点
    confirmMessage = `确定要删除该节点吗？\n\n当前节点：${nodeData.name}`;
  }
  
  // 显示确认对话框
  console.log('💬 显示确认对话框');
  const confirmed = confirm(confirmMessage);
  console.log('✅ 用户确认结果:', confirmed);
  
  if (!confirmed) {
    console.log('❌ 用户取消了删除操作');
    return;
  }
  
  errorMessage.value = '';
  
  try {
    // 🔴 核心：根据不同场景执行不同的删除逻辑
    // 注意：这里假设后端API已经实现了相应的删除逻辑
    // 如果后端API不支持级联删除，需要前端自己处理
    
    console.log('📞 调用后端删除节点API，节点ID:', nodeData.id, '家族ID:', familyId.value);
    const response = await genealogyAPI.deleteNode(familyId.value, nodeData.id);
    
    console.log('📥 后端删除节点响应:', response);
    
    // 处理响应
    if (response && response.code === 200) {
      console.log('✅ 删除节点成功');
      // 重新加载家族树数据
      console.log('🔄 重新加载家族树数据');
      await loadFamilyTreeData();
      
      // 触发成员更新事件，通知父组件更新地图数据
      emit('member-updated');
      
      // 清空表单数据
      console.log('📝 清空表单数据');
      Object.keys(currentMember).forEach(key => {
        currentMember[key] = '';
      });
      currentMember.gender = '男';
      
      console.log('✅ 删除节点操作完成');
    } else {
      console.error('❌ 删除节点失败，响应码:', response?.code, '响应消息:', response?.msg);
      errorMessage.value = `删除失败: ${response?.msg || '未知错误'}`;
    }
  } catch (error) {
    console.error('❌ 删除节点错误:', error);
    console.error('❌ 错误详情:', error.message);
    errorMessage.value = `删除失败: ${error.message}`;
  }
}

// 查看详情
const viewDetail = () => {
  if (!selectedMember.name) {
    return
  }
  
  // 这里实现查看详情的逻辑
  console.log('查看详情:', selectedMember)
}

// 初始化数据加载
const loadFamilyTreeData = async () => {
  errorMessage.value = ''

  try {
    console.log('当前家族ID:', familyId.value)
    // 🔴 调试日志：显示调用queryTree函数的参数
    console.log('调用queryTree函数，参数:', { familyId: familyId.value, showDelete: 0 })
    const response = await genealogyAPI.queryTree(familyId.value, 0)
    // 🔴 调试日志：显示完整的响应数据
    console.log('后端返回的完整响应:', response)
    console.log('响应状态码:', response.code)
    console.log('响应数据:', response.data)
    console.log('响应数据类型:', Array.isArray(response.data) ? '数组' : typeof response.data)
    console.log('响应数据长度:', Array.isArray(response.data) ? response.data.length : 0)
    
    if (response.code === 200) {
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // 🔴 调试日志：显示原始数据详情
                console.log('原始数据详情:', response.data)
                console.log('第一个节点数据:', response.data[0])
                
                // 🔴 核心修复：通过id去重，避免重复节点
                const uniqueOriginalNodes = Array.from(
                    new Map(response.data.map(node => [node.id, node])).values()
                );
                console.log('去重后的原始节点:', uniqueOriginalNodes)
                
                // 有数据时，处理并更新
                let processedNodes = uniqueOriginalNodes.map(node => {
                    // 🔴 调试日志：显示每个节点的处理前数据
                    console.log('处理前节点数据:', node)
                    const processedNode = {
                        ...node,
                        gender: node.gender === 1 ? '男' : '女',
                        // 🔴 核心修改：添加完整字段映射，确保所有信息正确同步
                        birthDate: node.birthDate || '',
                        deathDate: node.deathDate || '',
                        residence: node.residence || '',
                        occupation: node.career || '', // 后端字段是career，前端字段是occupation
                        biography: node.intro || '', // 后端字段是intro，前端字段是biography
                        // 🔴 核心修复：改进根节点判断逻辑，与后端保持一致
                        // 根据后端API返回的信息判断是否为根节点
                        // 检查节点的fatherId和motherId是否都为null，且generation为1
                        isRoot: node.generation === 1 && node.fatherId === null && node.motherId === null && node.parentId === null
                    }
                    // 🔴 调试日志：显示每个节点的处理后数据
                    console.log('处理后节点数据:', processedNode)
                    return processedNode
                })
        
        // 🔴 核心修改：根节点去重，只保留id最小的那条
        const rootNodes = processedNodes.filter(node => node.isRoot)
        if (rootNodes.length > 1) {
          // 找到id最小的根节点
          const minRootNode = rootNodes.reduce((min, node) => 
            node.id < min.id ? node : min, rootNodes[0]
          )
          // 移除其他根节点
          processedNodes = processedNodes.filter(node => !node.isRoot || node.id === minRootNode.id)
        }
        
        // 🔴 核心修改：修复主节点和配偶节点的spouseId一致性问题
        console.log('📌 修复前的节点列表:', processedNodes)
        
        // 🔴 重新编写的修复逻辑，使用全新对象数组，确保响应式系统能检测到变化
        // 1. 创建新的节点数组，确保所有对象都是新的引用
        const fixedNodes = processedNodes.map(node => ({ ...node }))
        
        // 2. 遍历所有节点，找到所有配偶关系，包括单向的
        const spouseSet = new Set() // 用于避免重复处理同一对配偶
        fixedNodes.forEach(node => {
          // 检查是否有节点的spouseId指向当前节点
          const spousePointingToThisNode = fixedNodes.find(n => n.spouseId === node.id)
          if (spousePointingToThisNode) {
            const key = [Math.min(node.id, spousePointingToThisNode.id), Math.max(node.id, spousePointingToThisNode.id)].join('-')
            if (!spouseSet.has(key)) {
              spouseSet.add(key)
              console.log('🔗 发现配偶关系：', spousePointingToThisNode.name, '(id:', spousePointingToThisNode.id, ')的spouseId指向', node.name, '(id:', node.id, ')')
              // 修复双方的spouseId
              spousePointingToThisNode.spouseId = node.id
              node.spouseId = spousePointingToThisNode.id
              console.log('✅ 修复后：', spousePointingToThisNode.name, '的spouseId为', node.id, node.name, '的spouseId为', spousePointingToThisNode.id)
            }
          }
        })
        
        // 3. 额外检查：直接遍历所有节点，修复任何不一致的配偶关系
        const nodesToAdd = [] // 用于存储需要添加的配偶节点
        fixedNodes.forEach(node => {
          if (node.spouseId) {
            const spouseNode = fixedNodes.find(n => n.id === node.spouseId)
            if (spouseNode) {
              if (spouseNode.spouseId !== node.id) {
                console.log('⚠️  额外修复：', node.name, '(id:', node.id, ')的配偶是', spouseNode.name, '(id:', spouseNode.id, ')，但配偶的spouseId不是当前节点id，已修复')
                spouseNode.spouseId = node.id
              } else {
                console.log('✅ 配偶关系正常：', node.name, '(id:', node.id, ')的配偶是', spouseNode.name, '(id:', spouseNode.id, ')')
              }
            } else {
              console.log('❌ 找不到配偶节点：', node.name, '(id:', node.id, ')的spouseId为', node.spouseId, '但找不到对应的节点')
              // 🔴 核心修改：记录需要添加的配偶节点ID
              nodesToAdd.push(node.spouseId)
            }
          }
        })
        
        // 4. 如果有需要添加的配偶节点，从后端查询并添加到节点列表中
        if (nodesToAdd.length > 0) {
          console.log('🔄 需要添加的配偶节点ID列表：', nodesToAdd)
          for (const nodeId of nodesToAdd) {
            try {
              console.log('🔄 从后端查询节点详情，nodeId:', nodeId)
              console.log('🔄 查询参数：familyId:', familyId.value, 'nodeId:', nodeId)
              const response = await genealogyAPI.queryNodeById(familyId.value, nodeId)
              console.log('🔄 查询结果：', response)
              console.log('🔄 查询结果code：', response.code)
              console.log('🔄 查询结果data：', response.data)
              if (response.code === 200 && response.data) {
                // 将查询到的节点转换为前端格式
                const spouseNode = {
                  ...response.data,
                  gender: response.data.gender === 1 ? '男' : '女',
                  birthDate: response.data.birthDate || '',
                  deathDate: response.data.deathDate || '',
                  residence: response.data.residence || '',
                  occupation: response.data.career || '',
                  biography: response.data.intro || '',
                  // 确保配偶节点也使用数据库返回的generation值
                  generation: response.data.generation
                }
                console.log('✅ 查询到配偶节点：', spouseNode)
                
                // 添加到fixedNodes数组中
                fixedNodes.push(spouseNode)
                console.log('✅ 配偶节点已添加到fixedNodes数组中')
                console.log('✅ fixedNodes数组长度：', fixedNodes.length)
                
                // 修复配偶关系
                const mainNode = fixedNodes.find(n => n.spouseId === nodeId)
                if (mainNode) {
                  spouseNode.spouseId = mainNode.id
                  console.log('✅ 修复了配偶关系：', mainNode.name, '(id:', mainNode.id, ')的配偶是', spouseNode.name, '(id:', spouseNode.id, ')')
                } else {
                  console.error('❌ 找不到主节点，nodeId:', nodeId)
                }
              } else {
                console.error('❌ 查询节点详情失败，响应code:', response.code, '响应data:', response.data)
              }
            } catch (error) {
              console.error('❌ 查询节点详情失败，nodeId:', nodeId, '错误：', error)
              console.error('❌ 错误详情：', error.message)
              console.error('❌ 错误栈：', error.stack)
            }
          }
        }
        
        // 🔴 确保所有节点都有唯一ID
        fixedNodes.forEach(node => {
          // 如果节点没有ID，生成一个唯一ID
          if (!node.id) {
            node.id = ++nodeIdCounter;
            console.log('✅ 为节点', node.name, '生成唯一ID:', node.id)
          }
        })
        
        // 🔴 核心修改：检查并修复父子关系，确保子节点能被正确识别和显示
        console.log('🔍 检查并修复父子关系')
        
        // 1. 首先处理所有节点的父ID引用，兼容fatherId和parentId
        fixedNodes.forEach(node => {
          // 🔴 兼容fatherId和parentId两种情况
          if (node.fatherId && !node.parentId) {
            node.parentId = node.fatherId;
            console.log('✅ 为节点', node.name, '设置parentId为fatherId:', node.parentId)
          }
        })
        
        // 🔴 核心修复：确保所有节点直接使用数据库返回的generation值，不进行任何修改
        console.log('🔍 确保所有节点使用数据库返回的generation值')
        fixedNodes.forEach(node => {
          console.log('✅ 节点', node.name, 'ID:', node.id, '使用数据库返回的generation:', node.generation)
        })
        
        // 🔴 核心修复：配偶节点的generation处理
        // 确保配偶节点与主节点的generation相同
        fixedNodes.forEach(node => {
          if (node.spouseId) {
            const spouseNode = fixedNodes.find(n => n.id === node.spouseId);
            if (spouseNode) {
              // 确保双方generation一致，使用主节点的generation
              const mainNode = node.id < spouseNode.id ? node : spouseNode;
              node.generation = mainNode.generation;
              spouseNode.generation = mainNode.generation;
              console.log('✅ 配偶关系修复：节点', node.name, '和配偶', spouseNode.name, '的generation统一为:', mainNode.generation)
            }
          }
        })
        
        // 🔴 核心优化：确保获取完整的节点列表
        console.log('🔍 确保获取完整的节点列表')
        
        // 1. 检查当前节点列表中的每个节点，确保它们的配偶和子节点都被正确加载
        const nodesToCheck = [...fixedNodes]; // 创建副本，避免在遍历过程中修改原数组
        
        for (const node of nodesToCheck) {
          console.log('🔄 检查节点', node.name, '的关联节点')
          
          // 检查配偶节点
          if (node.spouseId) {
            const spouseNode = fixedNodes.find(n => n.id === node.spouseId)
            if (!spouseNode) {
              console.log('⚠️  缺少配偶节点，尝试获取', node.spouseId)
              try {
                const spouseResponse = await genealogyAPI.queryNodeById(familyId.value, node.spouseId)
                if (spouseResponse.code === 200 && spouseResponse.data) {
                  const spouse = {
                    ...spouseResponse.data,
                    gender: spouseResponse.data.gender === 1 ? '男' : '女',
                    occupation: spouseResponse.data.career || '',
                    biography: spouseResponse.data.intro || '',
                    parentId: spouseResponse.data.parentId || spouseResponse.data.fatherId,
                    // 确保配偶节点也使用数据库返回的generation值
                    generation: spouseResponse.data.generation
                  }
                  console.log('✅ 添加配偶节点：', spouse)
                  fixedNodes.push(spouse)
                }
              } catch (error) {
                console.error('❌ 获取配偶节点失败：', error)
              }
            }
          }
        }
        
        // 2. 🔴 直接获取所有节点 - 通过查询所有可能的节点ID范围
        // 这是一个简单的解决方案，因为我们不知道确切的API来获取所有节点
        console.log('🔄 尝试获取所有可能的节点')
        
        // 从当前节点中获取最大ID
        const maxId = Math.max(...fixedNodes.map(node => node.id), 0)
        console.log('✅ 当前最大节点ID：', maxId)
        
        // 尝试查询ID范围在1到maxId+10之间的所有节点
        // 这是一个启发式方法，假设节点ID是连续的
        for (let i = 1; i <= maxId + 10; i++) {
          // 检查节点是否已经存在
          if (!fixedNodes.find(node => node.id === i)) {
            try {
              const nodeResponse = await genealogyAPI.queryNodeById(familyId.value, i)
              if (nodeResponse.code === 200 && nodeResponse.data) {
                const newNode = {
                  ...nodeResponse.data,
                  gender: nodeResponse.data.gender === 1 ? '男' : '女',
                  occupation: nodeResponse.data.career || '',
                  biography: nodeResponse.data.intro || '',
                  parentId: nodeResponse.data.parentId || nodeResponse.data.fatherId,
                  // 确保新添加的节点也使用数据库返回的generation值
                  generation: nodeResponse.data.generation
                }
                console.log('✅ 添加节点：', newNode)
                fixedNodes.push(newNode)
              }
            } catch (error) {
              // 忽略不存在的节点
              continue
            }
          }
        }
        
        // 3. 确保所有节点都保留数据库返回的generation值
        console.log('  确保所有节点使用数据库返回的generation值')
        
        // 只需要确保配偶节点的generation与配偶相同
        fixedNodes.forEach(node => {
          if (node.spouseId) {
            const spouseNode = fixedNodes.find(n => n.id === node.spouseId);
            if (spouseNode) {
              // 配偶节点的generation与配偶相同
              node.generation = spouseNode.generation;
              console.log('✅ 配偶节点', node.name, '继承配偶', spouseNode.name, '的generation:', node.generation)
            }
          }
        })
        
        // 最后检查所有节点，确保都有generation值
        fixedNodes.forEach(node => {
          if (typeof node.generation === 'undefined' || node.generation === null) {
            console.error('❌ 节点', node.name, '缺少generation值，使用默认值1')
            node.generation = 1;
          }
        })
        
        console.log('📌 修复后的节点列表:', fixedNodes)
        
        // 🔴 核心修改：使用全新的fixedNodes数组更新nodes.value，确保Vue响应式系统能检测到所有变化
        console.log('🔄 更新nodes.value，之前的nodes.value:', nodes.value)
        nodes.value = fixedNodes
        console.log('🔄 更新nodes.value，之后的nodes.value:', nodes.value)
        
        // 🔴 调试日志：显示所有节点的最终状态
        console.log('📊 所有节点最终状态：')
        nodes.value.forEach(node => {
          console.log('📌 节点ID:', node.id, '名称:', node.name, '世代:', node.generation, '父ID:', node.parentId || node.fatherId, '配偶ID:', node.spouseId)
        })
        
        // 🔴 调试日志：显示按世代分组的节点
        const generationGroups = {};
        nodes.value.forEach(node => {
          if (!generationGroups[node.generation]) {
            generationGroups[node.generation] = [];
          }
          generationGroups[node.generation].push(node.name);
        });
        console.log('📊 按世代分组的节点：', generationGroups)
        
        // 🔴 手动触发Vue的响应式更新，确保模板重新渲染
        console.log('🔄 手动触发响应式更新')
        nodes.value = [...nodes.value]
        
        const rootNode = nodes.value.find(node => node.isRoot)
        if (rootNode) {
          console.log('选中的根节点:', rootNode)
          selectNode(rootNode)
        }
        
        // 确保DOM更新后再计算连接线
        nextTick(() => {
          calculateFamilyLines();
        });
      } else {
        // 空数据时，创建默认根节点
        console.log('家族为空，创建默认根节点')
        createDefaultRootNode()
      }
    } else {
      // 加载失败，创建默认根节点
      console.error('加载失败，响应码:', response.code, '响应消息:', response.msg)
      createDefaultRootNode()
    }
  } catch (error) {
    console.error('加载失败:', error)
    console.error('错误详情:', error.message)
    console.error('错误栈:', error.stack)
    // 网络错误，创建默认根节点
    createDefaultRootNode()
  }
}

// 创建默认根节点
const createDefaultRootNode = () => {
  const defaultRoot = {
    name: "始祖",
    gender: "男",
    generation: 1,
    isRoot: true,
    familyId: familyId.value, // 关键：绑定当前家族ID
    parentId: null,
    fatherId: null, // 🔴 核心修改：添加fatherId属性，兼容后端返回数据格式
    spouseId: null,
    // 🔴 核心修改：添加职业和简介字段默认值，确保字段完整
    occupation: '',
    career: '',
    biography: '',
    intro: ''
  }
  
  // 清空后再添加，确保唯一
  nodes.value = [defaultRoot]
  selectNode(defaultRoot)
  
  console.log('创建了默认根节点:', defaultRoot)
  console.log('nodes数组内容:', nodes.value)
  console.log('generations计算属性:', generations.value)
  console.log('getNodesByGeneration(1)返回:', getNodesByGeneration(1))
  
  // 可选：自动保存默认根节点到后端
  if (props.isAdmin) {
    saveDefaultRootNode(defaultRoot)
  }
  
  // 确保DOM更新后再计算连接线
  nextTick(() => {
    calculateFamilyLines();
  });
}

// 保存默认根节点到后端
const saveDefaultRootNode = async (rootNode) => {
  try {
    console.log('开始保存默认根节点:', rootNode)
    console.log('当前家族ID:', familyId.value)
    
    const requestData = {
      name: rootNode.name,
      gender: rootNode.gender === '男' ? 1 : 2, // 转换为数字类型：男=1，女=2
      birthDate: '',
      deathDate: '',
      residence: '',
      career: '',
      intro: ''
      // 新增时不传递id，让后端生成
    }
    
    console.log('保存默认根节点的请求参数:', requestData)
    const response = await genealogyAPI.addOrUpdateRoot(familyId.value, requestData)
    console.log('保存默认根节点的响应:', response)
  } catch (error) {
    console.error('保存默认根节点失败:', error)
    console.error('错误详情:', error.message)
    // 保存失败不影响前端显示
  }
}

onMounted(() => {
  // 加载家族树数据
  loadFamilyTreeData()
})

// 监听familyId变化，强制刷新数据
watch(familyId, () => {
  // 切换家族时，清空旧数据并重新加载
  nodes.value = []
  loadFamilyTreeData()
})
</script>

<style scoped>
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

/* 加载状态和错误提示样式 */
.loading-container,
.error-container,
.no-data-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #8B4513;
}

.loading-container {
  color: #8B4513;
}

.error-container {
  color: #dc3545;
}

.no-data-container {
  color: #6c757d;
}

.right-column {
  width: 33.33%;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fixed-sidebar {
  position: relative;
  height: 100%;
  overflow-y: auto;
  border: 1px solid #1A365D;
  background-color: #F5F0E6;
}

/* 主容器样式 */
.main-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--background-color);
}

/* 家族树容器 */
.family-tree-container {
  width: 100%;
  min-height: 500px;
  height: 100%;
  overflow: auto;
  background-color: #f9f9f9;
  padding: 40px;
  border-radius: 8px;
  position: relative;
}

/* 缩放控制栏 */
.zoom-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 15px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 缩放按钮 */
.zoom-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: #436c85;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  background-color: #3a5d73;
  transform: scale(1.1);
}

.zoom-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 缩放级别显示 */
.zoom-level {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

/* 家族树内容 */
.family-tree-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  gap: 40px; /* 代际之间的间距 */
  position: relative;
  margin: 0 auto;
}

/* 代际分隔线 */
.generation-divider {
  width: 100%;
  height: 1px;
  background-color: #ddd;
  margin: 0;
  position: relative;
}

/* 行容器 - 每一代节点对应一个行容器 */
.generation-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  width: auto;
  position: relative;
  z-index: 2;
  gap: 30px; /* 节点间距 */
  margin: 0 auto;
  transform: translateX(0);
}



/* 父容器：包含家庭单元和子代区域 */
.parent-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: auto;
}

/* 家庭单元：核心节点+配偶节点，视为不可拆分的整体 */
.family-unit {
  display: flex;
  gap: 8px; /* 配偶节点间距 */
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 子区域：包含所有子代家庭单元 */
.child-area {
  display: flex;
  gap: 15px; /* 子代节点间距 */
  justify-content: center;
  margin-top: 15px; /* 代际间距 */
  width: 100%;
  flex-wrap: wrap;
}

/* 父代与子代之间的垂直连接线 */
.parent-container::after {
  content: '';
  position: absolute;
  top: 120px; /* 父代节点高度（与family-node高度匹配） */
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 15px;
  background-color: #999;
}

/* 没有子节点的父容器不显示连接线 */
.parent-container:has(.child-area:empty)::after {
  display: none;
}

/* 节点样式 - 竖长方形 */
.family-node {
  width: 100px; /* 节点宽度 */
  height: 120px; /* 节点高度 */
  border: 2px solid #3498db;
  border-radius: 4px;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin: 0 auto;
}

/* 男性节点背景色 */
.family-node.male .node-content {
  background-color: #D6E2F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 女性节点背景色 */
.family-node.female .node-content {
  background-color: #FCE1F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 节点高亮样式 - 增强视觉效果 */
.family-node.selected {
  border: 3px solid #fffe70;
  box-shadow: 0 0 15px rgba(255, 254, 112, 0.8);
  transform: scale(1.1);
  z-index: 100;
  transition: all 0.3s ease;
}

/* 选中状态下的节点内容样式 */
.family-node.selected .node-content {
  background-color: rgba(255, 254, 112, 0.2);
  border-radius: 4px;
}

/* 选中状态下的节点名称样式 */
.family-node.selected .node-name {
  color: #333;
  font-weight: bold;
  font-size: 1.1em;
}

/* 选中状态下的节点详情样式 */
.family-node.selected .node-details {
  color: #333;
  font-weight: bold;
}

/* 节点内容 */
.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 2px;
  text-align: center;
}

/* 节点名称 */
.node-name {
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  padding: 5px;
  width: 100%;
}

/* 节点详情 */
.node-details {
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 5px;
  width: 100%;
}

/* 管理员功能栏内部间距控制 */
#admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.current-node {
  font-size: 16px;
  color: #1A365D;
  text-align: left;
  margin-bottom: 10px;
  font-weight: bold;
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

.relationship-management {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.relationship-management .btn-secondary {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  background-color: #deb4b2;
  color: black;
  cursor: pointer;
}

.relationship-management .btn-secondary:hover {
  background-color: #d1a19f;
  color: black;
}

.operation-area {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
  align-items: center;
}

.form-actions .btn-primary, .operation-area .btn-primary {
  padding: 6px 16px;
  font-size: 14px;
  background-color: #436c85;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.operation-area .btn-danger {
  padding: 6px 16px;
  font-size: 14px;
  background-color: #b01f24;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.operation-area .btn-danger:hover {
  background-color: #a81e22;
  color: white;
}

/* 普通用户查看详情按钮样式 */
.detail-button .btn-secondary {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  background-color: #436c85;
  color: white;
  cursor: pointer;
}

.detail-button .btn-secondary:hover {
  background-color: #3a5d73;
  color: white;
}

/* 表单样式 */
.basic-info-card {
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid #ddd;
}

.form-group {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.traditional-label {
  display: inline-block;
  width: 90px;
  font-weight: 500;
  margin-right: 15px;
  text-align: right;
  flex-shrink: 0;
  color: #333;
}

.traditional-input {
  width: 200px;
  padding: 8px 12px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

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

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
  margin-left: 105px;
  display: block;
  width: calc(100% - 105px);
}


</style>