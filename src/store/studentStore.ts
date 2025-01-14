import {defineStore} from 'pinia'
import {ref} from 'vue'

/**
 * 單一題目與答案
 */
interface QuestionAnswer {
    q: string
    a: number | string
}

/**
 * 學生填寫的量表
 */
interface TestData {
    test_name: string
    test_time: string
    result_scores: ScoreData[]
    question_answer: QuestionAnswer[]
    questions: QuestionAnswer[]
}

/**
 * 學生基本資訊
 */
interface StudentInfo {
    student_id: string
    student_name: string
    gender: number
}

/**
 * Pinia Store：學生端資料
 */
export const useStudentStore = defineStore('studentStore', () => {
    const studentInfo = ref<StudentInfo | null>(null)
    const testsData = ref<TestData[]>([])

    /**
     * 設定學生個人資訊
     * @param info - 後端回傳的學號、姓名、性別
     */
    function setStudentInfo(info: StudentInfo) {
        studentInfo.value = info
    }

    /**
     * 設定學生量表資料
     * @param data - 後端回傳的量表陣列
     */
    function setTestsData(data: TestData[]) {
        testsData.value = data
    }

    return {
        studentInfo,
        testsData,
        setStudentInfo,
        setTestsData
    }
})
