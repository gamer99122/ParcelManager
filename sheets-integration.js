// ===== Google Sheets 整合代碼 =====
// 將此代碼添加到 script.js 的最上方

// 配置 Google Apps Script 部署 URL
const APPS_SCRIPT_URL = '你的部署URL';  // 替換成實際的 Apps Script 部署 URL

// ===== 從 Google Sheet 讀取資料 =====
async function loadDataFromSheet() {
    try {
        console.log('正在從 Google Sheet 讀取資料...');

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'read' })
        });

        const result = await response.json();

        if (result.success) {
            shoppingList = result.data || [];
            console.log(`成功讀取 ${shoppingList.length} 個項目`);
            renderPage();
            showNotification('✅ 資料已從 Google Sheet 讀取');
        } else {
            console.error('讀取失敗:', result.message);
            showNotification('❌ 讀取資料失敗: ' + result.message);
        }
    } catch (error) {
        console.error('讀取錯誤:', error);
        showNotification('❌ 連接錯誤: ' + error.message);
    }
}

// ===== 保存新項目到 Google Sheet =====
async function addItemToSheet(item) {
    try {
        console.log('正在保存新項目到 Google Sheet...');

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'write',
                items: [item]
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('項目已保存');
            await loadDataFromSheet();
            return true;
        } else {
            console.error('保存失敗:', result.message);
            showNotification('❌ 保存失敗: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('保存錯誤:', error);
        showNotification('❌ 保存錯誤: ' + error.message);
        return false;
    }
}

// ===== 更新項目到 Google Sheet =====
async function updateItemToSheet(item) {
    try {
        console.log('正在更新項目到 Google Sheet...');

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                item: item
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('項目已更新');
            return true;
        } else {
            console.error('更新失敗:', result.message);
            showNotification('❌ 更新失敗: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('更新錯誤:', error);
        showNotification('❌ 更新錯誤: ' + error.message);
        return false;
    }
}

// ===== 從 Google Sheet 刪除項目 =====
async function deleteItemFromSheet(id) {
    try {
        console.log('正在從 Google Sheet 刪除項目...');

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('項目已刪除');
            await loadDataFromSheet();
            return true;
        } else {
            console.error('刪除失敗:', result.message);
            showNotification('❌ 刪除失敗: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('刪除錯誤:', error);
        showNotification('❌ 刪除錯誤: ' + error.message);
        return false;
    }
}

// ===== 修改現有函數 =====

// 原來的 deleteItem 函數修改為
async function deleteItemModified(id) {
    if (confirm(t('deleteConfirm'))) {
        const success = await deleteItemFromSheet(id);
        if (success) {
            showNotification(t('deleteSuccess'));
        }
    }
}

// 修改 saveEdit 函數，保存時同時更新 Google Sheet
async function saveEditModified(event) {
    event.preventDefault();

    if (currentEditId === null) return;

    const item = shoppingList.find(i => i.id === currentEditId);
    if (!item) return;

    // 更新本地資料
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

// 修改 updateShipment 函數
async function updateShipmentModified(id, value) {
    const item = shoppingList.find(i => i.id === id);
    if (item) {
        item.shipment = value;
        await updateItemToSheet(item);
        showNotification(t('shipmentSuccess'));
    }
}
