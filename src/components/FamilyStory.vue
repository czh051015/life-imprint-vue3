<template>
  <div class="family-modules traditional-section stories-section family-story-container" 
       ref="storySectionRef" 
       :class="{ 'in-view': isInView }"
       style="
         background-image: url('/img/2.jpg') !important;
         background-size: cover !important;
         background-position: center !important;
         background-repeat: no-repeat !important;
         background-attachment: fixed !important;
         width: 100% !important;
         min-height: auto !important;
         position: relative !important;
         overflow: hidden !important;
       ">
    <div class="module-container traditional-module">
      <div class="module-header traditional-header">
        <h3 class="module-title">家族大事记</h3>
        <button id="add-family-story" class="btn-primary traditional-btn" v-if="isAdmin" @click="addFamilyStory">添加大事记</button>
      </div>
      <div class="module-content traditional-content">
        <div id="family-stories" class="stories-container traditional-stories horizontal-layout">
          <!-- 左侧：图片展示框 占50% -->
          <div id="story-image-display" class="story-image-display">
            <!-- 始终显示容器，不管是否有图片 -->
            <div class="image-container">
              <!-- 只有当鼠标悬停在标题上时，才显示图片 -->
              <img v-if="hoveredStoryIndex !== null" :src="stories[hoveredStoryIndex].image" :alt="stories[hoveredStoryIndex].title" class="story-image" @error="handleImageError">
              <!-- 当没有悬停或没有故事时，显示提示信息 -->
              <div v-else class="image-placeholder">
                <p v-if="stories.length === 0">暂无家族大事记图片</p>
                <p v-else>将鼠标悬停在右侧标题上查看图片</p>
              </div>
            </div>
          </div>
          <!-- 右侧：故事标题列表 占50% -->
          <div id="story-titles" class="story-titles vertical-titles">
            <!-- 竖排标题 -->
            <div v-if="stories.length === 0" class="default-story-title">
              <p>点击上方按钮添加家族大事记</p>
            </div>
            <div v-else v-for="(story, index) in stories" :key="index" 
                 class="story-title"
                 :class="{
                   'active': activeStoryIndex === index,
                   'odd-index': index % 2 === 0,
                   'even-index': index % 2 !== 0
                 }"
                 @click="selectStory(index)"
                 @mouseenter="hoverStory(index)"
                 @mouseleave="leaveStory">
              {{ story.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import API_CONFIG from '@/api/api-config.js'

// 接收props
const props = defineProps({
  isAdmin: {
    type: Boolean,
    required: true
  },
  // 接收当前故事图片，用于父组件的图片容器
  currentStoryImage: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['update:currentStoryImage'])

// 路由实例
const router = useRouter()

// 家族大事记相关
const stories = ref([])
const activeStoryIndex = ref(null)
const hoveredStoryIndex = ref(null)
const storySectionRef = ref(null)
const isInView = ref(false)

// 鼠标悬停在标题上时触发
const hoverStory = (index) => {
  // 先设置为null，强制移除当前图片
  hoveredStoryIndex.value = null
  // 然后在下一个渲染周期设置新的索引，触发新图片的动画
  nextTick(() => {
    hoveredStoryIndex.value = index
  })
}

// 鼠标离开标题时不隐藏图片，保持显示状态
const leaveStory = () => {
  // 移除了将hoveredStoryIndex设置为null的代码，保持当前图片显示
}

// 图片加载错误处理
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src)
  event.target.style.display = 'none'
}

// 预加载从API获取的大事记图片
const preloadImages = () => {
  // 只在有stories数据时预加载图片
  if (stories.value.length > 0) {
    stories.value.forEach(story => {
      if (story.image) {
        console.log('预加载图片:', story.image)
        const img = new Image();
        img.src = story.image; // 强制预加载
        
        img.onload = () => {
          console.log('✅ 图片预加载成功:', story.image)
        };
        
        img.onerror = (error) => {
          console.error('❌ 图片预加载失败:', story.image)
          console.error('错误信息:', error)
        };
      }
    });
  }
};

onMounted(() => {
  // 初始化家族大事记
  initFamilyStories()
  
  // 设置Intersection Observer来检测元素进入视口
  if (storySectionRef.value) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 元素进入视口，触发动画
            isInView.value = true;
            // 重新触发动画
            nextTick(() => {
              // 先移除动画类，再添加回来，触发重绘
              const titles = document.querySelectorAll('.story-title');
              titles.forEach((title) => {
                const classes = title.className;
                title.className = '';
                nextTick(() => {
                  title.className = classes;
                });
              });
            });
          } else {
            // 元素离开视口
            isInView.value = false;
          }
        });
      },
      {
        threshold: 0.1, // 当元素10%进入视口时触发
        rootMargin: '0px 0px -100px 0px' // 优化检测区域
      }
    );
    
    observer.observe(storySectionRef.value);
  }
})

// 监听stories变化，当数据加载完成后预加载图片
watch(stories, (newStories) => {
  if (newStories.length > 0) {
    preloadImages();
  }
}, { deep: true });

// 从API加载家族大事记
const loadStoriesFromAPI = async () => {
  try {
    // 获取当前选择的家族ID
    const currentFamilyId = localStorage.getItem('currentFamilyId')
    if (!currentFamilyId) {
      console.error('未选择家族')
      return
    }

    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('未登录')
      return
    }

    // 构造带分页参数的URL
    const url = new URL(API_CONFIG.baseURL + API_CONFIG.paths.event.list)
    url.searchParams.append('pageNum', '1')
    url.searchParams.append('pageSize', '10')

    // 调用API获取大事记列表
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'family-id': currentFamilyId
      }
    })

    const data = await response.json()
    
    if (data.code === 200 && data.data && data.data.list) {
      // 处理返回的数据，映射字段名并存储所有图片/视频URL
      stories.value = data.data.list.map(item => {
        const imageUrls = item.imageUrl ? item.imageUrl.split(',').map(url => fixImageUrl(url)) : []
        return {
          id: item.eventId,
          title: item.title,
          content: item.content,
          createdAt: item.eventTime,
          image: imageUrls.length > 0 ? imageUrls[0] : '/img/default-story.jpg',
          allImageUrls: imageUrls
        }
      })
      
      // 按时间排序（最新的在前）
      stories.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      console.log('从API加载的stories数据:', stories.value)
      
      // 设置默认图片并通知父组件
      if (stories.value.length > 0) {
        emit('update:currentStoryImage', stories.value[0].image)
        console.log('默认显示的图片路径:', stories.value[0].image)
      }
    } else {
      console.error('获取大事记失败:', data.msg || '未知错误')
      stories.value = []
    }
  } catch (error) {
    console.error('加载大事记错误:', error)
    stories.value = []
  }
}

// 初始化家族大事记
const initFamilyStories = () => {
  console.log('初始化家族大事记...')
  // 从API加载数据
  loadStoriesFromAPI()
}

// 检查并修复图片URL的完整性
const fixImageUrl = (url) => {
  if (!url) return null
  
  // 检查URL是否已经是完整的（以http://或https://开头）
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 提取相对路径，去掉域名部分，使用Vite代理
    const urlObj = new URL(url)
    return urlObj.pathname
  }
  
  // 如果是纯文件名，拼接相对路径
  let fixedUrl = url
  if (!fixedUrl.startsWith('/')) {
    fixedUrl = `/upload/${fixedUrl}`
  }
  
  return fixedUrl
}

// 测试stories目录下的图片
const testStoriesImage = () => {
  console.log('开始测试stories目录下的图片...')
  
  // 测试所有stories图片
  const titles = ['家族成立', '重要婚礼', '长子出生', '乔迁新居', '家族聚会', '事业成就', '学业有成', '重要纪念日', '家族旅行', '未来规划']
  
  titles.forEach((title, index) => {
    const imagePath = `/img/stories/${title}.jpg`
    const testImage = new Image()
    
    console.log(`测试图片 ${index + 1}: ${imagePath}`)
    
    testImage.onload = () => {
      console.log(`✅ 图片加载成功: ${imagePath}`)
    }
    
    testImage.onerror = (error) => {
      console.error(`❌ 图片加载失败: ${imagePath}`)
      console.error('错误信息:', error)
      
      // 尝试使用绝对URL测试
      const absoluteUrl = `http://localhost:5174${imagePath}`
      console.log(`尝试使用绝对URL测试: ${absoluteUrl}`)
      
      const absoluteTestImage = new Image()
      absoluteTestImage.onload = () => {
        console.log(`✅ 绝对URL图片加载成功: ${absoluteUrl}`)
      }
      absoluteTestImage.onerror = (absError) => {
        console.error(`❌ 绝对URL图片加载失败: ${absoluteUrl}`)
        console.error('绝对URL错误信息:', absError)
      }
      absoluteTestImage.src = absoluteUrl
    }
    
    testImage.src = imagePath
  })
}

// 更新所有stories的图片路径
const updateAllStoriesImages = () => {
  stories.value = stories.value.map((story, index) => {
    const titles = ['家族成立', '重要婚礼', '长子出生', '乔迁新居', '家族聚会', '事业成就', '学业有成', '重要纪念日', '家族旅行', '未来规划']
    return {
      ...story,
      title: titles[index],
      image: `/img/stories/${titles[index]}.jpg`
    }
  })
  
  console.log('更新后的stories数据:', stories.value)
  emit('update:currentStoryImage', stories.value[0].image)
  console.log('更新后的默认图片路径:', stories.value[0].image)
}

// 选择大事记 - 跳转到详情页
const selectStory = (index) => {
  console.log('选择的索引:', index)
  console.log('对应的图片路径:', stories.value[index].image)
  activeStoryIndex.value = index
  emit('update:currentStoryImage', stories.value[index].image)
  console.log('更新后的currentStoryImage:', stories.value[index].image)
  
  // 跳转到详情页，传递故事id
  router.push({ name: 'EventDetail', params: { id: stories.value[index].id } })
}

// 添加家族大事记
const addFamilyStory = () => {
  alert('添加家族大事记功能开发中...')
}
</script>

<style scoped>
/* 第二屏布局 - 参考family.html样式 */
.stories-container.horizontal-layout {
  display: flex;
  height: 100% !important;
  overflow: hidden;
  flex: 1;
}

/* 左侧图片展示框样式 */
.story-image-display {
  width: 50%;
  height: 100% !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  padding: 20px;
  box-sizing: border-box;
  border-right: 1px solid #e0e0e0;
  overflow: hidden;
}

/* 图片容器 - 调整为1:1比例 */
.image-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片占位符样式 */
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
  z-index: 1;
}

.image-placeholder p {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

/* 图片悬停效果 */
.story-image:hover {
  transform: translateX(0);
}

/* 默认图片容器 */
.default-image-container {
  width: 100%;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 8px;
}

/* 背景图片容器 */
.bg-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/img/2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

/* 第二屏容器 - 与FamilyMap组件保持一致 */
div.family-modules.traditional-section.stories-section.family-story-container {
  width: 100%;
  height: 100%;
  padding: 80px 20px 40px 20px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--background-color);
}

.family-modules.stories-section.family-story-container .module-container {
  position: relative !important;
  z-index: 10 !important;
  width: 100% !important;
  max-width: 1200px !important;
  height: 90% !important;
  margin: 0 auto !important;
  background-color: rgba(255, 255, 255, 0.5) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  overflow: hidden !important;
  padding: 20px !important;
}

.family-modules.stories-section.family-story-container .module-content {
  height: calc(100% - 60px) !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题容器占满宽度 */
.full-width {
  width: 100%;
}

/* 故事标题布局 - 参考family.html样式 */
.story-titles.vertical-titles {
  width: 50%;
  height: 100% !important;
  display: flex;
  flex-direction: row;
  gap: 30px;
  padding: 20px;
  align-items: center;
  justify-content: center;
  background-color: transparent;
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  min-height: 200px;
}

/* 奇数列标题动画：从上至下滑动 */
.family-modules.stories-section.family-story-container.in-view .story-title.odd-index {
  animation: slideDownToCenter 0.8s ease-out forwards;
}

/* 偶数列标题动画：从下至上滑动 */
.family-modules.stories-section.family-story-container.in-view .story-title.even-index {
  animation: slideUpToCenter 0.8s ease-out forwards;
}

/* 入场动画延迟 */
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(1) { animation-delay: 0.1s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(2) { animation-delay: 0.2s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(3) { animation-delay: 0.3s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(4) { animation-delay: 0.4s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(5) { animation-delay: 0.5s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(6) { animation-delay: 0.6s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(7) { animation-delay: 0.7s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(8) { animation-delay: 0.8s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(9) { animation-delay: 0.9s; }
.family-modules.stories-section.family-story-container.in-view .story-title:nth-of-type(10) { animation-delay: 1s; }

/* 基础标题样式 */
.story-title {
  transition: all 0.3s ease;
}

/* 鼠标悬停效果 - 只在真正悬停时显示 */
.story-title:hover {
  color: var(--primary-color);
  transform: translateX(-10px);
  border-right-color: var(--primary-color);
  background-color: rgba(22, 73, 98, 0.1);
  box-shadow: 0 2px 6px rgba(22, 73, 98, 0.1);
}

/* 激活状态 - 仅在点击选中时生效，与悬停效果区分 */
.story-title.active {
  /* 移除与悬停相同的样式，仅保留必要的激活标记 */
  border-right-color: var(--primary-color);
  background-color: rgba(22, 73, 98, 0.05);
  /* 不添加transform和其他悬停特有的样式 */
  transform: none;
  box-shadow: none;
  color: inherit; /* 使用默认文本颜色 */
}

/* 图片容器 */
.image-container {
  position: relative;
  overflow: hidden;
}

/* 故事图片样式 - 宽度填满，高度自适应 */
.story-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  opacity: 0;
  transform: translateX(-50px);
  animation: slideInFromLeft 0.6s ease-out forwards;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 图片从左侧进入动画 */
@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 奇数列标题动画：从上至下滑动到水平线上 */
@keyframes slideDownToCenter {
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 偶数列标题动画：从下至上滑动到水平线上 */
@keyframes slideUpToCenter {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


</style>