# Google Sheets 整合完整指南

## 📁 文件說明

### 1. **GOOGLE_SHEETS_SETUP.md**
- Google Sheet 的建立和配置步驟
- Apps Script 部署方法
- 完整的設置檢查清單

### 2. **apps-script.gs**
- Google Apps Script 的完整代碼
- 處理讀、寫、更新、刪除操作
- 貼到 Google Apps Script 編輯器中

### 3. **sheets-integration.js**
- 前端與 Google Sheets 整合代碼
- 包含讀寫數據的函數

---

## 🚀 快速集成步驟

### **步驟 1：設置 Google Sheet 和 Apps Script**

遵循 `GOOGLE_SHEETS_SETUP.md` 的步驟：
1. 建立 Google Sheet
2. 部署 Google Apps Script
3. 複製 Apps Script 部署 URL

### **步驟 2：修改 script.js**

在 `script.js` 的最上方添加配置：

```javascript
// Google Sheets 設定
const APPS_SCRIPT_URL = 'https://script.google.com/macros/d/xxxxx/usercallable';  // 替換成你的 URL

// 在初始化部分修改
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromSheet();  // 從 Google Sheet 讀取資料
    setupModalClosing();
});
```

### **步驟 3：添加整合代碼**

將 `sheets-integration.js` 的內容複製到 `script.js` 中，並修改以下函數：

#### **修改 deleteItem 函數：**
```javascript
async function deleteItem(id) {
    if (confirm(t('deleteConfirm'))) {
        const success = await deleteItemFromSheet(id);
        if (success) {
            showNotification(t('deleteSuccess'));
        }
    }
}
```

#### **修改 saveEdit 函數：**
```javascript
async function saveEdit(event) {
    event.preventDefault();

    if (currentEditId === null) return;

    const item = shoppingList.find(i => i.id === currentEditId);
    if (!item) return;

    // 更新資料
    item.date = parseDate(document.getElementById('editDate').value);
    item.sequence = document.getElementById('editSequence').value;
    item.images = [
        document.getElementById('editImage1').value,
        document.getElementById('editImage2').value,
        document.getElementById('editImage3').value
    ];
    item.brand = document.getElementById('editBrand').value;
    item.notes = document.getElementById('editNotes').value;
    item.shipment = document.getElementById('editShipment').value;

    // 保存到 Google Sheet
    const success = await updateItemToSheet(item);

    if (success) {
        renderTable();
        closeEditModal();
        showNotification(t('editSuccess'));
    }
}
```

#### **修改 updateShipment 函數：**
```javascript
async function updateShipment(id, value) {
    const item = shoppingList.find(i => i.id === id);
    if (item) {
        item.shipment = value;
        await updateItemToSheet(item);
        showNotification(t('shipmentSuccess'));
    }
}
```

### **步驟 4：添加新增項目功能**

當前 HTML 中的「新增項目」按鈕只是提示，我們需要實現完整的新增表單。

---

## ✅ 檢查清單

- [ ] Google Sheet 已建立，欄位正確
- [ ] Google Apps Script 已部署
- [ ] APPS_SCRIPT_URL 已複製並設置
- [ ] script.js 已修改為使用 Google Sheets
- [ ] 重新整理網頁並測試
- [ ] 開發者工具 (F12) 中沒有錯誤訊息
- [ ] 能成功讀取 Google Sheet 的資料

---

## 🔧 測試方法

1. **開啟開發者工具** (F12)
2. **打開 Console** 標籤
3. **執行以下命令測試讀取：**
   ```javascript
   loadDataFromSheet()
   ```
4. **檢查 Console 輸出：**
   - 應該看到「正在從 Google Sheet 讀取資料...」
   - 然後「成功讀取 X 個項目」

---

## 🐛 常見問題排查

### 問題 1：CORS 錯誤
**症狀：** Console 出現 CORS 錯誤
**解決方案：** 確保 Apps Script 部署設定為「任何人可以存取」

### 問題 2：讀不到資料
**症狀：** 成功讀取但沒有資料
**解決方案：**
1. 檢查 SHEET_ID 是否正確
2. 檢查 Google Sheet 的欄位名稱是否符合
3. 確保 Google Sheet 中有資料

### 問題 3：更新失敗
**症狀：** 編輯後無法保存到 Google Sheet
**解決方案：**
1. 檢查 APPS_SCRIPT_URL 是否正確
2. 檢查 Google Sheet 的編輯權限
3. 查看 Console 中的錯誤訊息

---

## 📝 數據同步說明

### 讀取流程：
1. 頁面加載 → 調用 `loadDataFromSheet()`
2. 發送請求到 Apps Script
3. Apps Script 從 Google Sheet 讀取資料
4. 前端接收並更新 `shoppingList`
5. 渲染表格

### 寫入流程：
1. 用戶編輯項目 → 點擊「儲存」
2. 調用 `updateItemToSheet(item)`
3. 發送資料到 Apps Script
4. Apps Script 更新 Google Sheet
5. 前端重新讀取資料並更新表格

### 刪除流程：
1. 用戶點擊「刪除」
2. 確認後調用 `deleteItemFromSheet(id)`
3. Apps Script 從 Google Sheet 刪除該列
4. 前端重新讀取資料

---

## 🎯 後續功能

整合後，你可以進一步添加：

1. **多用戶支持** - 多個用戶可同時編輯
2. **即時更新** - 使用 Google Sheets 變更通知
3. **備份功能** - 定期備份到其他 Sheet
4. **報表功能** - 生成發貨報表
5. **提醒功能** - 某日期到期時提醒

---

## 🔒 安全提示

1. **不要**在前端代碼中硬編碼敏感資訊
2. 定期更新 Google Apps Script 代碼
3. 監控 Apps Script 的執行日誌
4. 考慮添加驗證機制（未來版本）

---

**集成完成後，你的購物清單就會與 Google Sheet 同步！** 🎉
