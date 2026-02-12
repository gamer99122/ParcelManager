// ===== 配置區域 =====
const SHEET_ID = '1Vv1NVFUnHMyu2998_kzMjiRAVaqW9WRgW7-EUAruRlE';
const SHEET_NAME = 'Sheet1';

// ===== 主處理函數 =====
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'read') {
            return readData();
        } else if (action === 'write') {
            return writeData(data.items);
        } else if (action === 'update') {
            return updateItem(data.item);
        } else if (action === 'delete') {
            return deleteItem(data.id);
        }

        return createResponse(false, '不明なアクション');
    } catch (error) {
        Logger.log('エラー: ' + error);
        return createResponse(false, 'エラーが発生しました: ' + error.toString());
    }
}

// ===== GET リクエストも処理 =====
function doGet(e) {
    const action = e.parameter.action;

    if (action === 'read') {
        const result = readData();
        return HtmlService.createHtmlOutput(result.getContent())
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return HtmlService.createHtmlOutput(JSON.stringify({
        success: false,
        message: '不明なアクション'
    }));
}

// ===== データを読み込む =====
function readData() {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        const data = sheet.getDataRange().getValues();

        if (data.length <= 1) {
            return createResponse(true, '成功', []);
        }

        // ヘッダー行をスキップ
        const headers = data[0];
        const items = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // 空の行をスキップ
            if (!row[0] && !row[1]) continue;

            const item = {
                id: i,
                date: String(row[0] || ''),
                sequence: String(row[1] || ''),
                images: [
                    String(row[2] || ''),
                    String(row[3] || ''),
                    String(row[4] || '')
                ],
                brand: String(row[5] || ''),
                notes: String(row[6] || ''),
                shipment: String(row[7] || '空白')
            };

            items.push(item);
        }

        return createResponse(true, '成功', items);
    } catch (error) {
        Logger.log('読み込みエラー: ' + error);
        return createResponse(false, '読み込みエラー: ' + error.toString());
    }
}

// ===== データを書き込む（新規追加） =====
function writeData(items) {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        const existingData = sheet.getDataRange().getValues();
        const startRow = existingData.length + 1;

        const rows = items.map(item => [
            item.date,
            item.sequence,
            item.images[0] || '',
            item.images[1] || '',
            item.images[2] || '',
            item.brand,
            item.notes,
            item.shipment
        ]);

        if (rows.length > 0) {
            sheet.getRange(startRow, 1, rows.length, 8).setValues(rows);
        }

        return createResponse(true, 'アイテムが追加されました');
    } catch (error) {
        Logger.log('書き込みエラー: ' + error);
        return createResponse(false, '書き込みエラー: ' + error.toString());
    }
}

// ===== アイテムを更新 =====
function updateItem(item) {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        const rowNum = item.id + 1;

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
        Logger.log('更新エラー: ' + error);
        return createResponse(false, '更新エラー: ' + error.toString());
    }
}

// ===== アイテムを削除 =====
function deleteItem(id) {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        const rowNum = id + 1;

        sheet.deleteRow(rowNum);

        return createResponse(true, 'アイテムが削除されました');
    } catch (error) {
        Logger.log('削除エラー: ' + error);
        return createResponse(false, '削除エラー: ' + error.toString());
    }
}

// ===== 応答を作成 =====
function createResponse(success, message, data = null) {
    const response = {
        success: success,
        message: message
    };

    if (data !== null) {
        response.data = data;
    }

    const output = ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);

    return output;
}

// ===== テスト関数 =====
function testRead() {
    const result = readData();
    Logger.log(result.getContent());
}
