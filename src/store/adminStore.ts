import {defineStore} from 'pinia'
import {ref} from 'vue'

/**
 * 管理者後台資料格式
 */
interface AdminTestData {
    test_name: string
    questions: string[]
    responses: {
        student_id: string
        student_name: string
        gender: number
        test_time: string
        result_scores: ScoreData[]
        answers: (number | string)[]
    }[]
}


/**
 * Pinia Store：管理者狀態
 */
export const useAdminStore = defineStore('adminStore', () => {
    const adminToken = ref<string | null>(null)
    const aggregatedData = ref<AdminTestData[]>([])

    /**
     * 設定 Token
     * @param token - 管理者 Token
     */
    function setToken(token: string) {
        adminToken.value = token
    }

    /**
     * 設定後端回傳的整合資料
     * @param data - 後端回傳的主題及作答資料陣列
     */
    function setAggregatedData(data: AdminTestData[]) {
        aggregatedData.value = data
    }

    return {
        adminToken,
        aggregatedData,
        setToken,
        setAggregatedData
    }
})
