// ===== API 設定 =====
const SHEET2API_URL = 'https://sheet2api.com/v1/0xbsaNcnQDyd/%25E5%258C%2585%25E8%25A3%25B9%25E6%25B8%2585%25E5%2596%25AE';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_DRbehgkkpLHZw0kFIVNafkbSJQTynYfkWATSKlYyHnFKPfGjwf57VLvkbR9ltp1o/exec';

// 購物資料本地緩存
let shoppingList = [];
let currentEditId = null;

// ==========================================
// 1. 基礎工具函數 (放置在最上方確保全域可用)
// ==========================================

// 顯示載入中遮罩
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) overlay.classList.remove('d-none');
        else overlay.classList.add('d-none');
    }
}

// 顯示綠色通知訊息
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 5000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 格式化日期 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateString) {
    if (!dateString) return '';
    dateString = String(dateString).trim();
    if (dateString.includes('-') && dateString.length === 10) return dateString;
    if (dateString.includes('/') && dateString.length === 10) return dateString.replace(/\//g, '-');
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        return dateString.slice(0, 4) + '-' + dateString.slice(4, 6) + '-' + dateString.slice(6, 8);
    }
    return dateString;
}

// 解析日期 (YYYY-MM-DD -> YYYYMMDD)
function parseDate(dateString) {
    return dateString.replace(/-/g, '');
}

// ==========================================
// 2. API 請求核心 (JSONP)
// ==========================================

function callAppsScript(params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            const scriptTag = document.getElementById(callbackName);
            if (scriptTag) document.body.removeChild(scriptTag);
            resolve(data);
        };

        params.callback = callbackName;
        params._t = new Date().getTime(); // 防止快取
        
        const queryString = new URLSearchParams(params).toString();
        const baseUrl = GOOGLE_APPS_SCRIPT_URL.trim();
        const url = `${baseUrl}?${queryString}`;

        const script = document.createElement('script');
        script.id = callbackName;
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            const scriptTag = document.getElementById(callbackName);
            if (scriptTag) document.body.removeChild(scriptTag);
            reject(new Error('連線到 Google Script 失敗'));
        };
        document.body.appendChild(script);

        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                const scriptTag = document.getElementById(callbackName);
                if (scriptTag) document.body.removeChild(scriptTag);
                reject(new Error('請求逾時'));
            }
        }, 20000);
    });
}

// ==========================================
// 3. 資料操作函數
// ==========================================

// 讀取
async function loadDataFromSheet() {
    try {
        console.log('正在從 Google Sheet 讀取資料...');
        const result = await callAppsScript({ action: 'read' });

        if (result.success && result.data) {
            shoppingList = result.data.map(item => ({
                id: item.id,
                date: String(item.date || ''),
                sequence: String(item.sequence || ''),
                images: item.images || ['', '', ''],
                brand: String(item.brand || ''),
                notes: String(item.notes || ''),
                shipment: String(item.shipment || '空白')
            }));
            renderPage();
            showNotification('✅ 資料已同步');
        }
    } catch (error) {
        console.error('讀取錯誤:', error);
        showNotification('❌ 無法同步資料');
        renderPage();
    }
}

// 更新
async function updateItemToSheet(item) {
    try {
        const result = await callAppsScript({
            action: 'update',
            item: JSON.stringify(item)
        });
        return result.success;
    } catch (error) {
        console.error('更新錯誤:', error);
        return false;
    }
}

// 新增
async function addItemToSheet(item) {
    try {
        const result = await callAppsScript({
            action: 'write',
            item: JSON.stringify(item)
        });
        return result.success;
    } catch (error) {
        console.error('新增錯誤:', error);
        return false;
    }
}

// 刪除
async function deleteItemFromSheet(id) {
    try {
        const result = await callAppsScript({
            action: 'delete',
            id: id
        });
        return result.success;
    } catch (error) {
        console.error('刪除錯誤:', error);
        return false;
    }
}

// ==========================================
// 4. 頁面渲染與互動
// ==========================================

function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const itemCount = document.getElementById('itemCount');

    if (shoppingList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><p>${t('noData')}</p></td></tr>`;
        if (itemCount) itemCount.textContent = '0';
        return;
    }

    const sortedList = [...shoppingList].sort((a, b) => a.date.localeCompare(b.date));

    tableBody.innerHTML = sortedList.map(item => {
        const validImages = item.images.filter(img => img && img.trim());
        const imageHTML = validImages.length > 0 ?
            `<div class="image-gallery" onclick="openLightbox(${item.id})">
                ${validImages.map((img, idx) =>
                    `<div class="image-placeholder" style="position: relative;">
                        <img src="${img}" alt="${t('colImage')} ${idx + 1}" onerror="this.parentElement.innerHTML='❌'">
                        <span class="image-count">${idx + 1}/${validImages.length}</span>
                    </div>`
                ).join('')}
            </div>` :
            `<div class="image-placeholder">${t('noImage')}</div>`;

        return `
            <tr>
                <td class="col-date date px-4 py-3">${formatDate(item.date)}</td>
                <td class="col-sequence px-4 py-3"><span class="sequence">${item.sequence}</span></td>
                <td class="col-image px-4 py-3">${imageHTML}</td>
                <td class="col-brand px-4 py-3">${item.brand || '-'}</td>
                <td class="col-shipment px-4 py-3">
                    <select class="form-select form-select-sm shipment-select" onchange="updateShipment(${item.id}, this.value)">
                        <option value="空白" ${item.shipment === '空白' ? 'selected' : ''}>${t('shipmentBlank')}</option>
                        <option value="不寄送" ${item.shipment === '不寄送' ? 'selected' : ''}>${t('shipmentNoSend')}</option>
                        <option value="寄送" ${item.shipment === '寄送' ? 'selected' : ''}>${t('shipmentSend')}</option>
                        <option value="部分寄送" ${item.shipment === '部分寄送' ? 'selected' : ''}>${t('shipmentPartial')}</option>
                    </select>
                </td>
                <td class="col-notes px-4 py-3" style="white-space: pre-wrap; word-break: break-word;">${item.notes || '-'}</td>
                <td class="col-actions px-4 py-3">
                    <div class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">${t('editButton')}</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">${t('deleteButton')}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (itemCount) itemCount.textContent = shoppingList.length;
}

// 儲存編輯或新增
async function saveEdit(event) {
    event.preventDefault();

    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (!saveBtn) return;
    
    const originalText = saveBtn.innerHTML;
    
    // 進入狀態
    saveBtn.disabled = true;
    saveBtn.innerHTML = '處理中...';
    showLoading(true);

    const itemData = {
        date: parseDate(document.getElementById('editDate').value),
        sequence: document.getElementById('editSequence').value,
        images: [
            document.getElementById('editImage1').value,
            document.getElementById('editImage2').value,
            document.getElementById('editImage3').value
        ],
        brand: document.getElementById('editBrand').value,
        notes: document.getElementById('editNotes').value,
        shipment: document.getElementById('editShipment').value
    };

    try {
        let success = false;
        if (currentEditId !== null) {
            itemData.id = currentEditId;
            success = await updateItemToSheet(itemData);
        } else {
            success = await addItemToSheet(itemData);
        }

        if (success) {
            closeEditModal();
            await loadDataFromSheet();
            showNotification('✅ 儲存成功');
        } else {
            showNotification('❌ 儲存失敗');
        }
    } catch (e) {
        showNotification('❌ 發生錯誤');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        showLoading(false);
    }
}

// 刪除
async function deleteItem(id) {
    if (confirm(t('deleteConfirm'))) {
        showLoading(true);
        try {
            const success = await deleteItemFromSheet(id);
            if (success) {
                await loadDataFromSheet();
                showNotification(t('deleteSuccess'));
            }
        } finally {
            showLoading(false);
        }
    }
}

// 快速更新狀態
async function updateShipment(id, value) {
    const item = shoppingList.find(i => i.id === id);
    if (item) {
        item.shipment = value;
        showLoading(true);
        try {
            const success = await updateItemToSheet(item);
            if (success) {
                await loadDataFromSheet();
                showNotification(t('shipmentSuccess'));
            }
        } finally {
            showLoading(false);
        }
    }
}

// ==========================================
// 5. 模態框與 UI 控制
// ==========================================

function editItem(id) {
    currentEditId = id;
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editDate').value = formatDate(item.date);
    document.getElementById('editSequence').value = item.sequence;
    document.getElementById('editImage1').value = item.images[0] || '';
    document.getElementById('editImage2').value = item.images[1] || '';
    document.getElementById('editImage3').value = item.images[2] || '';
    document.getElementById('editBrand').value = item.brand || '';
    document.getElementById('editNotes').value = item.notes || '';
    document.getElementById('editShipment').value = item.shipment || '空白';

    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function toggleAddForm() {
    currentEditId = null;
    document.getElementById('editForm').reset();
    document.getElementById('editDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('editSequence').value = "1";
    document.getElementById('editShipment').value = "空白";

    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function closeEditModal() {
    const modalElement = document.getElementById('editModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
    currentEditId = null;
}

// ==========================================
// 6. 語言與初始化
// ==========================================

const translations = {
    'zh-TW': {
        title: '📦 想要這次寄送的包裹清單',
        subtitle: '幫我編輯備註要寄送的商品以及部分寄送的商品',
        addButton: '新增項目', editButton: '編輯', deleteButton: '刪除',
        saveButton: '儲存', cancelButton: '取消',
        colDate: '收件日期', colSequence: '序號', colImage: '圖片',
        colBrand: '商家', colNotes: '備註', colShipment: '寄送狀態',
        colActions: '操作', formTitle: '編輯購物項目',
        labelDate: '收件日期', labelSequence: '序號', labelImage: '商品圖片 (最多 3 張)',
        labelBrand: '商家', labelNotes: '備註', labelShipment: '寄送狀態',
        shipmentBlank: '空白', shipmentNoSend: '不寄送', shipmentSend: '寄送', shipmentPartial: '部分寄送',
        deleteConfirm: '確定要刪除此項目嗎？', deleteSuccess: '✅ 項目已刪除',
        editSuccess: '✅ 項目已更新', shipmentSuccess: '✅ 狀態已更新',
        noImage: '無圖片', noData: '尚無購物項目'
    },
    'ja-JP': {
        title: '📦 配送リスト',
        subtitle: '配送する商品と部分配送の商品を編集してください',
        addButton: '追加', editButton: '編輯', deleteButton: '削除',
        saveButton: '保存', cancelButton: '取消',
        colDate: '日付', colSequence: '番号', colImage: '画像',
        colBrand: '店舗', colNotes: '備考', colShipment: 'ステータス',
        colActions: '操作', formTitle: 'アイテム編輯',
        labelDate: '日付', labelSequence: '番号', labelImage: '画像 (最大3枚)',
        labelBrand: '店舗', labelNotes: '備考', labelShipment: 'ステータス',
        shipmentBlank: '空白', shipmentNoSend: '未配送', shipmentSend: '配送済', shipmentPartial: '部分配送',
        deleteConfirm: '削除しますか？', deleteSuccess: '✅ 削除完了',
        editSuccess: '✅ 更新完了', shipmentSuccess: '✅ 更新完了',
        noImage: '画像なし', noData: 'データなし'
    }
};

let currentLanguage = localStorage.getItem('language') || 'zh-TW';

function t(key) { return translations[currentLanguage]?.[key] || translations['zh-TW'][key] || key; }

function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    renderPage();
}

function renderPage() {
    updatePageText();
    renderTable();
}

function updatePageText() {
    document.querySelector('h1').textContent = t('title');
    document.querySelector('.lead').textContent = t('subtitle');
    document.querySelector('button.btn-primary').textContent = t('addButton');
    
    const ths = document.querySelectorAll('thead th');
    if (ths.length > 0) {
        ths[0].textContent = t('colDate'); ths[1].textContent = t('colSequence');
        ths[2].textContent = t('colImage'); ths[3].textContent = t('colBrand');
        ths[4].textContent = t('colShipment'); ths[5].textContent = t('colNotes');
        ths[6].textContent = t('colActions');
    }

    document.querySelector('.modal-title').textContent = t('formTitle');
}

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    const editForm = document.getElementById('editForm');
    if (editForm) editForm.addEventListener('submit', saveEdit);
});

// 燈箱 (Lightbox)
let currentLightboxItemId = null;
let currentImageIndex = 0;

function openLightbox(itemId) {
    currentLightboxItemId = itemId;
    const item = shoppingList.find(i => i.id === itemId);
    if (!item) return;
    const validImages = item.images.filter(img => img && img.trim());
    if (validImages.length === 0) return;
    currentImageIndex = 0;
    showLightboxImage();
    document.getElementById('lightbox').classList.add('show');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('show');
}

function showLightboxImage() {
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    const validImages = item.images.filter(img => img && img.trim());
    const img = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');
    img.src = validImages[currentImageIndex];
    counter.textContent = `${currentImageIndex + 1} / ${validImages.length}`;
    document.getElementById('prevBtn').style.display = currentImageIndex === 0 ? 'none' : 'block';
    document.getElementById('nextBtn').style.display = currentImageIndex === validImages.length - 1 ? 'none' : 'block';
}

function prevImage() { if (currentImageIndex > 0) { currentImageIndex--; showLightboxImage(); } }
function nextImage() { 
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    if (currentImageIndex < item.images.filter(img => img && img.trim()).length - 1) { 
        currentImageIndex++; showLightboxImage(); 
    } 
}