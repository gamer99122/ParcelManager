# Google Sheets API 整合指南

## 📋 完整設置步驟

### **步驟 1：建立 Google Sheet**

1. 前往 [Google Drive](https://drive.google.com)
2. 建立新的 **Google Sheet**，命名為「購物清單」
3. 建立以下欄位（第一行）：
   ```
   A: 日期
   B: 序號
   C: 圖片1
   D: 圖片2
   E: 圖片3
   F: 品牌
   G: 備註
   H: 寄送狀態
   ```
4. 複製 Sheet ID：
   - URL 格式：`https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - 複製 `SHEET_ID` 部分

### **步驟 2：建立 Google Apps Script**

1. 在同一 Google Sheet 中：
   - 點擊菜單 **延伸功能** → **Apps Script**
2. 新標籤頁會開啟 Google Apps Script 編輯器
3. 刪除預設代碼，貼入 `apps-script.gs` 的內容

### **步驟 3：配置 Apps Script**

在 `apps-script.gs` 的最上方，設定你的 Sheet ID：

```javascript
const SHEET_ID = '你的SHEET_ID';  // 替換成實際的 Sheet ID
```

### **步驟 4：部署為 Web 應用**

1. 在 Apps Script 編輯器，點擊 **部署** (Deploy)
2. 選擇 **新部署** (New deployment)
3. 選擇類型 → **Web 應用** (Web app)
4. 設定：
   - **執行身份：** 你的 Google 帳戶
   - **誰可以存取：** 任何人
5. 部署後，複製生成的 **部署 URL**
   - 格式類似：`https://script.google.com/macros/d/xxxxx/usercallable`

### **步驟 5：更新前端代碼**

在 `script.js` 的最上方，設定 Apps Script URL：

```javascript
const APPS_SCRIPT_URL = '你的部署URL';  // 替換成實際的 URL
```

### **步驟 6：測試**

1. 重新整理網頁
2. 打開開發者工具（F12） → Console
3. 執行：`loadDataFromSheet()`
4. 檢查是否成功讀取 Google Sheet 的資料

---

## 🔑 Google Sheet 結構

你的 Google Sheet 應該看起來像這樣：

| 日期 | 序號 | 圖片1 | 圖片2 | 圖片3 | 品牌 | 備註 | 寄送狀態 |
|------|------|-------|-------|-------|------|------|---------|
| 20250914 | 1 | | | | | | 空白 |
| 20251124 | 1 | | | | | | 空白 |

- 日期格式：`YYYYMMDD`
- 寄送狀態：`空白`、`不寄送`、`寄送`、`部分寄送`

---

## 📝 常見問題

### Q: 部署後還是無法連接？
A: 確保：
1. 設定的 SHEET_ID 正確
2. APPS_SCRIPT_URL 正確複製
3. 重新整理網頁（Ctrl+F5 強制刷新）

### Q: 如何更新 Apps Script 代碼？
A: 修改後點擊 **部署** → **管理部署** → **編輯** → 選擇新版本

### Q: 如何刪除項目？
A: 在 Google Sheet 中直接刪除該列，重新整理網頁

---

## 🔗 參考資料

- [Google Apps Script 文檔](https://developers.google.com/apps-script)
- [Sheets API 參考](https://developers.google.com/sheets/api)

---

**設置完成後，所有資料會自動從 Google Sheet 讀取和保存！** 🎉
