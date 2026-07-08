export interface MadrasaBlockSection {
  id: string
  label: string
  labelKey: string
}

export const MADRASA_BLOCK_SECTIONS: MadrasaBlockSection[] = [
  { id: 'block_a', label: 'Block A', labelKey: 'patients.blocks.blockA' },
  { id: 'block_b', label: 'Block B', labelKey: 'patients.blocks.blockB' },
  { id: 'block_c', label: 'Block C', labelKey: 'patients.blocks.blockC' },
  { id: 'section_1', label: 'Section 1', labelKey: 'patients.blocks.section1' },
  { id: 'section_2', label: 'Section 2', labelKey: 'patients.blocks.section2' },
  { id: 'hostel_north', label: 'Hostel North', labelKey: 'patients.blocks.hostelNorth' },
  { id: 'hostel_south', label: 'Hostel South', labelKey: 'patients.blocks.hostelSouth' },
]

export function getMadrasaBlockLabel(id: string): string | undefined {
  return MADRASA_BLOCK_SECTIONS.find((block) => block.id === id)?.label
}

export function isPresetMadrasaBlock(value: string): boolean {
  return MADRASA_BLOCK_SECTIONS.some((block) => block.id === value || block.label === value)
}
