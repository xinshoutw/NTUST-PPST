<template>
  <div class="admin-page">
    <h1>正向心理學 - 管理者後台</h1>

    <!-- 若尚未登入，輸入 Token -->
    <div v-if="!token && !isLoading" class="login-container">
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>請輸入 Token</label>
          <input
            v-model="adminTokenInput"
            type="password"
            name="token"
            class="form-input"
            placeholder="請輸入 Token"
            required
          />
        </div>
        <button type="submit" class="btn-login">登入</button>
      </form>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </div>

    <!-- 載入中 -->
    <div v-else-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- 已登入：顯示多主題卡片 & 過濾區 -->
    <div v-else>
      <div class="filters">
        <div class="filter-group">
          <select v-model="filterGender" class="form-select">
            <option value="">全部性別</option>
            <option value="1">男性</option>
            <option value="2">女性</option>
          </select>
        </div>
        <div class="filter-group">
          <input
            v-model="filterStudentId"
            type="text"
            class="form-input"
            placeholder="輸入關鍵字"
          />
        </div>
      </div>

      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>資料加載中...</p>
      </div>

      <!-- 主題卡片列表 -->
      <transition-group name="card-transition" tag="div" class="test-cards" v-else>
        <div
          class="test-card"
          v-for="(test, index) in filteredData"
          :key="test.test_name + index"
          @click="toggleTestDetail(index)"
        >
          <div class="card-header">
            <div class="title-row">
              <h3>{{ test.test_name }}</h3>
              <small class="people-count">({{ test.responses.length }} 人參與)</small>
            </div>
            <span class="test-score">
              平均：{{ test.average_score ?? '無' }}
            </span>
          </div>
          <!-- 下方為展開使用者清單 -->
          <transition name="expand-detail">
            <!-- 若 openedTestIndices 包含當前 index，表示展開 -->
            <div v-if="openedTestIndices.includes(index)" class="test-detail">
              <div
                v-for="(resp, respIdx) in sortedResponses(test.responses)"
                :key="resp.student_id + respIdx"
                class="user-card"
                @click.stop="toggleUserDetail(respIdx)"
              >
                <div class="user-header">
                  <h4>{{ resp.student_id }} | {{ resp.student_name }}</h4>
                  <span
                    class="user-score"
                    :class="scoreColor(resp.result_score, test)"
                  >
                    分數：{{ resp.result_score ?? '無' }}
                  </span>
                </div>
                <p class="test-time">
                  {{ formatTime(resp.test_time) }}
                </p>

                <transition name="expand-detail">
                  <div v-if="openedUserIndex === respIdx" class="user-detail">
                    <div
                      v-for="(q, qIndex) in test.questions"
                      :key="qIndex"
                      class="qa-item"
                    >
                      <div class="qa-question">{{ q }}</div>
                      <div class="qa-answer">
                        {{ resp.answers[qIndex] }}
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAdminStore } from '@/store/adminStore'
import { get_data } from '@/utils/api'

/* 從 store 取得管理者相關狀態 */
const adminStore = useAdminStore()
const token = computed(() => adminStore.adminToken)
const aggregatedData = computed(() => adminStore.aggregatedData)

/* UI 狀態 */
const adminTokenInput = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

/* 篩選條件 */
const filterGender = ref('')
const filterStudentId = ref('')

/* 主題展開清單（可同時展開多個） */
const openedTestIndices = ref<number[]>([])

/* 使用者展開索引（一次只展開一位使用者卡） */
const openedUserIndex = ref<number | null>(null)

/**
 * 發送 Token 到後端以取得管理者數據
 */
async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const dataRes = await get_data(adminTokenInput.value)
    if (dataRes.status) {
      adminStore.setToken(adminTokenInput.value)
      adminStore.setAggregatedData(dataRes.data || [])
    } else {
      errorMessage.value = '無法取得填寫資料'
    }
  } catch (err) {
    errorMessage.value = '系統錯誤'
  }
  isLoading.value = false
}

/**
 * 根據性別、學號（模糊搜尋）即時過濾 aggregatedData
 * @returns 過濾後的主題陣列
 */
const filteredData = computed(() => {
  let tempData = aggregatedData.value

  if (filterGender.value) {
    tempData = tempData.map(testItem => {
      const filteredRes = testItem.responses.filter(
        r => r.gender.toString() === filterGender.value
      )
      return { ...testItem, responses: filteredRes }
    })
  }

  if (filterStudentId.value.trim()) {
    const keyword = filterStudentId.value.trim().toLowerCase()
    tempData = tempData.map(testItem => {
      const filteredRes = testItem.responses.filter(
        r => r.student_id.toLowerCase().includes(keyword)
      )
      return { ...testItem, responses: filteredRes }
    })
  }

  return tempData
})

/**
 * 若主題只剩 1 位使用者，就自動展開
 */
watch(
  filteredData,
  newVal => {
    openedTestIndices.value = []
    newVal.forEach((test, idx) => {
      if (test.responses.length === 1) {
        openedTestIndices.value.push(idx)
      }
    })
  },
  { immediate: true }
)

/**
 * 切換是否展開主題卡
 * @param index - 該主題卡索引
 */
function toggleTestDetail(index: number) {
  openedUserIndex.value = null
  const i = openedTestIndices.value.indexOf(index)
  if (i > -1) {
    openedTestIndices.value.splice(i, 1)
  } else {
    openedTestIndices.value.push(index)
  }
}

/**
 * 切換是否展開使用者卡
 * @param uIndex - 使用者卡索引
 */
function toggleUserDetail(uIndex: number) {
  openedUserIndex.value = openedUserIndex.value === uIndex ? null : uIndex
}

/**
 * 依學號排序使用者
 * @param responses - 該主題的使用者清單
 * @returns 排序後的新陣列
 */
function sortedResponses(responses: any[]) {
  return [...responses].sort((a, b) => a.student_id.localeCompare(b.student_id))
}

/**
 * 格式化時間字串
 * @param dateStr - 後端傳來的日期字串
 * @returns 「yyyy/MM/dd HH:mm:ss」易讀格式
 */
function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 根據 Q3 計算，若分數 > Q3 → 綠色 (score-high)；否則橘色 (score-low)
 * @param score - 使用者分數
 * @param test - 該主題資料，內含 responses
 * @returns 分數對應的 CSS class
 */
function scoreColor(score: number | null, test: any): string {
  if (score == null) return ''
  const q3 = calcQ3ForTest(test)
  return score > q3 ? 'score-high' : 'score-low'
}

/**
 * 計算主題的四分位距 Q3，用於判斷高分與否
 * @param test - 該主題資料，包含 responses
 * @returns Q3 的數值
 */
function calcQ3ForTest(test: any): number {
  const validScores = test.responses
    .map((r: any) => r.result_score)
    .filter((s: number | null) => s !== null)
    .sort((a: number, b: number) => a - b)

  if (!validScores.length) return 0

  const pos = (validScores.length - 1) * 0.75
  const base = Math.floor(pos)
  const rest = pos - base
  if (validScores[base + 1] !== undefined) {
    return validScores[base] + rest * (validScores[base + 1] - validScores[base])
  } else {
    return validScores[base]
  }
}
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fef9f0;
  min-height: 100vh;
  color: #444;
  padding: 1rem;
  font-family: Arial, sans-serif;
}
h1 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}
.login-container {
  width: 100%;
  max-width: 400px;
  background: #fffbea;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group label {
  margin-bottom: 0.5rem;
  display: block;
  font-weight: 600;
}
.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 1rem;
}
.btn-login {
  background-color: #ffa726;
  color: #fff;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-login:hover {
  background-color: #ff9100;
}
.error-text {
  color: #ff4141;
  margin-top: 0.5rem;
  text-align: center;
}
/* 過濾區 */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 800px;
  justify-content: center;
}
.filter-group {
  display: flex;
  flex-direction: column;
  font-weight: 600;
}
.form-select {
  margin-top: 0.3rem;
  border: 1px solid #bbb;
  border-radius: 4px;
  padding: 0.4rem;
  cursor: pointer;
}
/* Loading */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #ccc;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 0.5rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* 主題卡片列表 */
.test-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: auto;
  max-width: none;
}
.test-card {
  width: 800px;
  background-color: #fffdfa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s, max-height 0.4s ease;
  cursor: pointer;
  box-sizing: border-box;
}
.test-card:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.title-row h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #444;
  font-weight: bold;
}
.people-count {
  color: #888;
  font-size: 0.85rem;
}
.test-score {
  font-size: 0.9rem;
  color: #bf360c;
  font-weight: bold;
}
.test-detail {
  width: 100%;
  background: #fffce6;
  padding: 0.8rem;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
}
/* 使用者卡 */
.user-card {
  background: #fefdf9;
  margin-top: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.8rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.user-card:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-header h4 {
  margin: 0;
  color: #444;
  font-size: 1rem;
  font-weight: bold;
}
.user-score {
  font-size: 0.9rem;
  font-weight: bold;
}
.score-high {
  color: #388e3c;
}
.score-low {
  color: #ffa726;
}
.test-time {
  font-size: 0.85rem;
  color: #777;
  margin-top: 0.3rem;
  margin-bottom: 0.5rem;
}
.user-detail {
  margin-top: 0.5rem;
  background: #fff;
  padding: 0.6rem;
  border-radius: 4px;
}
.qa-item {
  margin-bottom: 1rem;
  line-height: 1.5;
}
.qa-question {
  font-weight: bold;
  color: #5d4037;
  margin-bottom: 0.2rem;
}
.qa-answer {
  margin-left: 1rem;
  font-size: 1rem;
  color: #444;
  background-color: #fffaeb;
  border-left: 4px solid #ffa726;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
}
/* 卡片進場/退場 */
.card-transition-enter-active,
.card-transition-leave-active {
  transition: all 0.3s ease;
}
.card-transition-enter-from,
.card-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
/* 展開高度動畫 */
.expand-detail-enter-active,
.expand-detail-leave-active {
  transition: max-height 0.4s ease, opacity 0.4s ease, padding 0.4s ease;
}
.expand-detail-enter-from,
.expand-detail-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
}
.expand-detail-enter-to,
.expand-detail-leave-from {
  max-height: 2000px;
  opacity: 1;
}
@media screen and (max-width: 600px) {
  .admin-page {
    font-size: 20px;
  }
  .test-cards {
    max-width: 100%;
  }
}
</style>
