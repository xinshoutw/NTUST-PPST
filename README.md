# 正向心理學專案

本專案使用 **Vue 3 + Pinia + Vite** 開發，並實作了「學生端登入、量表查詢」與「管理者後台篩選、資料瀏覽」等功能。

## 專案結構

- `index.html`：前端入口檔  
- `vite.config.ts`：Vite 主要設定，內含 `alias` 設定  
- `src/main.ts`：Vue 應用程式進入點  
- `src/router`：路由設定 (Vue Router)  
- `src/store`：以 Pinia 管理的全域狀態  
- `src/utils/api.ts`：與後端通訊的 API 函式  
- `src/pages`：`StudentPage.vue`、`AdminPage.vue` 等頁面  
- `src/style.css`：全域樣式  

## 安裝與運行

1. 安裝套件
   \`\`\`sh
   npm install
   \`\`\`

2. 啟動開發伺服器
   \`\`\`sh
   npm run dev
   \`\`\`

3. 打包生產環境檔案
   \`\`\`sh
   npm run build
   \`\`\`

4. 本地測試生產檔案
   \`\`\`sh
   npm run preview
   \`\`\`

## 主要功能

- **學生登入**：  
  1. 使用者輸入學號與密碼  
  2. 呼叫後端 API 取得學生資訊與量表資料  
  3. 顯示量表清單，支援卡片展開看詳情  

- **管理者後台**：  
  1. 輸入管理者 Token 取得所有主題與作答資料  
  2. 使用者卡片呈現，多重展開  
  3. 分數四分位距、顯示高分或低分顏色  

## 授權

本專案採用 **Apache License 2.0** 授權，詳細授權內容請見專案中的 \`LICENSE\` 檔案。

