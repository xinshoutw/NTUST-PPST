import axios from 'axios'

/**
 * Google Apps Script Endpoint
 */
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyecx6IaUNPft9gLr6r6DziyFWxfG3OXRxPCi5PpnSETzp7JNqRFqn80RVwkPmT4icJ/exec'

/* ========== 學生登入/取得資料 ========== */
interface GetUserDataSuccess {
    status: true
    student_id: string
    student_name: string
    gender: number
    data: Array<{
        test_name: string
        test_time: string
        result_scores: Array<{ subject_name: string; score: number }>
        // question_answer: Array<{ q: string; a: number | string }>
    }>
}

interface GetUserDataFail {
    status: false
    student_id: null
    student_name: null
    gender: null
    data: null
}

export type GetUserDataResponse = GetUserDataSuccess | GetUserDataFail

/**
 * 發送學號與密碼以取得學生資料
 * @param username - 學號
 * @param password - 密碼
 * @returns 後端回傳的學生資料物件
 */
export async function get_user_data(
    username: string,
    password: string
): Promise<GetUserDataResponse> {
    try {
        return (await axios.post<GetUserDataResponse>(
            ENDPOINT,
            `{"sid":"${username}","pwd":"${password}"}`,
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            }
        )).data
    } catch {
        console.error('Failed to fetch user data')
        return {
            status: false,
            student_id: null,
            student_name: null,
            gender: null,
            data: null
        }
    }
}

/* ========== 管理者取得資料 ========== */
interface GetDataSuccess {
    status: true
    data: {
        test_name: string
        average_score: number | null
        questions: string[]
        responses: {
            student_id: string
            student_name: string
            gender: number
            test_time: string
            result_scores: Array<{ subject_name: string; score: number }>
            answers: (number | string)[]
        }[]
    }[]
}

interface GetDataFail {
    status: false
    data: null
}

export type GetDataResponse = GetDataSuccess | GetDataFail

/**
 * 發送 Token 以取得管理者後台資料
 * @param token_key - 管理者 Token
 * @returns 後端回傳的主題與填答資訊
 */
export async function get_data(token_key: string): Promise<GetDataResponse> {
    try {
        return (await axios.post<GetDataResponse>(
            ENDPOINT,
            `{"token":"${token_key}"}`,
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            }
        )).data
    } catch {
        return {
            status: false,
            data: null
        }
    }
}
