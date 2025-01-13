import { createRouter, createWebHistory } from 'vue-router'
import StudentPage from '@/pages/StudentPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

/**
 * 建立前端路由 (Vue Router)
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/ntust-work-PPST', name: 'student', component: StudentPage },
    { path: '/ntust-work-PPST/admin', name: 'admin', component: AdminPage }
  ]
})
