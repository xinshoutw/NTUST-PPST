import axios from 'axios'

/**
 * Google Apps Script Endpoint
 */
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyecx6IaUNPft9gLr6r6DziyFWxfG3OXRxPCi5PpnSETzp7JNqRFqn80RVwkPmT4icJ/exec'

/**
 * 將數值四捨五入到小數點後第二位
 * @param num - 輸入數值或 null
 * @returns 四捨五入到小數點兩位的結果，或 null
 */
function roundToTwo(num: number | null): number | null {
    if (num === null) return null
    return Math.round(num * 100) / 100
}

/* ========== 學生登入/取得資料 ========== */
interface GetUserDataSuccess {
    status: true
    student_id: string
    student_name: string
    gender: number
    data: Array<{
        test_name: string
        test_time: string
        result_score: number | null
        question_answer?: Array<{ q: string; a: number | string }>
        questions?: Array<{ q: string; a: number | string }>
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
        const res = await axios.post<GetUserDataResponse>(
            ENDPOINT,
            `{"sid":"${username}","pwd":"${password}"}`,
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            }
        )

        // 若成功, 將 result_score 四捨五入到小數點後第二位
        if (res.data.status && res.data.data) {
            res.data.data.forEach(d => {
                d.result_score = roundToTwo(d.result_score)
            })
        }

        return res.data
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
            result_score: number | null
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
        const res = await axios.post<GetDataResponse>(
            ENDPOINT,
            `{"token":"${token_key}"}`,
            {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            }
        )

        // 若成功, 將 average_score 及各 response 的 result_score 四捨五入到小數點後第二位
        if (res.data.status && res.data.data) {
            res.data.data.forEach(testItem => {
                testItem.average_score = roundToTwo(testItem.average_score)
                testItem.responses.forEach(resp => {
                    resp.result_score = roundToTwo(resp.result_score)
                })
            })
        }

        return res.data
    } catch {
        return {
            status: false,
            data: null
        }
    }
}
