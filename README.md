# 🛒 購物清單網頁

一個現代化的線上購物清單管理系統，用於追蹤和管理購物項目。

## 📋 專案結構

```
D:\C\Desk\BuyList\
├── index.html      # 主網頁
├── styles.css      # 樣式表
├── script.js       # JavaScript 邏輯
├── README.md       # 本檔案
└── 購物清單.xlsx    # 原始 Excel 檔案
```

## 🚀 功能概覽

### 第 1 版（當前版本）✅
- ✅ 靜態表格顯示購物清單
- ✅ 模擬資料展示
- ✅ 基本樣式設計
- ✅ 刪除功能
- ✅ 日期格式化
- ✅ 響應式設計

### 第 2 版（計畫中）
- 🔄 新增項目功能
- 🔄 編輯項目功能
- 🔄 本地存儲 (LocalStorage)

### 第 3 版（計畫中）
- 📊 Google Sheets API 整合
- 💾 雲端資料同步
- 🖼️ 圖片展示方案（Grid / Carousel）
- ➕ 完整 CRUD 功能
- 🔐 資料驗證

### 第 4 版（計畫中）
- 🚀 GitHub Pages 部署
- 📱 PWA（離線支援）
- 🎨 深色模式
- 🔔 通知功能

## 📖 如何使用

### 本地開發
1. 下載或 clone 此專案
2. 用瀏覽器開啟 `index.html`
3. 刪除按鈕已可用，其他功能待實現

### 檔案說明

**index.html**
- 頁面結構和標記
- 表格 HTML
- 按鈕和控制項

**styles.css**
- 全站樣式
- 響應式設計
- 漸層背景和陰影效果

**script.js**
- 表格渲染邏輯
- 模擬資料
- 刪除功能
- 日期格式化

## 📊 資料結構

每項商品包含以下欄位：
```javascript
{
    id: 唯一識別碼,
    date: '日期 (YYYYMMDD)',
    sequence: '序號 (1, 2, 3...)',
    image: '圖片網址',
    brand: '品牌名稱',
    notes: '備註說明'
}
```

## 🎯 下一步計畫

### 第 2 版準備工作
1. 實現新增表單 UI
2. 實現編輯表單 UI
3. 使用 LocalStorage 儲存資料
4. 驗證輸入資料

### 第 3 版準備工作
1. 申請 Google Sheets API
2. 設定授權
3. 實現 API 讀寫
4. 圖片網址→圖片展示

## 💻 技術棧

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **儲存**: 計畫使用 LocalStorage / Google Sheets API
- **部署**: 計畫使用 GitHub Pages

## 📝 更新日誌

### v1.0 (初始版本)
- 基本表格顯示
- 模擬資料
- 刪除功能

## 🔧 開發建議

- 所有模擬資料將在集成 Google Sheets 時移除
- 目前代碼是為了逐步開發而設計
- 歡迎反饋和改進建議

---

**開發者**: Claude Code
**更新時間**: 2026-02-12
"# ParcelManager" 
