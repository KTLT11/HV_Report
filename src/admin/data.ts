import { PRODUCTS, type Prod } from '../data'
import { DEMO_STORE, STAFF, inventoryFor as userInventoryFor, productsFor as userProductsFor } from '../userData'

export const USE_STORE_TARGET = true

export type KpiId = 'rev' | 'qty'
export const KPI_OPTS: [KpiId, string][] = [['rev', 'Doanh thu'], ['qty', 'Số lượng bán']]
export const kpiName = (k: KpiId) => (k === 'rev' ? 'Doanh thu' : 'Số lượng bán')
export const kpiUnit = (k: KpiId) => (k === 'rev' ? 'VND' : 'SP')

export const CURRENT_PERIOD = '2026-10'
export const PERIODS: [string, string][] = [['2026-08', 'Tháng 08/2026'], ['2026-09', 'Tháng 09/2026'], ['2026-10', 'Tháng 10/2026'], ['2026-11', 'Tháng 11/2026']]
export const periodLabel = (p: string) => PERIODS.find((o) => o[0] === p)?.[1] ?? p
export const TARGET_PERIOD = '2026-11'
export const prevPeriods = (p: string) => PERIODS.filter((o) => o[0] < p).reverse()

export type Status = 'none' | 'partial' | 'done'
export type StoreCfg = { storeTarget: number | null; products: Record<number, number> }
export type Store = { id: number; code: string; name: string; area: string; scope: number[]; group: number }
export type Page = { name: 'overview' } | { name: 'target' } | { name: 'store'; id: number } | { name: 'threshold' } | { name: 'kpis' } | { name: 'groups' } | { name: 'stock' } | { name: 'payroll' }

export const GROUPS: { key: number; label: string; desc: string; monthlyPushTarget: number }[] = [
  { key: 0, label: 'Nhóm A', desc: 'Khả năng bán cao', monthlyPushTarget: 600 },
  { key: 1, label: 'Nhóm B', desc: 'Khả năng bán khá', monthlyPushTarget: 450 },
  { key: 2, label: 'Nhóm C', desc: 'Khả năng bán trung bình', monthlyPushTarget: 320 },
  { key: 3, label: 'Nhóm D', desc: 'Khả năng bán thấp', monthlyPushTarget: 220 },
]
export const groupLabel = (k: number) => GROUPS.find((g) => g.key === k)?.label ?? `Nhóm ${k}`

const pad = (n: number, w = 2) => String(n).padStart(w, '0')
const letters = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26))
const AREAS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']
const hash = (a: number, b: number) => Math.abs(Math.imul(a + 7, 2654435761) ^ Math.imul(b + 13, 40503) ^ (a * b * 97)) >>> 0

export const skuOf = (p: Prod) => p.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X') + pad(p.id, 3)
export const PROD_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))
export const PROD_BY_CODE = new Map(PRODUCTS.map((p) => [skuOf(p), p]))

// Chi nhánh #0 là cửa hàng demo dùng chung với khu vực Trưởng quầy/Nhân viên (DEMO_STORE trong userData.ts),
// để Target/hàng tồn/mã cần đẩy của Admin khớp tuyệt đối với số liệu Trưởng quầy đang xem.
export const DEMO_STORE_ID = 0

const STORE_COUNT = 50
export const STORES: Store[] = Array.from({ length: STORE_COUNT }, (_, i) => ({
  id: i,
  code: i === DEMO_STORE_ID ? DEMO_STORE.id : `HV${pad(i + 1)}`,
  name: i === DEMO_STORE_ID ? DEMO_STORE.name : `Chi nhánh ${letters(i)}`,
  area: AREAS[i % AREAS.length],
  scope: i === DEMO_STORE_ID ? PRODUCTS.map((p) => p.id) : i === STORE_COUNT - 1 ? [] : PRODUCTS.filter((p) => hash(p.id, i) % 100 < 70).map((p) => p.id),
  group: hash(i, 777) % GROUPS.length,
}))
export const STORE_BY_CODE = new Map(STORES.map((s) => [s.code, s]))
const DEMO_HEADCOUNT = Math.max(1, STAFF.filter((s) => s.storeId === DEMO_STORE.id).length)
export const headcountOf = (storeId: number) => (storeId === DEMO_STORE_ID ? DEMO_HEADCOUNT : 3 + (hash(storeId, 501) % 4))

const trim = (n: number, d: number) => String(+n.toFixed(d))
const grp = (n: number) => n.toLocaleString('en-US')

export function fmtVal(kpi: KpiId, n: number) {
  if (kpi === 'qty') return `${grp(n)} SP`
  if (n >= 1e6) return `${grp(+(n / 1e6).toFixed(2))}M`
  if (n >= 1e3) return `${trim(n / 1e3, 1)}K`
  return String(n)
}
export function fmtInput(kpi: KpiId, n: number) {
  if (kpi === 'rev' && n >= 1e6 && n % 1000 === 0) return `${trim(n / 1e6, 3)}M`
  return grp(n)
}
export const roundTo = (kpi: KpiId, n: number) => (kpi === 'rev' ? Math.round(n / 1000) * 1000 : Math.round(n))
export const fmtPct = (n: number) => `${+n.toFixed(1)}%`

export type Parsed = { v: number } | { err: string }
export function parseVal(kpi: KpiId, text: string): Parsed {
  let t = text.trim().toLowerCase().replace(/[\s,]/g, '')
  if (/^\d{1,3}(\.\d{3})+/.test(t) && !/[a-z]/.test(t.replace(/\./g, ''))) t = t.replace(/\./g, '')
  const m = t.match(/^(-?\d*\.?\d+)(m|tr|k|b|tỷ|ty|sp|vnd|đ)?$/)
  if (!m) return { err: 'Giá trị không phải số' }
  const num = parseFloat(m[1])
  const u = m[2]
  if (kpi === 'qty' && u && u !== 'sp') return { err: 'Đơn vị không phù hợp với KPI Số lượng bán' }
  if (kpi === 'rev' && u === 'sp') return { err: 'Đơn vị không phù hợp với KPI Doanh thu' }
  const mult = u === 'm' || u === 'tr' ? 1e6 : u === 'k' ? 1e3 : u === 'b' || u === 'tỷ' || u === 'ty' ? 1e9 : 1
  if (num < 0) return { err: 'Target không được âm' }
  const v = Math.round(num * mult)
  if (kpi === 'qty' && v !== num * mult) return { err: 'Số lượng phải là số nguyên' }
  return { v }
}

export const EMPTY_CFG: StoreCfg = { storeTarget: null, products: {} }

const cache = new Map<string, StoreCfg>()
export const cfgKey = (period: string, kpi: KpiId, storeId: number) => `${period}|${kpi}|${storeId}`

function mkProducts(kpi: KpiId, ids: number[], total: number, storeIdx: number) {
  const w = ids.map((id) => {
    const p = PROD_BY_ID.get(id)!
    return p.target * (kpi === 'rev' ? p.price : 1) * (0.7 + (hash(id, storeIdx) % 600) / 1000)
  })
  const sum = w.reduce((a, b) => a + b, 0)
  const step = kpi === 'rev' ? 500_000 : 5
  const out: Record<number, number> = {}
  ids.forEach((id, i) => { out[id] = Math.max(step, Math.round((w[i] / sum) * total / step) * step) })
  return out
}

const PARTIAL: Record<KpiId, number[]> = { rev: [0, 2, 3], qty: [1, 4, 9] }
const NONE: Record<KpiId, number[]> = { rev: [1], qty: [0] }

export function genCfg(period: string, kpi: KpiId, idx: number): StoreCfg {
  const k = cfgKey(period, kpi, idx)
  const hit = cache.get(k)
  if (hit) return hit
  const store = STORES[idx]
  let cfg: StoreCfg = EMPTY_CFG
  if (idx === DEMO_STORE_ID && kpi === 'qty' && period !== TARGET_PERIOD) {
    const list = userProductsFor(period)
    const products: Record<number, number> = {}
    list.forEach((p) => { products[p.id] = p.target })
    cfg = { storeTarget: list.reduce((a, p) => a + p.target, 0), products }
  } else if (store.scope.length > 0 && period !== '2026-11') {
    const cur = period === CURRENT_PERIOD
    const scale = period === '2026-09' ? 0.9 : period === '2026-08' ? 0.82 : 1
    const h = hash(idx, kpi === 'rev' ? 1 : 2)
    let T = kpi === 'rev' ? 300e6 + (h % 9) * 50e6 : 8000 + (h % 8) * 1000
    if (idx === 0) T = kpi === 'rev' ? 500e6 : 10000
    const step = kpi === 'rev' ? 5e6 : 50
    T = Math.round((T * scale) / step) * step
    const alloc = 0.92 + (h % 9) / 100
    if (!cur) cfg = { storeTarget: T, products: mkProducts(kpi, store.scope, T * alloc, idx) }
    else if (NONE[kpi].includes(idx)) cfg = EMPTY_CFG
    else if (idx === PARTIAL[kpi][0]) cfg = { storeTarget: T, products: mkProducts(kpi, store.scope.slice(0, -4), T * 0.84, idx) }
    else if (idx === PARTIAL[kpi][1]) cfg = { storeTarget: T, products: mkProducts(kpi, store.scope.slice(0, -2), T * alloc * 0.97, idx) }
    else if (idx === PARTIAL[kpi][2]) cfg = { storeTarget: null, products: mkProducts(kpi, store.scope.slice(0, Math.ceil(store.scope.length / 2)), T * 0.5, idx) }
    else cfg = { storeTarget: T, products: mkProducts(kpi, store.scope, T * alloc, idx) }
  }
  cache.set(k, cfg)
  return cfg
}

export function summarize(store: Store, cfg: StoreCfg) {
  const configured = store.scope.filter((id) => cfg.products[id] !== undefined).length
  const assigned = store.scope.reduce((s, id) => s + (cfg.products[id] ?? 0), 0)
  const alloc = cfg.storeTarget ? (assigned / cfg.storeTarget) * 100 : null
  const status: Status = configured === 0 ? 'none' : configured === store.scope.length ? 'done' : 'partial'
  return { configured, assigned, alloc, status, scope: store.scope.length }
}

export const STATUS_LABEL: Record<Status, string> = { none: 'Chưa cấu hình', partial: 'Chưa hoàn tất', done: 'Đã hoàn tất' }

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()

// --- Dữ liệu minh họa "đã bán" theo cửa hàng, dùng cho báo cáo hàng tồn & tổng hợp lương toàn hệ thống ---
export const PAYROLL_PERIODS = PERIODS.filter(([k]) => k !== TARGET_PERIOD)
export const STOCK_PERIODS: [string, string][] = [['2026-10', periodLabel('2026-10')], ['2026-09', periodLabel('2026-09')]]
const PREV_OF: Record<string, string> = { '2026-10': '2026-09', '2026-09': '2026-08' }

const soldCache = new Map<string, Record<number, number>>()
export function genSold(period: string, storeIdx: number): Record<number, number> {
  const k = `${period}|${storeIdx}`
  const hit = soldCache.get(k)
  if (hit) return hit
  let out: Record<number, number> = {}
  if (storeIdx === DEMO_STORE_ID) {
    userProductsFor(period).forEach((p) => { out[p.id] = p.actual })
  } else {
    const store = STORES[storeIdx]
    const cfg = genCfg(period, 'qty', storeIdx)
    store.scope.forEach((id) => {
      const target = cfg.products[id] ?? 0
      if (target === 0) { out[id] = 0; return }
      const pct = 55 + (hash(id, storeIdx + 919) % 70)
      out[id] = Math.max(0, Math.round((target * pct) / 100))
    })
  }
  soldCache.set(k, out)
  return out
}

const OPENINGS = [100, 100, 100, 80, 120, 60]
export const openingStockOf = (storeIdx: number, productId: number) => OPENINGS[hash(storeIdx, productId + 333) % OPENINGS.length]

export type StockRow = { productId: number; opening: number; prevSold: number; currentSold: number; threshold: number; warning: boolean }
export function stockRowsFor(period: string, storeIdx: number): StockRow[] {
  if (storeIdx === DEMO_STORE_ID) {
    return userInventoryFor(period).map((r) => ({ productId: r.product.id, opening: r.opening, prevSold: r.previousSold, currentSold: r.currentSold, threshold: r.threshold, warning: r.warning }))
  }
  const prev = PREV_OF[period]
  if (!prev) return []
  const store = STORES[storeIdx]
  const prevSold = genSold(prev, storeIdx)
  const curSold = genSold(period, storeIdx)
  return store.scope.filter((id) => (prevSold[id] ?? 0) === 0).map((id) => {
    const opening = openingStockOf(storeIdx, id)
    const threshold = Math.round(opening / 10)
    const currentSold = curSold[id] ?? 0
    return { productId: id, opening, prevSold: prevSold[id] ?? 0, currentSold, threshold, warning: currentSold < threshold }
  })
}

export type PushDetailRow = { productId: number; sold: number; target: number; done: boolean }
export function pushDetailFor(period: string, storeIdx: number): PushDetailRow[] {
  if (storeIdx === DEMO_STORE_ID) {
    return userProductsFor(period).filter((p) => p.focus).map((p) => ({ productId: p.id, sold: p.actual, target: p.target, done: p.actual >= p.target }))
  }
  const store = STORES[storeIdx]
  const cfg = genCfg(period, 'qty', storeIdx)
  const sold = genSold(period, storeIdx)
  return store.scope.filter((id) => PROD_BY_ID.get(id)!.key).map((id) => {
    const target = cfg.products[id] ?? 0
    const s = sold[id] ?? 0
    return { productId: id, sold: s, target, done: target > 0 && s >= target }
  })
}

export function payrollRowFor(period: string, storeIdx: number) {
  const rows = pushDetailFor(period, storeIdx)
  return { store: STORES[storeIdx], pushCount: rows.length, pushDone: rows.filter((r) => r.done).length }
}
