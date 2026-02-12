// ===== 配置區域 =====
const SHEET_ID = '1Vv1NVFUnHMyu2998_kzMjiRAVaqW9WRgW7-EUAruRlE';
const SHEET_NAME = 'Sheet1';

// ===== 主處理函數 =====
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'update') {
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
    return HtmlService.createHtmlOutput('<h1>ParcelManager API</h1><p>POST requests only</p>')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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

    // 使用 HtmlService 來返回 JSON，有時可以繞過 CORS
    return HtmlService.createHtmlOutput(JSON.stringify(response))
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
