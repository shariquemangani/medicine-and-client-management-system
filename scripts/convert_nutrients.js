const fs = require('fs');
const path = require('path');
const readline = require('readline');

const csvFilePath = path.join(process.cwd(), 'docs', 'Conditions - Nutrients - Total Conditions.csv');
const jsonFilePath = path.join(process.cwd(), 'src', 'data', 'conditionNutrients.json');

const stream = fs.createReadStream(csvFilePath);
const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });

const data = {};

// Helper to split CSV line respecting quotes
function parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

// Clean up nutrient strings
function cleanNutrient(nut) {
    return nut.replace(/^"|"$/g, '').trim();
}

let isHeader = true;

reader.on('line', (line) => {
    if (isHeader) {
        isHeader = false;
        return;
    }
    
    if (!line.trim()) return;

    const cols = parseCSVLine(line);
    const condition = cols[0];
    
    // Safety check for empty rows or malformed lines
    if (!condition) return;

    // Col 1 is Increase, Col 2 is Decrease
    const increaseRaw = cols[1] || '';
    const decreaseRaw = cols[2] || '';

    // Split by comma, but some might be inside the quoted string which parseCSVLine handled for the column, 
    // but now we need to split the nutrient list itself. 
    // The CSV structure from view_file showed: "Vitamin B2, Vitamin B3..."
    // So we can just split by ','
    
    const increaseList = increaseRaw.split(',').map(n => cleanNutrient(n)).filter(n => n);
    const decreaseList = decreaseRaw.split(',').map(n => cleanNutrient(n)).filter(n => n);

    data[condition] = {
        increase: increaseList,
        decrease: decreaseList
    };
});

reader.on('close', () => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    console.log(`Generated ${jsonFilePath}`);
});
