<template>
  <div class="admin-page">
    <h1>正向心理學 - 管理者後台</h1>

    <!-- 未登入：顯示登入表單 -->
    <div v-if="!token && !isLoading" class="login-container">
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>請輸入 Token</label>
          <input
              v-model="adminTokenInput"
              class="form-input"
              name="token"
              placeholder="請輸入 Token"
              required
              type="password"
          />
        </div>
        <button class="btn-login" type="submit">登入</button>
      </form>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </div>

    <!-- 載入中 -->
    <div v-else-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- 已登入：顯示主題列表 -->
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
              class="form-input"
              placeholder="輸入關鍵字"
              type="text"
          />
        </div>
      </div>

      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>資料加載中...</p>
      </div>

      <!-- 主題卡片列表 -->
      <transition-group class="test-cards" name="card-transition" tag="div">
        <div
            v-for="(test, testIndex) in filteredData"
            :key="test.test_name + testIndex"
            :style="{ width: cardWidth }"
            class="test-card"
            @click="toggleTestDetail(testIndex)"
        >
          <div class="card-header">
            <div class="title-row">
              <h3>{{ test.test_name }}</h3>
              <small class="people-count">({{ test.responses.length }} 人參與)</small>
            </div>
            <span class="test-score">平均：{{ test.average_score ?? '無' }}</span>
          </div>
          <!-- 下方為展開使用者清單 -->
          <transition name="expand-detail">
            <!-- 若 openedTestIndices 包含當前 index，表示展開 -->
            <div v-if="openedTestIndices.includes(testIndex)" class="test-detail">
              <div
                  v-for="(resp, userIndex) in sortedResponses(test.responses)"
                  :key="resp.student_id + userIndex"
                  class="user-card"
                  @click.stop="toggleUserDetail(testIndex, userIndex)"
              >
                <div class="user-header">
                  <h4>{{ resp.student_id }} | {{ resp.student_name }}</h4>
                  <span
                      :class="scoreColor(resp.result_score, test)"
                      class="user-score"
                  >
                    分數：{{ resp.result_score ?? '無' }}
                  </span>
                </div>
                <p class="test-time">
                  {{ formatTime(resp.test_time) }}
                </p>

                <transition name="expand-detail">
                  <div
                      v-if="openedUserIndices[testIndex]?.includes(userIndex)"
                      class="user-detail"
                  >
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

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {useAdminStore} from '@/store/adminStore'
import {get_data} from '@/utils/api'
import {useCardWidth} from '@/utils/useCardWidth'

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

/* 使用者展開狀態 */
const openedUserIndices = ref<{ [testIndex: number]: number[] }>({})

/* 取得字卡寬度 */
const {cardWidth} = useCardWidth()

/**
 * 發送 Token 到後端以取得管理者數據
 */
async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await get_data(adminTokenInput.value)
    if (res.status) {
      adminStore.setToken(adminTokenInput.value)
      adminStore.setAggregatedData(res.data || [])
    } else {
      errorMessage.value = '無法取得資料'
    }
  } catch {
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
    tempData = tempData.map((test) => ({
      ...test,
      responses: test.responses.filter(
          (resp) => resp.gender.toString() === filterGender.value
      ),
    }))
  }

  if (filterStudentId.value.trim()) {
    const keyword = filterStudentId.value.trim().toLowerCase()
    tempData = tempData.map((test) => ({
      ...test,
      responses: test.responses.filter((resp) =>
          resp.student_id.toLowerCase().includes(keyword)
      ),
    }))
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
    {immediate: true}
)

/**
 * 切換是否展開主題卡
 * @param testIndex - 該主題卡索引
 */
function toggleTestDetail(testIndex: number) {
  if (openedTestIndices.value.includes(testIndex)) {
    openedTestIndices.value = openedTestIndices.value.filter(
        (index) => index !== testIndex
    )
    delete openedUserIndices.value[testIndex]
  } else {
    openedTestIndices.value.push(testIndex)
    openedUserIndices.value[testIndex] = []
  }
}

/**
 * 切換是否展開使用者卡
 * @param testIndex - 主題卡索引
 * @param userIndex - 使用者卡索引
 */
function toggleUserDetail(testIndex: number, userIndex: number) {
  if (!openedUserIndices.value[testIndex]) {
    openedUserIndices.value[testIndex] = []
  }
  const userList = openedUserIndices.value[testIndex]
  const userIndexPos = userList.indexOf(userIndex)
  if (userIndexPos > -1) {
    userList.splice(userIndexPos, 1)
  } else {
    userList.push(userIndex)
  }
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
  return new Date(dateStr).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 根據 Q3 計算，若分數 > Q3 → 綠色 (score-high)；否則橘色 (score-low)
 * @returns 分數對應的 CSS class
 */

function scoreColor(score: number | null, test: any): string {
  if (score === null) return '' // 如果分數為 null，返回空字串

  // 提取有效分數並排序，使用複製數組的方式避免修改原數據
  const validScores = [...test.responses]
    .map((resp) => resp.result_score)
    .filter((s): s is number => s !== null)
    .sort((a, b) => a - b)

  // 如果沒有有效分數，返回空字串
  if (!validScores.length) return ''

  // 計算 Q3 (四分位上界)
  const pos = (validScores.length - 1) * 0.75
  const base = Math.floor(pos)
  const rest = pos - base

  const q3 =
    validScores[base + 1] !== undefined
      ? validScores[base] + rest * (validScores[base + 1] - validScores[base])
      : validScores[base]

  // 返回對應的顏色 class
  return score > q3 ? 'score-high' : 'score-low'
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
}

.test-card {
  background-color: #fffdfa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s, max-height 0.4s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.test-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
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

@media screen and (max-width: 800px) {
  .admin-page {
    font-size: 16px;
  }
}
</style>
