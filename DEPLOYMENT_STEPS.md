# Google Apps Script 部署步驟（圖文說明）

## 第 1 步：開啟 Google Sheet 中的 Apps Script

1. 打開你的 Google Sheet
2. 點擊功能表 **延伸功能** (或 **Tools**)
3. 選擇 **Apps Script**

```
Google Sheet
  ↓
延伸功能 → Apps Script
  ↓
Google Apps Script 編輯器開啟（新標籤）
```

---

## 第 2 步：貼入代碼

1. 刪除編輯器中的所有預設代碼（通常是 `function myFunction()` 等）
2. 從 `apps-script.gs` 複製**所有代碼**
3. 貼入編輯器

---

## 第 3 步：設定 Sheet ID

在貼入的代碼的最上方，找到：
```javascript
const SHEET_ID = '你的SHEET_ID';
```

替換成你的真實 Sheet ID：

### 如何獲得 Sheet ID：
1. 你的 Google Sheet URL：
   ```
   https://docs.google.com/spreadsheets/d/這是SHEET_ID/edit
   ```
2. 複製 `d/` 和 `/edit` 之間的部分

### 例子：
```
URL: https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
SHEET_ID: 1a2b3c4d5e6f7g8h9i0j

修改為：
const SHEET_ID = '1a2b3c4d5e6f7g8h9i0j';
```

---

## 第 4 步：保存代碼

點擊 **儲存** 或 **Ctrl+S**

---

## 第 5 步：部署為 Web 應用

### 方法 A：點擊「部署」按鈕（較新版 Google Apps Script）

1. 點擊右上角的 **部署** (Deploy)
2. 選擇 **新部署** (New deployment)
3. 點擊右上角的齒輪 ⚙️，選擇 **Web app**

### 方法 B：使用菜單（較舊版）

1. 點擊菜單 **部署** → **新部署**
2. 選擇類型：**Web app**

---

## 第 6 步：配置部署設定

設定部分會顯示：

| 項目 | 設定值 |
|------|--------|
| **執行身份** | 你的 Google 帳戶 |
| **誰可以存取** | 任何人 |

點擊 **部署**

---

## 第 7 步：複製部署 URL

部署完成後，會顯示一個對話框：

```
部署 ID: AKfycbz...

部署 URL:
https://script.google.com/macros/d/1a2b3c4d5e6f/usercallable
```

**複製這個 URL**（完整的）

---

## 第 8 步：更新前端代碼

在你的 `script.js` 最上方，找到：

```javascript
const APPS_SCRIPT_URL = '你的部署URL';
```

替換為複製的 URL：

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/d/1a2b3c4d5e6f/usercallable';
```

---

## 第 9 步：測試部署

1. 重新整理網頁 (F5 或 Ctrl+R)
2. 打開開發者工具 (F12)
3. 打開 **Console** 標籤
4. 在 Console 中輸入：
   ```javascript
   loadDataFromSheet()
   ```
5. 按 Enter

### 預期輸出：
```
正在從 Google Sheet 讀取資料...
成功讀取 X 個項目
```

如果看到這個，**恭喜！部署成功！** 🎉

---

## 常見的部署問題

### 問題 1：找不到「部署」按鈕
**解決方案：**
- 如果是較舊版 Google Apps Script，點擊菜單 **發布** → **部署為網頁應用**
- 或者尋找 **⚙️ 齒輪** 圖標

### 問題 2：部署時出現權限錯誤
**解決方案：**
- 確保你登入了有編輯該 Google Sheet 的 Google 帳戶
- 可能需要給 Google Apps Script 授權，按照提示允許

### 問題 3：部署 URL 無效
**解決方案：**
- 確認完整複製了 URL
- 如果修改了代碼，需要重新部署（新版本）

---

## 更新代碼後的操作

如果你修改了 `apps-script.gs` 的代碼：

1. 保存代碼
2. 點擊 **部署** → **管理部署**
3. 點擊之前的部署
4. 點擊 **編輯**
5. 選擇新版本（或點擊「新版本」建立新版本）
6. 部署完成

**注意：** URL 會保持相同，不需要更新 `script.js`

---

## 驗證部署是否成功

### 方法 1：在 Console 中測試
```javascript
// 讀取資料
loadDataFromSheet()

// 應該看到資料加載
```

### 方法 2：檢查 Google Sheet 是否更新
1. 編輯表格中的某個項目
2. 點擊「儲存」
3. 檢查 Google Sheet 是否已更新

### 方法 3：查看 Apps Script 執行日誌
在 Google Apps Script 編輯器中：
1. 點擊 **執行日誌** (Execution log)
2. 應該看到最近的執行紀錄
3. 如果有錯誤，會顯示在這裡

---

**部署完成後，你的購物清單就與 Google Sheet 完全同步了！** ✨
