const fs = require('fs');

const csvPath = '/Users/sharique/Downloads/fam-gen-portal-web-app/docs/Meal Plan - Composition rules.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n');
const headers = lines[0].split(',');

const results = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parser for this specific file structure
    // Columns: ,Platter ID,Cuisine Type,Platter Name,Dietary ,Composition
    const parts = line.split(',');
    
    // The first part is empty because of the leading comma in the CSV
    const platterId = parts[1];
    const cuisineType = parts[2];
    const platterName = parts[3];
    const dietary = parts[4];
    const composition = parts[5];
    
    let region = '';
    let mealSlot = '';
    
    if (cuisineType.startsWith('South Indian')) {
        region = 'South Indian';
        mealSlot = cuisineType.replace('South Indian ', '');
    } else if (cuisineType.startsWith('North Indian')) {
        region = 'North Indian';
        mealSlot = cuisineType.replace('North Indian ', '');
    }
    
    // Normalize mealSlot to match mealSlotOptions
    // mealSlotOptions = ["Early morning", "Breakfast", "Midmorning", "Lunch", "Snacks", "Dinner", "Post dinner"]
    const slotMap = {
        'Early Morning': 'Early morning',
        'Mid Morning': 'Midmorning',
        'Evening Snack': 'Snacks',
        'Post Dinner': 'Post dinner',
        'Breakfast': 'Breakfast',
        'Lunch': 'Lunch',
        'Dinner': 'Dinner'
    };
    
    mealSlot = slotMap[mealSlot] || mealSlot;

    results.push({
        id: platterId,
        name: platterName,
        dietary: dietary,
        composition: composition,
        region: region,
        mealSlot: mealSlot
    });
}

const output = `export interface Platter {
    id: string;
    name: string;
    dietary: string;
    composition: string;
    region: 'North Indian' | 'South Indian';
    mealSlot: string;
}

export const mealCompositionData: Platter[] = ${JSON.stringify(results, null, 4)};
`;

fs.writeFileSync('/Users/sharique/Downloads/fam-gen-portal-web-app/src/data/mealComposition.ts', output);
console.log('Conversion complete!');
