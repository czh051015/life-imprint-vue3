<template>
  <div class="couple-group" :style="{ '--level': level }">
    <div class="person-container">
      <div class="person-node">
        <span>{{ node.husband?.name || '无' }}</span>
      </div>
      <div class="couple-connector"></div>
      <div class="person-node">
        <span>{{ node.wife?.name || '无' }}</span>
      </div>
    </div>
    
    <!-- 仅当有子节点时显示亲子连线 -->
    <div class="parent-vertical-line" v-if="node.children && node.children.length > 0"></div>
    
    <div class="children-container" v-if="node.children && node.children.length > 0">
      <div class="children-horizonal-line"></div>
      <FamilyTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup>
import { defineComponent } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.couple-group {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: calc(var(--level, 0) * 100px);
  width: 100%;
}

.person-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.person-node {
  width: 90px;
  height: 35px;
  background: white;
  border: 1px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin: 0 8px;
  text-align: center;
  box-sizing: border-box;
}

.couple-connector {
  width: 20px;
  height: 1px;
  background: #000;
}

.parent-vertical-line {
  width: 1px;
  height: 20px;
  background: #000;
  margin-top: 5px;
  position: relative;
  z-index: 1;
}

.children-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  width: 100%;
  position: relative;
  margin-top: 0;
  gap: 10px;
}

/* 根据子节点数量动态设置网格列 */
.children-container:has(> .couple-group:nth-child(1)) {
  grid-template-columns: repeat(1, 1fr);
}

.children-container:has(> .couple-group:nth-child(2)) {
  grid-template-columns: repeat(2, 1fr);
}

.children-container:has(> .couple-group:nth-child(3)) {
  grid-template-columns: repeat(3, 1fr);
}

.children-container:has(> .couple-group:nth-child(4)) {
  grid-template-columns: repeat(4, 1fr);
}

.children-horizonal-line {
  width: calc(100% - 20px);
  height: 1px;
  background: #000;
  position: absolute;
  top: 0;
  left: 10px;
}

/* 子节点样式 */
.children-container .couple-group {
  margin-top: 100px;
  margin-left: 0;
  margin-right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* 确保子节点自身水平居中 */
.children-container .couple-group .person-container {
  display: flex;
  justify-content: center;
}
</style>