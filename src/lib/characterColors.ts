export interface CharColor {
  idle: { background: string; color: string }
  active: { background: string; color: string }
}

export interface PaletteEntry {
  key: string
  label: string
  swatch: string
  color: CharColor
}

export const MONOCHROME: CharColor = {
  idle:   { background: '#27272a', color: '#a1a1aa' },
  active: { background: '#f4f4f5', color: '#18181b' },
}

export const COLOR_PALETTE: PaletteEntry[] = [
  { key: 'red',     label: 'Red',     swatch: '#f87171', color: { idle: { background: '#450a0a', color: '#fca5a5' }, active: { background: '#fee2e2', color: '#7f1d1d' } } },
  { key: 'rose',    label: 'Rose',    swatch: '#fb7185', color: { idle: { background: '#4c0519', color: '#fda4af' }, active: { background: '#ffe4e6', color: '#881337' } } },
  { key: 'pink',    label: 'Pink',    swatch: '#f472b6', color: { idle: { background: '#500724', color: '#f9a8d4' }, active: { background: '#fce7f3', color: '#831843' } } },
  { key: 'fuchsia', label: 'Fuchsia', swatch: '#e879f9', color: { idle: { background: '#4a044e', color: '#f0abfc' }, active: { background: '#fae8ff', color: '#701a75' } } },
  { key: 'violet',  label: 'Violet',  swatch: '#a78bfa', color: { idle: { background: '#2e1065', color: '#c4b5fd' }, active: { background: '#ede9fe', color: '#3b0764' } } },
  { key: 'indigo',  label: 'Indigo',  swatch: '#818cf8', color: { idle: { background: '#1e1b4b', color: '#a5b4fc' }, active: { background: '#e0e7ff', color: '#312e81' } } },
  { key: 'blue',    label: 'Blue',    swatch: '#60a5fa', color: { idle: { background: '#172554', color: '#93c5fd' }, active: { background: '#dbeafe', color: '#1e3a8a' } } },
  { key: 'sky',     label: 'Sky',     swatch: '#38bdf8', color: { idle: { background: '#082f49', color: '#7dd3fc' }, active: { background: '#e0f2fe', color: '#0c4a6e' } } },
  { key: 'teal',    label: 'Teal',    swatch: '#2dd4bf', color: { idle: { background: '#042f2e', color: '#5eead4' }, active: { background: '#ccfbf1', color: '#134e4a' } } },
  { key: 'emerald', label: 'Emerald', swatch: '#34d399', color: { idle: { background: '#022c22', color: '#6ee7b7' }, active: { background: '#d1fae5', color: '#064e3b' } } },
  { key: 'lime',    label: 'Lime',    swatch: '#a3e635', color: { idle: { background: '#1a2e05', color: '#bef264' }, active: { background: '#ecfccb', color: '#365314' } } },
  { key: 'orange',  label: 'Orange',  swatch: '#fb923c', color: { idle: { background: '#431407', color: '#fdba74' }, active: { background: '#ffedd5', color: '#7c2d12' } } },
]

export function resolveCharColor(colorKey: string | undefined | null): CharColor {
  if (!colorKey) return MONOCHROME
  return COLOR_PALETTE.find((p) => p.key === colorKey)?.color ?? MONOCHROME
}
