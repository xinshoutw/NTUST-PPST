# 普通心理學專案

以 **Vue 3 + Pinia + Vite** 開發的單頁應用，提供「學生端登入 / 量表查詢」與「管理者後台篩選 / 資料瀏覽」功能。後端資料來源為 Google Apps Script。

## 技術棧

| 類別 | 使用工具 |
| --- | --- |
| 框架 | Vue 3.5 (Composition API) |
| 狀態管理 | Pinia 4 |
| 路由 | Vue Router 5（Hash 模式） |
| 建置工具 | Vite 8 |
| 語言 / 型別檢查 | TypeScript 6、vue-tsc 3 |
| HTTP | axios |

## 環境需求

- Node.js **>= 22.12**（見 `package.json` 的 `engines`）
- npm

## 專案結構

```
src/
├── main.ts              # 進入點：掛載 Vue、Pinia、Router
├── App.vue              # 根組件（<router-view>）
├── style.css            # 全域樣式
├── vite-env.d.ts        # Vite client 型別宣告
├── router/index.ts      # 路由設定（/ 學生、/admin 管理者）
├── store/               # Pinia 狀態
│   ├── studentStore.ts
│   ├── adminStore.ts
│   └── sharedStore.ts
├── pages/
│   ├── StudentPage.vue  # 學生登入與量表清單
│   └── AdminPage.vue    # 管理者後台
└── utils/
    ├── api.ts           # 與 Google Apps Script 通訊
    └── useCardWidth.ts  # 卡片寬度 composable
```

`@/` 別名指向 `src/`（設定於 `vite.config.ts` 與 `tsconfig.json`）。

## 開發

```sh
npm install      # 安裝套件
npm run dev      # 啟動開發伺服器
npm run build    # 型別檢查 (vue-tsc) + 打包 (vite)
npm run preview  # 本地預覽 production 產物
```

## 部署

推送至 GitHub 後由 **Vercel** 自動建置（`npm run build`）並部署 `dist/`。

## 主要功能

- **學生登入**：輸入學號密碼 → 呼叫 API 取得學生與量表資料 → 卡片式清單，可展開查看詳情。
- **管理者後台**：輸入管理者 Token → 取得所有主題與作答資料 → 使用者卡片多重展開，依分數四分位距標示高低分顏色。

## 授權

本專案採用 **Apache License 2.0**，詳見 `LICENSE`。
