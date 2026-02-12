// ===== 配置區域 =====
const SHEET_ID = '1Vv1NVFUnHMyu2998_kzMjiRAVaqW9WRgW7-EUAruRlE';
// 如果您的分頁名稱不是 Sheet1，請修改這裡
const SHEET_NAME = 'Sheet1';

function doGet(e) {
  const callback = e.parameter.callback;
  try {
    const action = e.parameter.action;
    let result;
    
    // 強制刷新試算表緩存
    SpreadsheetApp.flush();
    
    if (action === 'read') {
      result = readData();
    } else if (action === 'update') {
      const item = JSON.parse(e.parameter.item);
      result = updateItem(item);
    } else if (action === 'delete') {
      result = deleteItem(e.parameter.id);
    } else if (action === 'write') {
      const item = JSON.parse(e.parameter.item);
      result = addItem(item);
    } else {
      result = { success: false, message: '不明動作: ' + action };
    }
    
    return createResponse(result.success, result.message, result.data, callback);
  } catch (error) {
    return createResponse(false, 'GAS 執行錯誤: ' + error.toString(), null, callback);
  }
}

function readData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // 如果找不到 Sheet1，自動抓第一個分頁
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }

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
  return { success: true, message: '讀取成功', data: jsonData };
}

function updateItem(item) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  const id = parseInt(item.id);
  if (isNaN(id)) return { success: false, message: '無效的 ID: ' + item.id };
  
  const rowNum = id + 1; 
  const values = [[
    item.date, item.sequence, 
    item.images[0] || '', item.images[1] || '', item.images[2] || '',
    item.brand, 
    item.notes,
    item.shipment
  ]];
  sheet.getRange(rowNum, 1, 1, 8).setValues(values);
  SpreadsheetApp.flush(); // 寫入後立刻刷新
  return { success: true, message: '更新成功' };
}

function addItem(item) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  const values = [
    item.date, item.sequence, 
    item.images[0] || '', item.images[1] || '', item.images[2] || '',
    item.brand, 
    item.notes,
    item.shipment || '空白'
  ];
  sheet.appendRow(values);
  SpreadsheetApp.flush();
  return { success: true, message: '新增成功' };
}

function deleteItem(idStr) {
  const id = parseInt(idStr);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.deleteRow(id + 1);
  SpreadsheetApp.flush();
  return { success: true, message: '刪除成功' };
}

function createResponse(success, message, data, callback) {
  const response = { success: success, message: message, data: data };
  const json = JSON.stringify(response);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
