// ===== API 設定 =====
const SHEET2API_URL = 'https://sheet2api.com/v1/0xbsaNcnQDyd/%25E5%258C%2585%25E8%25A3%25B9%25E6%25B8%2585%25E5%2596%25AE';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_DRbehgkkpLHZw0kFIVNafkbSJQTynYfkWATSKlYyHnFKPfGjwf57VLvkbR9ltp1o/exec';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// ===== 從 Google Sheet 讀取資料 =====
async function loadDataFromSheet() {
    try {
        console.log('正在從 Google Sheet 讀取資料 (JSONP 即時模式)...');

        // 使用 JSONP 直接從 Apps Script 讀取，避開 Sheet2API 的快取問題
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
            
            console.log(`成功讀取 ${shoppingList.length} 個項目`);
            renderPage();
            showNotification('✅ 資料已成功同步 (最新版本)');
        } else {
            throw new Error(result.message || '讀取失敗');
        }
    } catch (error) {
        console.error('讀取錯誤:', error);
        
        // 只有在 JSONP 失敗時，才嘗試使用 Sheet2API 作為備援
        console.warn('JSONP 讀取失敗，嘗試備援方案 (Sheet2API)...');
        try {
            const response = await fetch(SHEET2API_URL);
            const data = await response.json();
            if (data && Array.isArray(data)) {
                shoppingList = data.map((row, index) => ({
                    id: index + 1,
                    date: String(row['收件日期'] || row['日期'] || ''),
                    sequence: String(row['序號'] || ''),
                    images: [String(row['圖片1'] || ''), String(row['圖片2'] || ''), String(row['圖片3'] || '')],
                    brand: String(row['商家'] || row['品牌'] || ''),
                    notes: String(row['備註'] || ''),
                    shipment: String(row['寄送狀態'] || '空白')
                }));
                renderPage();
            }
        } catch (backupError) {
            showNotification('❌ 無法連接到資料庫');
        }
    }
}

// ===== 通用的 Apps Script 請求函數 (使用 JSONP) =====
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
        // 加入時間戳記防止快取 (Cache Buster)
        params._t = new Date().getTime();
        
        const queryString = new URLSearchParams(params).toString();
        // 確保網址前後沒有空白
        const baseUrl = GOOGLE_APPS_SCRIPT_URL.trim();
        const url = `${baseUrl}?${queryString}`;

        console.log('--- JSONP 除錯資訊 ---');
        console.log('請求動作:', params.action);
        console.log('完整請求網址 (請點擊測試):', url);
        console.log('----------------------');

        const script = document.createElement('script');
        script.id = callbackName;
        script.src = url;
        script.onerror = () => {
            delete window[callbackName];
            const scriptTag = document.getElementById(callbackName);
            if (scriptTag) document.body.removeChild(scriptTag);
            reject(new Error(`連線到 Google Script 失敗。\n請點擊 Console 中的網址檢查是否能開啟。\n網址: ${url}`));
        };
        document.body.appendChild(script);

        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                const scriptTag = document.getElementById(callbackName);
                if (scriptTag) document.body.removeChild(scriptTag);
                reject(new Error('請求逾時 (15秒)，請確認 Apps Script 是否已發布為「任何人」均可存取。'));
            }
        }, 15000);
    });
}

// ===== 更新項目到 Google Sheet =====
async function updateItemToSheet(item) {
    try {
        console.log('正在透過 JSONP 更新項目...');
        const result = await callAppsScript({
            action: 'update',
            item: JSON.stringify({
                id: item.id,
                date: item.date,
                sequence: item.sequence,
                images: item.images,
                brand: item.brand,
                notes: item.notes,
                shipment: item.shipment
            })
        });

        if (result.success) {
            showNotification('✅ 項目已保存到 Google Sheet');
            return true;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('更新錯誤:', error);
        showNotification('❌ 更新失敗: ' + error.message);
        return false;
    }
}

// ===== 保存新項目到 Google Sheet =====
async function addItemToSheet(item) {
    try {
        console.log('正在透過 JSONP 新增項目...');
        const result = await callAppsScript({
            action: 'write',
            item: JSON.stringify(item)
        });

        if (result.success) {
            await loadDataFromSheet();
            return true;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('新增錯誤:', error);
        showNotification('❌ 保存失敗: ' + error.message);
        return false;
    }
}

// ===== 刪除項目 =====
async function deleteItemFromSheet(id) {
    try {
        console.log('正在透過 JSONP 刪除項目...');
        const result = await callAppsScript({
            action: 'delete',
            id: id
        });

        if (result.success) {
            await loadDataFromSheet();
            showNotification('✅ 項目已從 Google Sheet 刪除');
            return true;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('刪除錯誤:', error);
        showNotification('❌ 刪除失敗: ' + error.message);
        return false;
    }
}

// 模擬資料 (初始版本)
let shoppingList = [
    {
        id: 1,
        date: '20250914',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白',
        shipment: '空白'
    },
    {
        id: 2,
        date: '20251124',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 3,
        date: '20251124',
        sequence: '2',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 4,
        date: '20251124',
        sequence: '3',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 5,
        date: '20251220',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 6,
        date: '20251223',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 7,
        date: '20251223',
        sequence: '2',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 8,
        date: '20260107',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 9,
        date: '20260108',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 10,
        date: '20260112',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 11,
        date: '20260122',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 12,
        date: '20260129',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    },
    {
        id: 13,
        date: '20260202',
        sequence: '1',
        images: ['', '', ''],
        brand: '',
        notes: '',
        shipment: '空白'
    }
];

// 多語言配置
const translations = {
    'zh-TW': {
        title: '📦 想要這次寄送的包裹清單',
        subtitle: '幫我編輯備註要寄送的商品以及部分寄送的商品',
        addButton: '新增項目',
        editButton: '編輯',
        deleteButton: '刪除',
        saveButton: '儲存',
        cancelButton: '取消',
        colDate: '收件日期',
        colSequence: '序號',
        colImage: '圖片',
        colBrand: '商家',
        colNotes: '備註',
        colShipment: '寄送狀態',
        colActions: '操作',
        formTitle: '編輯購物項目',
        labelDate: '收件日期',
        labelSequence: '序號',
        labelImage: '商品圖片 (最多 3 張，圖片網址)',
        labelBrand: '商家',
        labelNotes: '備註',
        labelShipment: '寄送狀態',
        placeholderImage1: '圖片 1：https://example.com/image1.jpg',
        placeholderImage2: '圖片 2：https://example.com/image2.jpg',
        placeholderImage3: '圖片 3：https://example.com/image3.jpg',
        placeholderBrand: '輸入品牌名稱',
        placeholderNotes: '輸入備註說明',
        shipmentBlank: '空白',
        shipmentNoSend: '不寄送',
        shipmentSend: '寄送',
        shipmentPartial: '部分寄送',
        total: '總共',
        items: '項商品',
        deleteConfirm: '確定要刪除此項目嗎？',
        deleteSuccess: '✅ 項目已刪除成功！',
        editSuccess: '✅ 項目已更新成功！',
        shipmentSuccess: '✅ 寄送狀態已更新！',
        noImage: '無圖片',
        noData: '尚無購物項目'
    },
    'ja-JP': {
        title: '📦 このお届けの配送リスト',
        subtitle: '送信する商品と部分的に送信する商品について編集してください',
        addButton: 'アイテム追加',
        editButton: '編集',
        deleteButton: '削除',
        saveButton: '保存',
        cancelButton: 'キャンセル',
        colDate: '受取日',
        colSequence: 'シーケンス',
        colImage: '画像',
        colBrand: '販売者',
        colNotes: '備考',
        colShipment: '配送ステータス',
        colActions: '操作',
        formTitle: '買い物アイテムの編集',
        labelDate: '受取日',
        labelSequence: 'シーケンス',
        labelImage: '商品画像 (最大3枚、画像URL)',
        labelBrand: '販売者',
        labelNotes: '備考',
        labelShipment: '配送ステータス',
        placeholderImage1: '画像 1：https://example.com/image1.jpg',
        placeholderImage2: '画像 2：https://example.com/image2.jpg',
        placeholderImage3: '画像 3：https://example.com/image3.jpg',
        placeholderBrand: 'ブランド名を入力してください',
        placeholderNotes: '備考を入力してください',
        shipmentBlank: '空白',
        shipmentNoSend: '送信しない',
        shipmentSend: '送信',
        shipmentPartial: '部分配送',
        total: '合計',
        items: '項目',
        deleteConfirm: 'このアイテムを削除してもよろしいですか？',
        deleteSuccess: '✅ アイテムが正常に削除されました！',
        editSuccess: '✅ アイテムが正常に更新されました！',
        shipmentSuccess: '✅ 配送ステータスが更新されました！',
        noImage: '画像なし',
        noData: '買い物アイテムはありません'
    }
};

// 現在の言語設定
let currentLanguage = localStorage.getItem('language') || 'zh-TW';

// 翻訳を取得する関数
function t(key) {
    return translations[currentLanguage]?.[key] || translations['zh-TW'][key] || key;
}

// 言語を切り替える関数
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    // 更新語言按鈕的活躍狀態
    const btnChinese = document.getElementById('btnChinese');
    const btnJapanese = document.getElementById('btnJapanese');

    if (lang === 'zh-TW') {
        btnChinese.className = 'btn btn-sm btn-light';
        btnJapanese.className = 'btn btn-sm btn-outline-light';
        btnChinese.style.fontWeight = '600';
        btnJapanese.style.fontWeight = '400';
    } else {
        btnChinese.className = 'btn btn-sm btn-outline-light';
        btnJapanese.className = 'btn btn-sm btn-light';
        btnChinese.style.fontWeight = '400';
        btnJapanese.style.fontWeight = '600';
    }

    renderPage();
}

// 儲存當前編輯的項目 ID
let currentEditId = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化語言按鈕狀態
    if (currentLanguage === 'ja-JP') {
        switchLanguage('ja-JP');
    }
    // 從 Google Sheet 讀取資料
    loadDataFromSheet();
    setupModalClosing();
});

// 渲染整個頁面（包括語言更新）
function renderPage() {
    updatePageText();
    renderTable();
}

// 設定模態框外側點擊關閉
function setupModalClosing() {
    // Bootstrap 模態框已內建此功能
}

// 更新頁面文本
function updatePageText() {
    // 標題
    document.querySelector('h1').textContent = t('title');
    document.querySelector('.lead').textContent = t('subtitle');

    // 按鈕
    document.querySelector('button.btn-primary').textContent = t('addButton');

    // 表格表頭
    const thElements = document.querySelectorAll('thead th');
    if (thElements.length > 0) {
        thElements[0].textContent = t('colDate');
        thElements[1].textContent = t('colSequence');
        thElements[2].textContent = t('colImage');
        thElements[3].textContent = t('colBrand');
        thElements[4].textContent = t('colShipment');
        thElements[5].textContent = t('colNotes');
        thElements[6].textContent = t('colActions');
    }

    // 模態框
    document.querySelector('.modal-title').textContent = t('formTitle');

    // 表單標籤
    const labels = document.querySelectorAll('.modal-body .form-label');
    if (labels.length > 0) {
        labels[0].textContent = t('labelDate');
        labels[1].textContent = t('labelSequence');
        labels[2].textContent = t('labelImage');
        labels[3].textContent = t('labelBrand');
        labels[4].textContent = t('labelNotes');
        labels[5].textContent = t('labelShipment');
    }

    // 表單輸入框 placeholder
    document.getElementById('editImage1').placeholder = t('placeholderImage1');
    document.getElementById('editImage2').placeholder = t('placeholderImage2');
    document.getElementById('editImage3').placeholder = t('placeholderImage3');
    document.getElementById('editBrand').placeholder = t('placeholderBrand');
    document.getElementById('editNotes').placeholder = t('placeholderNotes');

    // 下拉選項
    const shipmentSelects = document.querySelectorAll('select');
    shipmentSelects.forEach(select => {
        if (select.id === 'editShipment' || select.classList.contains('shipment-select')) {
            const options = select.querySelectorAll('option');
            if (options.length >= 4) {
                options[0].textContent = t('shipmentBlank');
                options[1].textContent = t('shipmentNoSend');
                options[2].textContent = t('shipmentSend');
                options[3].textContent = t('shipmentPartial');
            }
        }
    });

    // 按鈕文本
    const buttons = document.querySelectorAll('.modal-body button');
    buttons.forEach(btn => {
        if (btn.textContent.includes('取消') || btn.textContent.includes('キャンセル')) {
            btn.textContent = t('cancelButton');
        } else if (btn.textContent.includes('儲存') || btn.textContent.includes('保存')) {
            btn.textContent = t('saveButton');
        }
    });
}

// 格式化日期為顯示格式 (支持多種輸入格式 -> YYYY-MM-DD)
function formatDate(dateString) {
    if (!dateString) return '';

    dateString = String(dateString).trim();

    // 如果已經是 YYYY-MM-DD 格式，直接返回
    if (dateString.includes('-') && dateString.length === 10) {
        return dateString;
    }

    // 如果是 YYYY/MM/DD 格式，轉換為 YYYY-MM-DD
    if (dateString.includes('/') && dateString.length === 10) {
        return dateString.replace(/\//g, '-');
    }

    // 如果是 YYYYMMDD 格式
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        return dateString.slice(0, 4) + '-' + dateString.slice(4, 6) + '-' + dateString.slice(6, 8);
    }

    // 嘗試解析為日期對象
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        // 繼續嘗試其他格式
    }

    return dateString;
}

// 解析日期 (YYYY-MM-DD -> YYYYMMDD)
function parseDate(dateString) {
    return dateString.replace(/-/g, '');
}

// 渲染表格
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const itemCount = document.getElementById('itemCount');

    if (shoppingList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><p>${t('noData')}</p></td></tr>`;
        itemCount.textContent = '0';
        return;
    }

    // 按日期排序（從小到大）
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
                        <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">編輯</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">刪除</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    itemCount.textContent = shoppingList.length;
}

// 切換新增表單
function toggleAddForm() {
    currentEditId = null;
    document.getElementById('editForm').reset();
    
    // 設定預設日期為今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editDate').value = today;
    document.getElementById('editSequence').value = "1";
    document.getElementById('editShipment').value = "空白";

    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// 編輯項目
function editItem(id) {
    currentEditId = id;
    const item = shoppingList.find(i => i.id === id);

    if (!item) return;

    // 填充表單
    document.getElementById('editDate').value = formatDate(item.date);
    document.getElementById('editSequence').value = item.sequence;
    document.getElementById('editImage1').value = item.images[0] || '';
    document.getElementById('editImage2').value = item.images[1] || '';
    document.getElementById('editImage3').value = item.images[2] || '';
    document.getElementById('editBrand').value = item.brand || '';
    document.getElementById('editNotes').value = item.notes || '';
    document.getElementById('editShipment').value = item.shipment || '空白';

    // 顯示模態框
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// 關閉編輯模態框
function closeEditModal() {
    const modalElement = document.getElementById('editModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    currentEditId = null;
    document.getElementById('editForm').reset();
}

// 儲存編輯或新增
async function saveEdit(event) {
    event.preventDefault();

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

    let success = false;
    if (currentEditId !== null) {
        // 更新現有項目
        itemData.id = currentEditId;
        success = await updateItemToSheet(itemData);
    } else {
        // 新增項目
        success = await addItemToSheet(itemData);
    }

    if (success) {
        await loadDataFromSheet(); // 重新讀取以確保資料一致性
        closeEditModal();
        showNotification(currentEditId !== null ? t('editSuccess') : '✅ 項目已新增成功');
    }
}

// 顯示通知
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
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 3 秒後移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 刪除項目
async function deleteItem(id) {
    if (confirm(t('deleteConfirm'))) {
        const success = await deleteItemFromSheet(id);
        if (success) {
            showNotification(t('deleteSuccess'));
        }
    }
}

// 更新寄送狀態
async function updateShipment(id, value) {
    const item = shoppingList.find(i => i.id === id);
    if (item) {
        item.shipment = value;
        await updateItemToSheet(item);
        showNotification(t('shipmentSuccess'));
    }
}

// 燈箱相關
let currentLightboxItemId = null;
let currentImageIndex = 0;

// 打開燈箱
function openLightbox(itemId) {
    currentLightboxItemId = itemId;
    const item = shoppingList.find(i => i.id === itemId);
    if (!item) return;

    const validImages = item.images.filter(img => img && img.trim());
    if (validImages.length === 0) return;

    currentImageIndex = 0;
    showLightboxImage();

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('show');
}

// 關閉燈箱
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('show');
    currentLightboxItemId = null;
}

// 顯示燈箱圖片
function showLightboxImage() {
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    if (!item) return;

    const validImages = item.images.filter(img => img && img.trim());
    if (validImages.length === 0) return;

    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');

    lightboxImg.src = validImages[currentImageIndex];
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${validImages.length}`;

    // 更新按鈕狀態
    document.getElementById('prevBtn').style.display = currentImageIndex === 0 ? 'none' : 'block';
    document.getElementById('nextBtn').style.display = currentImageIndex === validImages.length - 1 ? 'none' : 'block';
}

// 上一張圖片
function prevImage() {
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    if (!item) return;

    const validImages = item.images.filter(img => img && img.trim());
    if (currentImageIndex > 0) {
        currentImageIndex--;
        showLightboxImage();
    }
}

// 下一張圖片
function nextImage() {
    const item = shoppingList.find(i => i.id === currentLightboxItemId);
    if (!item) return;

    const validImages = item.images.filter(img => img && img.trim());
    if (currentImageIndex < validImages.length - 1) {
        currentImageIndex++;
        showLightboxImage();
    }
}
