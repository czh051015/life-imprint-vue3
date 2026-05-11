// src/stores/familyStore.js
import { defineStore } from 'pinia'

export const useFamilyStore = defineStore('family', {
  state: () => ({
    currentFamily: null, // 存当前选择的家族：{ id: 1, name: "测试家族01" }
  }),
  actions: {
    // 选择家族：保存到全局状态和localStorage
    setCurrentFamily(family) {
      this.currentFamily = family
      // 保存到localStorage
      localStorage.setItem('currentFamily', JSON.stringify(family))
    },
    // 清空当前家族：返回首页时调用
    clearCurrentFamily() {
      this.currentFamily = null
      // 从localStorage中移除
      localStorage.removeItem('currentFamily')
    },
    // 从localStorage加载当前家族
    loadCurrentFamilyFromStorage() {
      const savedFamily = localStorage.getItem('currentFamily')
      if (savedFamily) {
        this.currentFamily = JSON.parse(savedFamily)
      }
    }
  }
})