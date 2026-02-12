// ===== 配置區域 =====
const SHEET_ID = '1Vv1NVFUnHMyu2998_kzMjiRAVaqW9WRgW7-EUAruRlE';
const SHEET_NAME = 'Sheet1';

// ===== 處理 GET 請求 (使用 JSONP 避免 CORS 問題) =====
function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback; // JSONP 回呼函數名稱
    
    let result;
    if (action === 'read') {
      result = readData();
    } else if (action === 'update') {
      const item = JSON.parse(e.parameter.item);
      result = updateItem(item);
    } else if (action === 'delete') {
      const id = e.parameter.id;
      result = deleteItem(id);
    } else if (action === 'write') {
      const item = JSON.parse(e.parameter.item);
      result = addItem(item);
    } else {
      result = { success: false, message: '不明なアクション' };
    }
    
    return createResponse(result.success, result.message, result.data, callback);
  } catch (error) {
    return createResponse(false, 'エラー: ' + error.toString(), null, e.parameter.callback);
  }
}

// ===== 讀取資料 =====
function readData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);
    const jsonData = rows.map((row, index) => ({
      id: index + 1,
      date: row[0],
      sequence: row[1],
      images: [row[2], row[3], row[4]],
      brand: row[5],
      notes: row[6],
      shipment: row[7]
    })).filter(item => item.date || item.sequence);
    return { success: true, message: '成功', data: jsonData };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 更新項目 =====
function updateItem(item) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rowNum = parseInt(item.id) + 1; 
    const values = [[
      item.date, item.sequence, 
      item.images[0] || '', item.images[1] || '', item.images[2] || '',
      item.brand, item.notes, item.shipment
    ]];
    sheet.getRange(rowNum, 1, 1, 8).setValues(values);
    return { success: true, message: '更新成功' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 新增項目 =====
function addItem(item) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const values = [
      item.date, item.sequence, 
      item.images[0] || '', item.images[1] || '', item.images[2] || '',
      item.brand, item.notes, item.shipment || '空白'
    ];
    sheet.appendRow(values);
    return { success: true, message: '新增成功' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 刪除項目 =====
function deleteItem(id) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rowNum = parseInt(id) + 1;
    sheet.deleteRow(rowNum);
    return { success: true, message: '刪除成功' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ===== 響應 JSONP 格式 (解決所有 CORS 問題) =====
function createResponse(success, message, data = null, callback = null) {
  const response = { success: success, message: message, data: data };
  const json = JSON.stringify(response);
  
  if (callback) {
    // 如果有 callback，回傳 JavaScript 函數調用 (JSONP)
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 否則回傳標準 JSON
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
