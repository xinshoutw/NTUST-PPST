<template>
  <div class="student-page">
    <h1 v-if="!studentInfo">普通心理學 - 學生登入</h1>

    <!-- 未登入：顯示登入表單 -->
    <div v-if="!studentInfo && !isLoading" class="login-container">
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>學號(S-B12345678)</label>
          <input
              v-model="username"
              class="form-input"
              name="username"
              placeholder="請輸入學號(S-B12345678)"
              required
              type="text"
          />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input
              v-model="password"
              class="form-input"
              name="password"
              placeholder="請輸入密碼"
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

    <!-- 登入後顯示量表資訊 -->
    <div v-else>
      <p class="welcome-text">
        Hello, {{ studentInfo?.student_id }} | {{ studentInfo?.student_name }}
      </p>

      <div v-if="testsDataSorted.length === 0" class="no-records">
        <p>今日無填寫記錄</p>
      </div>
      <div v-else>
        <transition-group
            :style="{ width: cardWidth }"
            class="card-list"
            name="card-transition"
            tag="div"
        >
          <div
              v-for="(test, index) in testsDataSorted"
              :key="test.test_name + index"
              :style="{ width: cardWidth }"
              class="test-card"
              @click="toggleDetail(index)"
          >
            <!-- 左側標題 + 右側分數區塊 -->
            <div class="header-title">
              <div class="title-row">
                <h3>{{ test.test_name }}</h3>
              </div>
              <div class="header-scores">
                <div class="score-badge-container">
                  <template v-if="test.result_scores && test.result_scores.length > 0">
                  <span
                      v-for="(scoreItem, sIdx) in test.result_scores"
                      :key="sIdx"
                      class="badge"
                  >
                    <strong>{{ scoreItem.subject_name }}</strong>
                    <span class="badge-space"></span>
                    {{ scoreItem.score }}
                  </span>
                  </template>
                  <template v-else>
                    <span class="no-score">無</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- 時間戳：卡片下方左側 -->
            <p class="test-time">{{ formatTime(test.test_time) }}</p>

            <!--          <transition name="expand-detail">-->
            <!--            <div v-if="showDetailIndex === index" class="test-detail">-->
            <!--              <div-->
            <!--                  v-for="(qa, i) in test.question_answer"-->
            <!--                  :key="i"-->
            <!--                  class="qa-item"-->
            <!--              >-->
            <!--                <div class="qa-question">{{ qa.q }}</div>-->
            <!--                <div class="qa-answer">{{ qa.a }}</div>-->
            <!--              </div>-->
            <!--            </div>-->
            <!--          </transition>-->
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
import {computed, ref} from 'vue'
import {useStudentStore} from '@/store/studentStore'
import {get_user_data} from '@/utils/api'
import {useCardWidth} from '@/utils/useCardWidth'

/**
 * 存放使用者在登入表單中輸入的學號
 */
const username = ref('')

/**
 * 存放使用者在登入表單中輸入的密碼
 */
const password = ref('')

/**
 * 錯誤訊息
 */
const errorMessage = ref('')

/**
 * 是否處於載入中狀態
 */
const isLoading = ref(false)

/**
 * 用於記錄目前展開哪一張量表詳情
 * 若為 null，表示目前沒有展開
 */
const showDetailIndex = ref<number | null>(null)

/**
 * 顯示字卡寬度
 */
const {cardWidth} = useCardWidth()

/**
 * 取得 studentStore，保存了當前學生資訊與量表
 */
const store = useStudentStore()

/**
 * 計算屬性：回傳目前 store 中的學生基本資訊
 */
const studentInfo = computed(() => store.studentInfo)

/**
 * 計算屬性：回傳目前 store 中的量表資料
 */
const testsData = computed(() => store.testsData)

/**
 * 計算屬性：依照時間做排序，讓較新的量表排在前面
 * @returns 排序後的量表陣列
 */
const testsDataSorted = computed(() => {
  return [...testsData.value].sort(
      (a, b) => new Date(b.test_time).getTime() - new Date(a.test_time).getTime()
  )
})

/**
 * 將後端給的日期字串轉成使用者易讀格式
 * @param dateStr - 後端日期字串
 * @returns 轉換後的「yyyy/MM/dd HH:mm:ss」格式
 */
function formatTime(dateStr: string): string {
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
 * 處理學生登入
 * 若登入成功，就將後端回傳的資訊存到 studentStore
 */
async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  const res = await get_user_data(username.value, password.value)
  isLoading.value = false

  if (res.status) {
    store.setStudentInfo({
      student_id: res.student_id,
      student_name: res.student_name,
      gender: res.gender
    })
    store.setTestsData(res.data || [])
  } else {
    errorMessage.value = '登入失敗'
  }
}

/**
 * 點擊量表卡片時，展開/收合該量表的詳情
 * @param index - 量表在 testsDataSorted 中的索引
 */
function toggleDetail(index: number) {
  showDetailIndex.value = showDetailIndex.value === index ? null : index
}
</script>

<style scoped>
/* 最外層：背景、排版、版面尺寸 */
.student-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fef9f0;
  min-height: 100vh;
  color: #444;
  padding: 1rem;
  box-sizing: border-box;
}

.student-page h1 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}


.title-row h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #444;
  font-weight: bold;
}

/* 登入表單容器 */
.login-container {
  width: 100%;
  max-width: 400px;
  background: #fffbea;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* 載入中時的 Spinner */
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

.welcome-text {
  margin-bottom: 1.5rem;
  font-weight: 600;
  font-size: 1.2rem;
}

/* 量表卡片列表容器 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
  align-items: center;
  padding: 0 1rem;
  box-sizing: border-box;
}

/* 單張量表卡片 */
.test-card {
  display: block;
  box-sizing: border-box;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fffdfa;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.3s;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.test-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 左側標題、右側分數區塊的排版 */
.header-title {
  display: flex;
  flex: 1 1 auto;
  min-width: 160px;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

/* 分數外層容器：分數太多時可換行到下一行 */
.header-scores {
  flex: 1 1 auto;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  flex-wrap: wrap;
  max-width: 100%;
}

/* 多顆分數badge容器 */
.score-badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  font-weight: bold;
}

/* 單個分數 badge：橢圓形實心色塊 */
.badge {
  display: inline-flex;
  align-items: center;
  background-color: #5569af;
  color: #fff;
  border-radius: 9999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

/* 主題與分數之間的寬度 */
.badge-space {
  display: inline-block;
  width: 6px;
}

/* 若沒有任何分數 */
.no-score {
  font-size: 0.9rem;
  color: #bf360c;
  font-weight: bold;
}

/* 時間戳 (卡片下方) */
.test-time {
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.5rem;
}

/* 展開的詳細內容區塊 */
.test-detail {
  margin-top: 0.5rem;
  background: #fffce6;
  padding: 0.8rem;
  border-radius: 4px;
}

.qa-item {
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.qa-question {
  font-weight: bold;
  color: #5d4037;
  margin-bottom: 0.3rem;
}

.qa-answer {
  margin-left: 1rem;
  font-size: 1rem;
  color: #444;
  background-color: #fffaeb;
  border-left: 4px solid #5569af;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
}

/* 卡片進場/退場動畫 */
.card-transition-enter-active,
.card-transition-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.card-transition-enter-from,
.card-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 卡片詳細展開/收合動畫 */
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
  max-height: 5000px;
  opacity: 1;
  padding: 0.8rem;
}

/* 今日無填寫記錄 */
.no-records {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 1.2rem;
  color: #777;
}

/* RWD：小螢幕時改為寬度 100% */
@media screen and (max-width: 900px) {
  .student-page {
    font-size: 14px;
  }

  .card-list {
    padding: 0 0.5rem;
  }

  .badge {
    font-size: 13px;
  }

  .test-time {
    font-size: 12px;
  }
}

</style>
