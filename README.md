# 煙癮紀錄網站

一個簡單的煙癮紀錄系統，用於追蹤每日抽煙數量和生成統計報表。

## 特色功能

- ✅ **記錄管理**: 記錄日期、人物、抽煙數量
- ✅ **即時更新**: 使用 HTMX 實現無刷新頁面體驗
- ✅ **統計報表**: 提供圖表和統計數據
- ✅ **響應式設計**: 使用 Tailwind CSS，適配各種裝置

## 技術棧

- **前端**: HTML + HTMX + Tailwind CSS (CDN)
- **後端**: FastAPI (計劃中)
- **資料庫**: SQLite (計劃中)
- **開發工具**: JSON Server (假 API)

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動假 API 伺服器

```bash
npm run dev
```

這會在 `http://localhost:3000` 啟動 JSON Server

### 3. 啟動網頁伺服器

開新終端，執行：

```bash
python3 server.py
```

這會在 `http://localhost:8000` 啟動網頁伺服器

### 4. 開啟瀏覽器

- 主頁面: http://localhost:8000/
- 報表頁面: http://localhost:8000/reports

## 頁面功能

### 主頁面 (/)
- 新增每日抽煙記錄
- 查看最近記錄列表
- 使用 HTMX 即時更新

### 報表頁面 (/reports)
- 統計卡片顯示總計數據
- 每日趨勢圖表
- 人員比較圖表
- 詳細記錄表格
- 可篩選日期範圍和人物

## API 端點 (JSON Server)

- `GET /records` - 獲取所有記錄
- `POST /records` - 新增記錄
- `PUT /records/:id` - 更新記錄
- `DELETE /records/:id` - 刪除記錄

### 範例數據格式

```json
{
  "id": 1,
  "date": "2025-01-08",
  "person": "小明",
  "count": 12
}
```

## 專案結構

```
smoking-record-web/
├── templates/          # HTML 模板
│   ├── base.html      # 基礎模板
│   ├── index.html     # 主頁面
│   └── reports.html   # 報表頁面
├── static/            # 靜態檔案
├── db.json            # JSON Server 資料檔
├── package.json       # Node.js 依賴
├── server.py          # Python 靜態伺服器
└── README.md          # 說明文檔
```

## 下一步計劃

- [x] 實作 FastAPI 後端
- [ ] 加入使用者登入系統
- [x] 使用 SQLite 資料庫
- [ ] 加入資料導出功能 (csv)
- [ ] 優化圖表顯示
- [ ] 設定 SSL/TLS (certbot)
- [ ] Pagination for records table
- [ ] /reports 頁面的數值檢查
- [ ] 第三方登入 e.g. Google
- [ ] record 頁面的每一筆資料編輯

## 開發說明

### 前端技術
- **HTMX**: 實現 AJAX 功能，無需寫 JavaScript
- **Tailwind CSS**: 快速建立美觀的 UI
- **Chart.js**: 生成互動式圖表

### 假 API 測試
目前使用 JSON Server 模擬後端 API，方便前端開發和測試。

```bash
# 測試 API
curl http://localhost:3000/records

# 新增記錄
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-09", "person": "測試", "count": 5}'
```

## 授權

MIT License
