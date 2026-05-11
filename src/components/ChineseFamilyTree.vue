<template>
  <div class="chinese-family-tree" ref="treeContainerRef">
    <!-- 容器装饰：四角回纹 -->
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>
    
    <!-- 连线层 -->
    <div class="tree-connections-layer">
      <!-- 父子连线 -->
      <div 
        v-for="connection in parentChildConnections" 
        :key="connection.id"
        class="connection-line"
        :class="connection.type"
        :style="connection.style"
      ></div>
      
      <!-- 水平连接线 -->
      <div 
        v-for="horizontalLine in horizontalLines" 
        :key="horizontalLine.id"
        class="connection-line horizontal"
        :style="horizontalLine.style"
      ></div>
    </div>
    
    <!-- 节点层 -->
    <div class="tree-nodes-layer">
      <!-- 动态渲染节点 -->
      <div 
        v-for="node in flattenedNodes" 
        :key="node.id"
        class="node-container"
        :class="`level-${node.level}`"
        :style="{ ...node.positionStyle, zIndex: isDragging.value && dragNodeId.value === node.id ? 1000 : 2 }"
        @click="selectNode(node)"
        @mousedown.stop="handleMouseDown($event, node)"
      >
        <div class="couple-group">
          <div 
            v-if="node.husband" 
            class="person-node husband"
            :class="{ selected: node.id === selectedNodeId }"
          >
            {{ node.husband.name }}
          </div>
          
          <div v-if="node.husband && node.wife" class="couple-connector"></div>
          
          <div 
            v-if="node.wife" 
            class="person-node wife"
            :class="{ selected: node.id === selectedNodeId }"
          >
            {{ node.wife.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { debounce } from 'lodash'

// 定义props
const props = defineProps({
  familyTreeData: {
    type: Object,
    required: true
  }
})

// 定义emit
const emit = defineEmits(['node-selected'])

// 当前选中节点ID
const selectedNodeId = ref(null)

// 拖拽状态管理
const isDragging = ref(false)
const dragNodeId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const treeContainerRef = ref(null)

// 计算属性：扁平化节点列表
const flattenedNodes = computed(() => {
  const nodes = []
  const levels = new Map()
  
  // 递归遍历树，收集节点并计算层级
  const traverse = (node, level = 1, parent = null) => {
    // 添加当前节点
    nodes.push({
      ...node,
      level,
      parentId: parent ? parent.id : null
    })
    
    // 更新层级计数
    if (!levels.has(level)) {
      levels.set(level, 0)
    }
    levels.set(level, levels.get(level) + 1)
    
    // 递归遍历子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverse(child, level + 1, node)
      })
    }
  }
  
  traverse(props.familyTreeData)
  
  // 为每个节点计算索引和位置
  const levelCounts = Array.from(levels.entries()).sort((a, b) => a[0] - b[0])
  const levelNodes = new Map()
  
  // 按层级分组
  nodes.forEach(node => {
    if (!levelNodes.has(node.level)) {
      levelNodes.set(node.level, [])
    }
    levelNodes.get(node.level).push(node)
  })
  
  // 计算每个节点的位置
  return nodes.map(node => {
    const level = node.level
    const levelNodeList = levelNodes.get(level)
    const index = levelNodeList.findIndex(n => n.id === node.id)
    const totalInLevel = levelNodeList.length
    
    // 如果节点有自定义坐标，使用自定义坐标；否则使用默认计算位置
    let left, top
    if (node.x !== undefined && node.y !== undefined) {
      left = `${node.x}px`
      top = `${node.y}px`
    } else {
      // 计算水平位置：根据同层级节点数量均分
      const leftPercentage = (index + 0.5) / totalInLevel * 100
      
      // 计算垂直位置：层级 * 垂直间距
      const verticalSpacing = 120
      left = `${leftPercentage}%`
      top = `${40 + (level - 1) * verticalSpacing}px`
    }
    
    return {
      ...node,
      index,
      positionStyle: {
        left,
        top,
        position: 'absolute',
        transform: 'translateX(-50%)'
      }
    }
  })
})

// 计算属性：父子节点连线
const parentChildConnections = computed(() => {
  const connections = []
  
  // 为每个有父节点的节点创建连线
  flattenedNodes.value.forEach(node => {
    if (!node.parentId) return
    
    const parent = flattenedNodes.value.find(n => n.id === node.parentId)
    if (!parent) return
    
    // 获取父节点位置
    let parentLeft, parentTop
    if (parent.x !== undefined && parent.y !== undefined) {
      // 父节点有自定义坐标（像素）
      parentLeft = parent.x
      parentTop = parent.y + 40 // 40是节点高度
    } else {
      // 父节点使用默认计算位置
      const leftValue = parent.positionStyle.left
      parentLeft = leftValue.includes('%') ? 
        parseFloat(leftValue) / 100 * treeContainerRef.value?.offsetWidth || 0 : 
        parseFloat(leftValue)
      parentTop = parseFloat(parent.positionStyle.top) + 40 // 40是节点高度
    }
    
    // 获取当前节点位置
    let childLeft, childTop
    if (node.x !== undefined && node.y !== undefined) {
      // 当前节点有自定义坐标（像素）
      childLeft = node.x
      childTop = node.y
    } else {
      // 当前节点使用默认计算位置
      const leftValue = node.positionStyle.left
      childLeft = leftValue.includes('%') ? 
        parseFloat(leftValue) / 100 * treeContainerRef.value?.offsetWidth || 0 : 
        parseFloat(leftValue)
      childTop = parseFloat(node.positionStyle.top)
    }
    
    // 垂直连接线
    connections.push({
      id: `vertical-${parent.id}-${node.id}`,
      type: 'vertical',
      style: {
        left: `${parentLeft + 82.5}px`, // 82.5是节点宽度的一半
        top: `${parentTop}px`,
        width: '1px',
        height: `${childTop - parentTop - 40}px` // 40是节点高度
      }
    })
    
    // 水平连接线
    if (Math.abs(parentLeft - childLeft) > 0.1) {
      connections.push({
        id: `horizontal-${parent.id}-${node.id}`,
        type: 'horizontal',
        style: {
          left: `${Math.min(parentLeft, childLeft) + 82.5}px`,
          top: `${childTop - 40}px`, // 40是节点高度
          width: `${Math.abs(parentLeft - childLeft)}px`,
          height: '1px'
        }
      })
    }
  })
  
  return connections
})

// 计算属性：水平连接线（同层级节点之间的连线）
const horizontalLines = computed(() => {
  const lines = []
  const levelNodes = new Map()
  
  // 按层级分组
  flattenedNodes.value.forEach(node => {
    if (!levelNodes.has(node.level)) {
      levelNodes.set(node.level, [])
    }
    levelNodes.get(node.level).push(node)
  })
  
  // 为每个层级创建水平连线
  levelNodes.forEach((nodes, level) => {
    if (nodes.length <= 1) return
    
    // 获取第一个和最后一个节点
    const firstNode = nodes[0]
    const lastNode = nodes[nodes.length - 1]
    
    // 计算第一个节点的位置（像素）
    let firstLeft, top
    if (firstNode.x !== undefined && firstNode.y !== undefined) {
      firstLeft = firstNode.x
      top = firstNode.y + 20 // 20是节点高度的一半
    } else {
      const leftValue = firstNode.positionStyle.left
      firstLeft = leftValue.includes('%') ? 
        parseFloat(leftValue) / 100 * treeContainerRef.value?.offsetWidth || 0 : 
        parseFloat(leftValue)
      top = parseFloat(firstNode.positionStyle.top) + 20 // 20是节点高度的一半
    }
    
    // 计算最后一个节点的位置（像素）
    let lastLeft
    if (lastNode.x !== undefined && lastNode.y !== undefined) {
      lastLeft = lastNode.x
    } else {
      const leftValue = lastNode.positionStyle.left
      lastLeft = leftValue.includes('%') ? 
        parseFloat(leftValue) / 100 * treeContainerRef.value?.offsetWidth || 0 : 
        parseFloat(leftValue)
    }
    
    // 添加水平连线
    lines.push({
      id: `level-line-${level}`,
      style: {
        left: `${firstLeft + 82.5}px`, // 82.5是节点宽度的一半
        top: `${top}px`,
        width: `${lastLeft - firstLeft}px`,
        height: '1px'
      }
    })
  })
  
  return lines
})

// 防抖处理的节点选择函数
const selectNode = debounce((node) => {
  if (!isDragging.value) {
    selectedNodeId.value = node.id
    emit('node-selected', node)
  }
}, 100)

// 监听数据变化 - 使用防抖处理
watch(() => props.familyTreeData, debounce(() => {
  console.log('Family tree data changed, recalculating layout...')
}, 100), { deep: true })

// 拖拽事件处理函数
const handleMouseDown = (event, node) => {
  event.preventDefault()
  
  isDragging.value = true
  dragNodeId.value = node.id
  
  // 获取节点当前位置
  const rect = event.currentTarget.getBoundingClientRect()
  
  // 计算鼠标与节点的相对偏移
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  // 添加全局鼠标事件监听器
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

// 拖拽过程处理函数
const handleMouseMove = debounce((event) => {
  if (!isDragging.value || !dragNodeId.value) return
  
  requestAnimationFrame(() => {
    // 获取容器的位置
    const containerRect = treeContainerRef.value.getBoundingClientRect()
    
    // 计算节点新位置（相对于容器）
    let newX = event.clientX - containerRect.left - dragOffset.value.x
    let newY = event.clientY - containerRect.top - dragOffset.value.y
    
    // 获取容器和节点尺寸
    const containerWidth = treeContainerRef.value.offsetWidth
    const containerHeight = treeContainerRef.value.offsetHeight
    const containerScrollWidth = treeContainerRef.value.scrollWidth
    const containerScrollHeight = treeContainerRef.value.scrollHeight
    const nodeWidth = 165 // 节点宽度
    const nodeHeight = 40 // 节点高度
    
    // 拖拽时自动触发容器滚动
    const scrollMargin = 50 // 滚动触发边距
    const scrollSpeed = 5 // 滚动速度
    
    // 水平滚动
    if (newX < scrollMargin && treeContainerRef.value.scrollLeft > 0) {
      treeContainerRef.value.scrollLeft -= scrollSpeed
    } else if (newX > containerWidth - scrollMargin - nodeWidth && 
               treeContainerRef.value.scrollLeft < containerScrollWidth - containerWidth) {
      treeContainerRef.value.scrollLeft += scrollSpeed
    }
    
    // 垂直滚动
    if (newY < scrollMargin && treeContainerRef.value.scrollTop > 0) {
      treeContainerRef.value.scrollTop -= scrollSpeed
    } else if (newY > containerHeight - scrollMargin - nodeHeight && 
               treeContainerRef.value.scrollTop < containerScrollHeight - containerHeight) {
      treeContainerRef.value.scrollTop += scrollSpeed
    }
    
    // 更新节点位置
    updateNodePosition(dragNodeId.value, newX, newY)
  })
}, 10)

// 拖拽结束处理函数
const handleMouseUp = () => {
  if (!isDragging.value || !dragNodeId.value) return
  
  // 保存拖拽后的位置到数据模型
  saveNodePosition(dragNodeId.value)
  
  // 清理拖拽状态
  isDragging.value = false
  dragNodeId.value = null
  dragOffset.value = { x: 0, y: 0 }
  
  // 移除全局鼠标事件监听器
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// 更新节点位置（仅用于拖拽过程）
const updateNodePosition = (nodeId, x, y) => {
  // 在实际应用中，这里可能需要使用临时状态来存储拖拽过程中的位置
  // 但由于我们直接修改props中的数据，这可能会导致性能问题
  // 这里简化处理，直接修改数据
  const updateNodeRecursive = (tree) => {
    if (tree.id === nodeId) {
      tree.x = x
      tree.y = y
      return true
    }
    
    if (tree.children && tree.children.length > 0) {
      for (let i = 0; i < tree.children.length; i++) {
        if (updateNodeRecursive(tree.children[i])) {
          return true
        }
      }
    }
    
    return false
  }
  
  updateNodeRecursive(props.familyTreeData)
}

// 保存节点位置到数据模型
const saveNodePosition = (nodeId) => {
  // 查找当前拖拽的节点
  const updateNodeRecursive = (tree) => {
    if (tree.id === nodeId) {
      // 获取节点当前的样式位置
      const nodeElement = document.querySelector(`.node-container:nth-child(${flattenedNodes.value.findIndex(n => n.id === nodeId) + 1})`)
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect()
        const containerRect = treeContainerRef.value.getBoundingClientRect()
        
        // 计算相对于容器的位置
        tree.x = rect.left - containerRect.left
        tree.y = rect.top - containerRect.top
        
        console.log('保存节点位置:', nodeId, { x: tree.x, y: tree.y })
      }
      return true
    }
    
    if (tree.children && tree.children.length > 0) {
      for (let i = 0; i < tree.children.length; i++) {
        if (updateNodeRecursive(tree.children[i])) {
          return true
        }
      }
    }
    
    return false
  }
  
  updateNodeRecursive(props.familyTreeData)
  
  // 这里可以添加额外的持久化逻辑，如保存到本地存储或发送到服务器
  // localStorage.setItem('familyTreePositions', JSON.stringify(props.familyTreeData))
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 容器样式 */
.chinese-family-tree {
  padding: 40px;
  min-width: 1200px;
  min-height: 600px;
  overflow: auto;
  position: relative;
  background-color: #F5F0E6;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="paper" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23E5D9C6" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23paper)"/></svg>');
  border: 15px solid #E8E1D4;
  box-shadow: inset 0 0 0 2px #9B8774;
}

/* 四角回纹装饰 */
.corner-decor {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #9B8774;
}

.corner-decor.top-left {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.corner-decor.top-right {
  top: 10px;
  right: 10px;
  border-left: none;
  border-bottom: none;
}

.corner-decor.bottom-left {
  bottom: 10px;
  left: 10px;
  border-right: none;
  border-top: none;
}

.corner-decor.bottom-right {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

/* 节点层 */
.tree-nodes-layer {
  position: relative;
  z-index: 2;
}

/* 节点容器 */
.node-container {
  width: 165px;
  height: 40px;
  position: absolute;
  transform: translateX(-50%);
}

/* 夫妻组 */
.couple-group {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 个人节点 */
.person-node {
  width: 80px;
  height: 40px;
  background: white;
  border: 1px solid #9B8774;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'KaiTi', '楷体', 'SimSun', '宋体', serif;
  font-size: 14px;
  color: #5A4B38;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
}

.person-node:hover {
  background-color: #f0e8d8;
  transform: scale(1.05);
}

.person-node.selected {
  background-color: rgba(255, 254, 112, 0.2);
  border: 3px solid #fffe70;
  box-shadow: 0 0 15px rgba(255, 254, 112, 0.8);
  transform: scale(1.1);
  color: #333;
  font-weight: bold;
  z-index: 100;
  transition: all 0.3s ease;
}

/* 夫妻节点间连线 */
.couple-connector {
  width: 1px;
  height: 10px;
  background-color: #8A7868;
  margin: 0 5px;
  position: relative;
}

.couple-connector::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #8A7868;
}

/* 连线层 */
.tree-connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* 连线样式 */
.connection-line {
  position: absolute;
  background-color: #8A7868;
}

.connection-line.horizontal {
  height: 1px;
}

.connection-line.vertical {
  width: 1px;
}
</style>