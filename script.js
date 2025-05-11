// 藥物資料
const MEDICATIONS = {
    "Levophed": { dose_mg: 2000, volume_ml: 500 },
    "Dopamine": { dose_mg: 400, volume_ml: 400 }
};

// DOM 元素引用
const doseMgInput = document.getElementById('doseMgInput');
const volumeMlInput = document.getElementById('volumeMlInput');
const weightKgInput = document.getElementById('weightKgInput');
const resultAInput = document.getElementById('resultAInput');
const resultBInput = document.getElementById('resultBInput');
const resultCInput = document.getElementById('resultCInput');
const errorMessageDiv = document.getElementById('errorMessage');

const levophedBtn = document.getElementById('levophedBtn');
const dopamineBtn = document.getElementById('dopamineBtn');

// 狀態變數
let activeInputType = null; // 'A', 'B', 'C'
let currentDoseMg = 0.0;
let currentVolumeMl = 0.0;
let currentWeightKg = 0.0;

// 獲取數值，如果轉換失敗則返回 0
function safeGetNumber(element) {
    const value = parseFloat(element.value);
    return isNaN(value) ? 0 : value;
}

// 四捨五入到兩位小數
function roundToTwoDecimals(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
}

// 更新所有相關數值
function updateAll() {
    errorMessageDiv.textContent = ''; // 清除之前的錯誤訊息

    currentDoseMg = safeGetNumber(doseMgInput);
    currentVolumeMl = safeGetNumber(volumeMlInput);
    currentWeightKg = safeGetNumber(weightKgInput);

    // 檢查基本輸入的有效性
    if (currentDoseMg <= 0 || currentVolumeMl <= 0 || currentWeightKg <= 0) {
        if (currentDoseMg === 0 && currentVolumeMl === 0 && currentWeightKg === 0) {
            resultAInput.value = '';
            resultBInput.value = '';
            resultCInput.value = '';
        } else {
            errorMessageDiv.textContent = "錯誤: 劑量、稀釋體積和體重必須大於零。";
            resultAInput.value = '';
            resultBInput.value = '';
            resultCInput.value = '';
        }
        return;
    }

    const concentrationMgPerMl = currentDoseMg / currentVolumeMl;

    let numA_ug_kg_min = safeGetNumber(resultAInput);
    let numB_mg_hour = safeGetNumber(resultBInput);
    let numC_ml_hour = safeGetNumber(resultCInput);

    try {
        if (activeInputType === 'A') {
            // 如果是從 A 輸入，則計算 B 和 C
            numA_ug_kg_min = safeGetNumber(resultAInput);
            if (numA_ug_kg_min === 0 && resultAInput.value !== '') { // 處理用戶清空輸入框
                numB_mg_hour = 0;
                numC_ml_hour = 0;
            } else {
                numB_mg_hour = (numA_ug_kg_min * currentWeightKg * 60) / 1000;
                if (concentrationMgPerMl === 0) {
                    throw new Error("濃度為零 (劑量或體積為零)。");
                }
                numC_ml_hour = numB_mg_hour / concentrationMgPerMl;
            }
        } else if (activeInputType === 'B') {
            // 如果是從 B 輸入，則計算 A 和 C
            numB_mg_hour = safeGetNumber(resultBInput);
            if (numB_mg_hour === 0 && resultBInput.value !== '') {
                numA_ug_kg_min = 0;
                numC_ml_hour = 0;
            } else {
                numA_ug_kg_min = (numB_mg_hour * 1000) / (currentWeightKg * 60);
                if (concentrationMgPerMl === 0) {
                    throw new Error("濃度為零 (劑量或體積為零)。");
                }
                numC_ml_hour = numB_mg_hour / concentrationMgPerMl;
            }
        } else if (activeInputType === 'C') {
            // 如果是從 C 輸入，則計算 A 和 B
            numC_ml_hour = safeGetNumber(resultCInput);
            if (numC_ml_hour === 0 && resultCInput.value !== '') {
                numA_ug_kg_min = 0;
                numB_mg_hour = 0;
            } else {
                if (concentrationMgPerMl === 0) {
                    throw new Error("濃度為零 (劑量或體積為零)。");
                }
                numB_mg_hour = numC_ml_hour * concentrationMgPerMl;
                numA_ug_kg_min = (numB_mg_hour * 1000) / (currentWeightKg * 60);
            }
        }
        // 否則 (activeInputType 為 null)，表示劑量/體積/體重改變，應基於它們重新計算
        // 通常情況下，這裡我們不會設定 activeInputType，所以會是通用的更新
        // 保持與Python版本一致，當非結果區輸入改變時，結果區的值會更新
        // 如果結果區輸入為 0，則可以清空
        if (activeInputType === null && (numA_ug_kg_min === 0 && numB_mg_hour === 0 && numC_ml_hour === 0)) {
             // 如果所有結果區都是 0，並且沒有活動輸入框，則保持空白
             resultAInput.value = '';
             resultBInput.value = '';
             resultCInput.value = '';
             return;
        }


        resultAInput.value = roundToTwoDecimals(numA_ug_kg_min);
        resultBInput.value = roundToTwoDecimals(numB_mg_hour);
        resultCInput.value = roundToTwoDecimals(numC_ml_hour);

    } catch (error) {
        errorMessageDiv.textContent = `錯誤: ${error.message}`;
        resultAInput.value = '';
        resultBInput.value = '';
        resultCInput.value = '';
    }
}

// 增加/減少按鈕的通用邏輯
function handleIncrementDecrement(event) {
    const targetId = event.target.dataset.target;
    const targetInput = document.getElementById(targetId);
    let value = safeGetNumber(targetInput);

    if (event.target.textContent === '+') {
        value += 1;
    } else {
        value = Math.max(0, value - 1);
    }
    targetInput.value = value;
    updateAll();
}

// 設置活動輸入類型，並觸發更新
function setActiveInputType(type) {
    activeInputType = type;
    updateAll();
}

// 選擇藥物
function selectMedication(medName) {
    if (MEDICATIONS[medName]) {
        doseMgInput.value = MEDICATIONS[medName].dose_mg;
        volumeMlInput.value = MEDICATIONS[medName].volume_ml;
        activeInputType = null; // 重置活動輸入類型
        updateAll(); // 選擇藥物後觸發更新
    }
}

// 事件監聽器綁定
document.addEventListener('DOMContentLoaded', () => {
    // 綁定加減按鈕
    document.querySelectorAll('.increment-btn, .decrement-btn').forEach(button => {
        button.addEventListener('click', handleIncrementDecrement);
    });

    // 綁定選擇藥物按鈕
    levophedBtn.addEventListener('click', () => selectMedication('Levophed'));
    dopamineBtn.addEventListener('click', () => selectMedication('Dopamine'));

    // 綁定劑量和稀釋體積輸入框的 change 事件
    doseMgInput.addEventListener('input', updateAll);
    volumeMlInput.addEventListener('input', updateAll);

    // 綁定體重輸入框的 Enter 鍵事件
    weightKgInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            activeInputType = null; // 體重改變後，清空活動輸入類型
            updateAll();
        }
    });

    // 綁定結果輸入框的 input 事件，並設置活動輸入類型
    resultAInput.addEventListener('input', () => setActiveInputType('A'));
    resultBInput.addEventListener('input', () => setActiveInputType('B'));
    resultCInput.addEventListener('input', () => setActiveInputType('C'));

    // 頁面載入時先執行一次更新，以顯示初始值
    updateAll();
});