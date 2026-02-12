// ===== 全域 API 設定 =====
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_DRbehgkkpLHZw0kFIVNafkbSJQTynYfkWATSKlYyHnFKPfGjwf57VLvkbR9ltp1o/exec';

// 1. 核心工具函數 (立即掛載到 window 確保全域可用)
window.showLoading = function(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) overlay.classList.remove('d-none');
        else overlay.classList.add('d-none');
    }
};

window.showNotification = function(message) {
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
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// 2. 日期處理
function formatDate(dateString) {
    if (!dateString) return '';
    dateString = String(dateString).trim();
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        return dateString.slice(0, 4) + '-' + dateString.slice(4, 6) + '-' + dateString.slice(6, 8);
    }
    return dateString;
}
function parseDate(dateString) { return dateString.replace(/-/g, ''); }

// 3. JSONP 請求核心
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
        params._t = new Date().getTime();
        const queryString = new URLSearchParams(params).toString();
        const url = `${GOOGLE_APPS_SCRIPT_URL}?${queryString}`;
        
        const script = document.createElement('script');
        script.id = callbackName;
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            reject(new Error('連線失敗'));
        };
        document.body.appendChild(script);
        setTimeout(() => { if (window[callbackName]) reject(new Error('逾時')); }, 20000);
    });
}

// 4. 資料操作
let shoppingList = [];
let currentEditId = null;

async function loadDataFromSheet() {
    try {
        window.showLoading(true);
        const result = await callAppsScript({ action: 'read' });
        if (result.success) {
            shoppingList = result.data || [];
            renderTable();
            window.showNotification('✅ 資料已同步');
        }
    } catch (e) {
        window.showNotification('❌ 讀取失敗');
    } finally {
        window.showLoading(false);
    }
}

// 5. 頁面渲染
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const sortedList = [...shoppingList].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    tableBody.innerHTML = sortedList.map(item => {
        const validImages = (item.images || []).filter(img => img && img.trim());
        const imageHTML = validImages.length > 0 ?
            `<div class="image-gallery" onclick="openLightbox(${item.id})">
                <div class="image-placeholder" style="position: relative;">
                    <img src="${validImages[0]}" onerror="this.parentElement.innerHTML='❌'">
                    <span class="image-count">1/${validImages.length}</span>
                </div>
            </div>` : `<div class="image-placeholder">無圖片</div>`;

        return `
            <tr>
                <td class="date px-4 py-3">${formatDate(item.date)}</td>
                <td class="px-4 py-3"><span class="sequence">${item.sequence}</span></td>
                <td class="px-4 py-3">${imageHTML}</td>
                <td class="px-4 py-3">${item.brand || '-'}</td>
                <td class="px-4 py-3">
                    <select class="form-select form-select-sm" onchange="updateShipment(${item.id}, this.value)">
                        <option value="空白" ${item.shipment === '空白' ? 'selected' : ''}>空白</option>
                        <option value="不寄送" ${item.shipment === '不寄送' ? 'selected' : ''}>不寄送</option>
                        <option value="寄送" ${item.shipment === '寄送' ? 'selected' : ''}>寄送</option>
                        <option value="部分寄送" ${item.shipment === '部分寄送' ? 'selected' : ''}>部分寄送</option>
                    </select>
                </td>
                <td class="px-4 py-3" style="white-space: pre-wrap;">${item.notes || '-'}</td>
                <td class="px-4 py-3">
                    <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">編輯</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">刪除</button>
                </td>
            </tr>
        `;
    }).join('');
    document.getElementById('itemCount').textContent = shoppingList.length;
}

// 6. 互動功能
async function saveEdit(event) {
    if (event) event.preventDefault();
    window.showLoading(true);
    
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
        let action = currentEditId !== null ? 'update' : 'write';
        if (currentEditId !== null) itemData.id = currentEditId;
        
        const result = await callAppsScript({ action: action, item: JSON.stringify(itemData) });
        
        if (result.success) {
            closeEditModal();
            await loadDataFromSheet();
            window.showNotification('✅ 儲存成功');
        } else {
            window.showNotification('❌ 儲存失敗: ' + result.message);
        }
    } catch (e) {
        window.showNotification('❌ 發生錯誤: ' + e.message);
    } finally {
        window.showLoading(false);
    }
}

async function deleteItem(id) {
    if (!confirm('確定刪除？')) return;
    window.showLoading(true);
    try {
        const result = await callAppsScript({ action: 'delete', id: id });
        if (result.success) {
            await loadDataFromSheet();
            window.showNotification('✅ 已刪除');
        }
    } finally {
        window.showLoading(false);
    }
}

async function updateShipment(id, value) {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;
    item.shipment = value;
    window.showLoading(true);
    try {
        const result = await callAppsScript({ action: 'update', item: JSON.stringify(item) });
        if (result.success) window.showNotification('✅ 狀態已更新');
    } finally {
        window.showLoading(false);
    }
}

// 7. UI 控制
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
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function toggleAddForm() {
    currentEditId = null;
    document.getElementById('editForm').reset();
    document.getElementById('editDate').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

function closeEditModal() {
    const m = document.getElementById('editModal');
    const instance = bootstrap.Modal.getInstance(m);
    if (instance) instance.hide();
}

// 8. 燈箱
let currentLightboxItemId = null;
let currentImageIndex = 0;
function openLightbox(itemId) {
    currentLightboxItemId = itemId;
    const item = shoppingList.find(i => i.id === itemId);
    const validImages = item.images.filter(img => img && img.trim());
    currentImageIndex = 0;
    showLightboxImage();
    document.getElementById('lightbox').classList.add('show');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('show'); }
function showLightboxImage() {
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    const validImages = item.images.filter(img => img && img.trim());
    document.getElementById('lightboxImage').src = validImages[currentImageIndex];
    document.getElementById('lightboxCounter').textContent = `${currentImageIndex + 1} / ${validImages.length}`;
}
function prevImage() { if (currentImageIndex > 0) { currentImageIndex--; showLightboxImage(); } }
function nextImage() { 
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    if (currentImageIndex < item.images.filter(img => img && img.trim()).length - 1) { currentImageIndex++; showLightboxImage(); }
}

// 9. 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromSheet();
    document.getElementById('editForm').addEventListener('submit', saveEdit);
});
