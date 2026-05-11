import { createApp } from 'vue'
import './style.css'
import './assets/style.css'  // 引入原项目的样式文件
import App from './App.vue'
import router from './router'  // 引入路由配置
import { createPinia } from 'pinia'  // 引入Pinia
import ElementPlus from 'element-plus'  // 引入ElementPlus
import 'element-plus/dist/index.css'  // 引入ElementPlus样式

const app = createApp(App)
app.use(router)  // 使用路由
app.use(createPinia())  // 使用Pinia
app.use(ElementPlus)  // 使用ElementPlus
app.mount('#app')
