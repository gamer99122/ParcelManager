// ===== 配置區域 =====
const SHEET_ID = '1Vv1NVFUnHMyu2998_kzMjiRAVaqW9WRgW7-EUAruRlE';
const SHEET_NAME = 'Sheet1';

// ===== 處理 GET 請求 (推薦用於避免 CORS 問題) =====
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'read') {
      return readData();
    } else if (action === 'update') {
      const item = JSON.parse(e.parameter.item);
      return updateItem(item);
    } else if (action === 'delete') {
      const id = e.parameter.id;
      return deleteItem(id);
    } else if (action === 'write') {
      const item = JSON.parse(e.parameter.item);
      return addItem(item);
    }
    
    return createResponse(false, '不明なアクション (GET)');
  } catch (error) {
    return createResponse(false, 'エラー: ' + error.toString());
  }
}

// ===== 處理 POST 請求 =====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'read') {
      return readData();
    } else if (action === 'update') {
      return updateItem(data.item);
    } else if (action === 'delete') {
      return deleteItem(data.id);
    } else if (action === 'write') {
      return addItem(data.item);
    }

    return createResponse(false, '不明なアクション (POST)');
  } catch (error) {
    return createResponse(false, 'エラー: ' + error.toString());
  }
}

// ===== 讀取資料 =====
function readData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const jsonData = rows.map((row, index) => {
      return {
        id: index + 1, // 這裡的 ID 對應資料列索引 (不含標題)
        date: row[0],
        sequence: row[1],
        images: [row[2], row[3], row[4]],
        brand: row[5],
        notes: row[6],
        shipment: row[7]
      };
    }).filter(item => item.date || item.sequence); // 過濾掉空行
    
    return createResponse(true, '成功讀取資料', jsonData);
  } catch (error) {
    return createResponse(false, '讀取錯誤: ' + error.toString());
  }
}

// ===== アイテムを更新 =====
function updateItem(item) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    // 假設 ID 是基於 1 的索引，對應資料列 (第1行是標題，所以 +1)
    const rowNum = parseInt(item.id) + 1; 

    if (isNaN(rowNum) || rowNum < 2) {
      return createResponse(false, '無效的 ID');
    }

    const values = [
      [
        item.date,
        item.sequence,
        item.images[0] || '',
        item.images[1] || '',
        item.images[2] || '',
        item.brand,
        item.notes,
        item.shipment
      ]
    ];

    sheet.getRange(rowNum, 1, 1, 8).setValues(values);

    return createResponse(true, 'アイテムが更新されました');
  } catch (error) {
    return createResponse(false, '更新エラー: ' + error.toString());
  }
}

// ===== 新增項目 =====
function addItem(item) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const values = [
      item.date,
      item.sequence,
      item.images[0] || '',
      item.images[1] || '',
      item.images[2] || '',
      item.brand,
      item.notes,
      item.shipment || '空白'
    ];
    
    sheet.appendRow(values);
    return createResponse(true, '項目已新增');
  } catch (error) {
    return createResponse(false, '新增錯誤: ' + error.toString());
  }
}

// ===== アイテムを削除 =====
function deleteItem(id) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rowNum = parseInt(id) + 1;

    if (isNaN(rowNum) || rowNum < 2) {
      return createResponse(false, '無效的 ID');
    }

    sheet.deleteRow(rowNum);
    return createResponse(true, 'アイテムが削除されました');
  } catch (error) {
    return createResponse(false, '削除エラー: ' + error.toString());
  }
}

// ===== 響應 JSON 格式 (解決 CORS 且符合 API 規範) =====
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    data: data
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}