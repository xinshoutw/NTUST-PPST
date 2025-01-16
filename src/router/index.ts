import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import StudentPage from '@/pages/StudentPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

/**
 * 建立前端路由 (Vue Router)
 */
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', name: 'student', component: StudentPage},
        {path: '/admin/', name: 'admin', component: AdminPage}
    ]
})
