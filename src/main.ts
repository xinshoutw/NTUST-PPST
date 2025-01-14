import {createApp} from 'vue'
import {createPinia} from 'pinia'
import {router} from './router'
import App from './App.vue'
import './style.css' // 全域樣式

/**
 * 建立應用程式，使用 Pinia 與自訂 router，最後掛載到 #app
 */
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
