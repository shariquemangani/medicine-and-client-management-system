import fs from 'fs';

const json = JSON.parse(
  fs.readFileSync('src/data/micronutrients.json', 'utf8')
);

const labelEntries = json.nutrients
  .map(n => `  ${n.key}: '${n.label.replace(/'/g, "\\'")}',`)
  .join('\n');
const headerEntries = json.nutrients
  .map(n => `  ${n.key}: '${n.header.replace(/'/g, "\\'")}',`)
  .join('\n');
const unitEntries = json.nutrients
  .map(n => `  ${n.key}: '${n.unit}',`)
  .join('\n');
const keys = json.nutrients.map(n => n.key);
const keyUnion = keys.map(k => `'${k}'`).join(' | ');

const formatVal = v => (v === null ? 'null' : v);

const rows = json.rows
  .map(row => {
    const nutrientLines = keys
      .map(k => `    ${k}: ${formatVal(row[k])},`)
      .join('\n');
    const ageGroup =
      row.ageGroup === null
        ? 'null'
        : `'${row.ageGroup.replace(/'/g, "\\'")}'`;
    return `  {
    category: '${row.category.replace(/'/g, "\\'")}',
    ageGroup: ${ageGroup},
    activityLevel: '${row.activityLevel.replace(/'/g, "\\'")}',
${nutrientLines}
  },`;
  })
  .join('\n');

const ts = `// Label mapping for display purposes
export const micronutrientRowLabels: Record<string, string> = {
  category: 'Category',
  ageGroup: 'Age group',
  activityLevel: 'Physical activity level',
}

export type MicronutrientKey = ${keyUnion}

export const micronutrientLabels: Record<MicronutrientKey, string> = {
${labelEntries}
}

export const micronutrientHeaders: Record<MicronutrientKey, string> = {
${headerEntries}
}

export const micronutrientUnits: Record<MicronutrientKey, string> = {
${unitEntries}
}

export interface MicronutrientRow {
  category: string
  ageGroup: string | null
  activityLevel: string
${keys.map(k => `  ${k}: number | null`).join('\n')}
}

export const micronutrientsData: MicronutrientRow[] = [
${rows}
]
`;

fs.writeFileSync('src/data/micronutrients.ts', ts);
console.log('Written src/data/micronutrients.ts');
