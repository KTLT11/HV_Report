export type LevelKey = 'risk' | 'watch' | 'ok' | 'good' | 'great'
export type Level = { key: LevelKey; label: string; min: number; max: number | null; color: LevelKey; hex: string; msg: string }
export type LevelCfg = { bounds: string[]; names: string[]; hex: string[]; msgs: string[] }

export const LEVEL_KEYS: LevelKey[] = ['risk', 'watch', 'ok', 'good', 'great']
export const MSG_VARS = ['tên cửa hàng', 'tên KPI', 'tỷ lệ hoàn thành', 'phần còn thiếu', 'target', 'thực tế']

export const DEFAULT_CFG: LevelCfg = {
  bounds: ['50', '70', '90', '100'],
  names: ['Nguy cơ', 'Cần chú ý', 'Đạt', 'Tốt', 'Rất tốt'],
  hex: ['#e0392b', '#ee8a2b', '#e3b23c', '#8dc8a0', '#1e7f5c'],
  msgs: [
    '{tên cửa hàng} hiện mới đạt {tỷ lệ hoàn thành}% KPI. Cần tập trung cải thiện kết quả trong thời gian còn lại.',
    'Cửa hàng đang tiến gần mục tiêu. Hãy tiếp tục tập trung để cải thiện kết quả.',
    '🎯 Cửa hàng đã đạt mức yêu cầu. Hãy tiếp tục duy trì tiến độ.',
    '🎯 Đang làm rất tốt! Hãy tiếp tục giữ vững phong độ và tiến gần hơn tới mục tiêu.',
    '🎉 Xuất sắc! {tên cửa hàng} đã hoàn thành vượt KPI trong kỳ này.',
  ],
}

export const buildLevels = (c: LevelCfg): Level[] => {
  const b = c.bounds.map(Number)
  return LEVEL_KEYS.map((key, i) => ({ key, label: c.names[i], min: i === 0 ? 0 : b[i - 1], max: i === 4 ? null : b[i] - 1, color: key, hex: c.hex[i], msg: c.msgs[i] }))
}

export const DEFAULT_LEVELS: Level[] = buildLevels(DEFAULT_CFG)

export const levelStore: { published: LevelCfg; meta: { at: string; by: string }; draft: LevelCfg | null } = {
  published: DEFAULT_CFG,
  meta: { at: '07/10/2026 14:30', by: 'Admin' },
  draft: null,
}

export function publishCfg(c: LevelCfg) {
  DEFAULT_LEVELS.splice(0, DEFAULT_LEVELS.length, ...buildLevels(c))
  c.hex.forEach((h, i) => document.documentElement.style.setProperty(`--color-lv${i + 1}`, h))
  levelStore.published = c
  levelStore.draft = null
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  levelStore.meta = { at: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`, by: 'Admin' }
}

export const levelIndex = (pct: number) => {
  const i = DEFAULT_LEVELS.findIndex((l) => pct >= l.min && (l.max === null || pct <= l.max))
  return i < 0 ? 0 : i
}
export const levelFor = (pct: number) => DEFAULT_LEVELS[levelIndex(pct)]

const vn = (n: number) => n.toLocaleString('vi-VN')
export const renderMsg = (msg: string, v: { store: string; kpi: string; pct: number; target: number; actual: number }) => {
  const m: Record<string, string> = {
    'tên cửa hàng': v.store,
    'tên KPI': v.kpi,
    'tỷ lệ hoàn thành': String(v.pct),
    'phần còn thiếu': vn(Math.max(0, v.target - v.actual)),
    target: vn(v.target),
    'thực tế': vn(v.actual),
  }
  return msg.replace(/\{([^{}]+)\}/g, (all, k: string) => m[k.trim()] ?? all)
}
