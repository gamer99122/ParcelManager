# Google Apps Script 代碼複製詳細步驟

## 📌 第 1 步：打開 Google Apps Script 編輯器

### 在你的 Google Sheet 中：
1. 點擊功能表 **延伸功能**
2. 點擊 **Apps Script**

```
Google Sheet 頁面
    ↓
點擊菜單 [延伸功能]
    ↓
點擊 [Apps Script]
    ↓
新標籤頁打開（Google Apps Script 編輯器）
```

---

## 📄 第 2 步：看到默認代碼

Google Apps Script 編輯器會打開，你會看到以下代碼：

```javascript
function myFunction() {

}
```

這就是**預設代碼**，我們需要刪除它。

---

## 🗑️ 第 3 步：刪除預設代碼

### 方法 1：全選並刪除（推薦）

1. **全選所有代碼**
   - 按 **Ctrl+A**（Windows）或 **Cmd+A**（Mac）

2. **看到代碼變藍色**（表示已選中）

3. **按 Delete 或 Backspace 刪除**

### 方法 2：手動刪除

1. 把光標放在代碼的最開頭
2. 按住滑鼠左鍵，拖到代碼最後面
3. 全選後按 Delete

---

## 📋 第 4 步：複製 apps-script.gs 的代碼

### 在你的電腦上：

1. **打開 `apps-script.gs` 文件**
   - 位置：`D:\C\Desk\BuyList\apps-script.gs`
   - 用記事本或任何文字編輯器打開

2. **全選所有代碼**
   - 按 **Ctrl+A**

3. **複製代碼**
   - 按 **Ctrl+C**

---

## 📝 第 5 步：貼入代碼到 Google Apps Script

### 回到 Google Apps Script 編輯器：

1. **點擊編輯框**（代碼區域）

2. **貼入代碼**
   - 按 **Ctrl+V**

3. **看到代碼出現在編輯框中**

```
編輯框應該會看到：

// ===== 配置區域 =====
const SHEET_ID = '你的SHEET_ID';
const SHEET_NAME = 'Sheet1';

// ===== 主處理函數 =====
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        ...（很多代碼）
}
```

---

## ⚙️ 第 6 步：設定 SHEET_ID

**重要步驟！不能跳過！**

### 找到這一行：
```javascript
const SHEET_ID = '你的SHEET_ID';
```

### 替換成你的 Sheet ID：

1. **獲得你的 Sheet ID：**
   - 打開你的 Google Sheet
   - 看 URL：
     ```
     https://docs.google.com/spreadsheets/d/這個部分就是SHEET_ID/edit
     ```

2. **例子：**
   - URL：`https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f/edit`
   - SHEET_ID：`1a2b3c4d5e6f`

3. **替換：**
   ```javascript
   // 原本：
   const SHEET_ID = '你的SHEET_ID';

   // 改成：
   const SHEET_ID = '1a2b3c4d5e6f';
   ```

---

## 💾 第 7 步：保存代碼

在 Google Apps Script 編輯器中：

1. **按 Ctrl+S 保存**

或者

1. **點擊功能表 檔案**
2. **點擊 保存**

會看到 ✓ 符號，表示已保存。

---

## ✅ 完成檢查清單

- [ ] 打開了 Google Sheet 中的 Apps Script
- [ ] 刪除了預設的 `function myFunction()` 代碼
- [ ] 複製了 `apps-script.gs` 文件中的所有代碼
- [ ] 貼入到 Google Apps Script 編輯器
- [ ] 找到了 `const SHEET_ID = '你的SHEET_ID';` 這一行
- [ ] 用你的實際 Sheet ID 替換了它
- [ ] 保存了代碼（Ctrl+S）

如果完成了這些步驟，下一步就是部署！

---

## 🔍 檢查代碼是否正確

1. 在 Google Apps Script 編輯器中，往下滾動
2. 應該看到多個函數：
   - `readData()`
   - `writeData()`
   - `updateItem()`
   - `deleteItem()`
   - `createResponse()`

如果看到這些函數，說明代碼已正確貼入！

---

## ❌ 常見問題

### 問題 1：黏貼後看到錯誤符號
**原因：** 可能粘貼不完整或有格式問題
**解決：**
1. 全選所有代碼（Ctrl+A）
2. 刪除（Delete）
3. 重新複製一遍 `apps-script.gs`
4. 重新粘貼

### 問題 2：找不到 SHEET_ID 這一行
**原因：** 可能代碼沒有完整粘貼
**解決：**
1. 檢查編輯框是否有很多代碼
2. 往上滾動到最開始
3. 第 2-3 行應該有 `const SHEET_ID`

### 問題 3：不知道自己的 Sheet ID
**解決方法：**
1. 打開你的 Google Sheet
2. 查看網址欄（地址欄）
3. 複製 `d/` 和 `/edit` 之間的部分

---

## 📱 視覺化示意

```
你的電腦                          Google Apps Script 編輯器
┌─────────────────┐              ┌──────────────────────┐
│ apps-script.gs  │              │   (打開的編輯框)      │
│                 │              │                      │
│ 複製全部代碼    │   Ctrl+C     │                      │
│                 │──────────→   │  Ctrl+V  →  代碼出現 │
│                 │              │                      │
└─────────────────┘              └──────────────────────┘
        ↓                                   ↓
   找到這一行                          找到這一行
   const SHEET_ID                      const SHEET_ID
   = '你的SHEET_ID'                    = '你的SHEET_ID'
        ↓                                   ↓
  複製你的 Sheet ID          用你的 Sheet ID 替換
  從 Google Sheet URL        按 Ctrl+S 保存
```

---

## 🎯 下一步

完成以上步驟後，按照以下流程繼續：

1. ✅ 代碼已貼入並保存
2. → 部署為 Web 應用（參考 DEPLOYMENT_STEPS.md）
3. → 複製部署 URL
4. → 更新前端代碼中的 APPS_SCRIPT_URL

---

**有任何不懂的地方，可以重新閱讀本指南！** 📖
