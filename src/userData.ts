import { PRODUCTS, type Prod } from './data'
import { levelFor } from './levels'

export const DEMO_STORE = { id: 'HV-HN-NT', name: 'Hồng Vân – Nguyễn Trãi', location: 'Thanh Xuân, Hà Nội' }
export const STORES = [
  DEMO_STORE,
  { id: 'HV-HN-CG', name: 'Hồng Vân – Cầu Giấy', location: 'Hà Nội' },
  { id: 'HV-HN-HD', name: 'Hồng Vân – Hà Đông', location: 'Hà Nội' },
  { id: 'HV-HN-LB', name: 'Hồng Vân – Long Biên', location: 'Hà Nội' },
  { id: 'HV-HP-LC', name: 'Hồng Vân – Lê Chân', location: 'Hải Phòng' },
  { id: 'HV-QN-HL', name: 'Hồng Vân – Hạ Long', location: 'Quảng Ninh' },
  { id: 'HV-BN', name: 'Hồng Vân – Bắc Ninh', location: 'Bắc Ninh' },
  { id: 'HV-TN', name: 'Hồng Vân – Thái Nguyên', location: 'Thái Nguyên' },
  { id: 'HV-PT-VT', name: 'Hồng Vân – Việt Trì', location: 'Phú Thọ' },
] as const

export const USER_PERIODS = [
  { key: '2026-10', label: 'Tháng 10/2026', days: 31, elapsed: 19 },
  { key: '2026-09', label: 'Tháng 09/2026', days: 30, elapsed: 30 },
] as const
export type PeriodKey = typeof USER_PERIODS[number]['key']
export const periodName = (key: string) => USER_PERIODS.find(p => p.key === key)?.label ?? key
export const periodRange = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return `01/${String(month).padStart(2, '0')}/${year} – ${days}/${String(month).padStart(2, '0')}/${year}`
}
export const formatNumber = (n: number) => n.toLocaleString('vi-VN')
export const formatMoney = (n: number) => `${formatNumber(n)} ₫`
export const rate = (actual: number, target: number) => target > 0 ? Math.round(actual / target * 100) : 0

export type UserProduct = Prod & { sku: string; focus: boolean }
const seed = (key: string) => Number(key.replace('-', ''))
const sku = (p: Prod) => `HV${String(p.id + 1).padStart(4, '0')}`
export function productsFor(key: string): UserProduct[] {
  const s = seed(key)
  return PRODUCTS.map(p => {
    const target = Math.max(5, Math.round(p.target * (key === '2026-10' ? 1 : key === '2026-09' ? 0.94 : key.startsWith('2025') ? 0.84 : 0.89)))
    const variation = ((p.id * 17 + s) % 25) - 12
    let actual = Math.max(0, Math.round(target * (p.actual / p.target * 100 + variation) / 100))
    // Hai tập SKU tồn kho minh họa: không phát sinh bán ở kỳ đối chiếu trước.
    if (key === '2026-09' && p.id < 18) actual = 0
    if (key === '2026-08' && p.id >= 18 && p.id < 36) actual = 0
    if (key === '2026-10' && p.id < 18) actual = [7, 10, 13][p.id] ?? Math.max(0, Math.round([8, 11, 6, 14, 10, 4][p.id % 6]))
    if (key === '2026-09' && p.id >= 18 && p.id < 36) actual = [7, 10, 13][p.id - 18] ?? Math.max(0, Math.round([8, 11, 6, 14, 10, 4][(p.id - 18) % 6]))
    return { ...p, target, actual, sku: sku(p), focus: p.id % 6 === 0 || p.key }
  })
}
export const storeTotals = (key: string) => productsFor(key).reduce((a, p) => ({ sold: a.sold + p.actual, target: a.target + p.target }), { sold: 0, target: 0 })
export const storeWeeks = (key: string) => {
  const { sold } = storeTotals(key)
  const weights = [0.21, 0.24, 0.27]
  const first = weights.map(w => Math.round(sold * w))
  return [...first, sold - first.reduce((a, b) => a + b, 0)]
}
export const storePos = (key: string) => {
  const sold = storeTotals(key).sold
  const customers = Math.round(sold * (key === '2026-10' ? 0.74 : 0.78))
  const revenue = productsFor(key).reduce((a, p) => a + p.actual * p.price * 1000, 0)
  const period = USER_PERIODS.find(p => p.key === key)
  return { customers, revenue, avgRevenue: Math.round(revenue / customers), avgCustomers: Math.round(customers / (period?.elapsed ?? 30)) }
}

export type InventoryRow = { product: UserProduct; opening: number; previousSold: number; previousReceived: number; currentSold: number; threshold: number; warning: boolean }
export function inventoryFor(key: string): InventoryRow[] {
  const previous = productsFor(key === '2026-10' ? '2026-09' : '2026-08')
  return productsFor(key).slice(key === '2026-10' ? 0 : 18, key === '2026-10' ? 18 : 36).map((product, i) => {
    const opening = [100, 100, 100, 80, 120, 60][i % 6]
    const threshold = opening / 10
    const currentSold = product.actual
    return { product, opening, previousSold: previous[product.id].actual, previousReceived: 0, currentSold, threshold, warning: currentSold < threshold }
  })
}

export type KpiKind = 'qty' | 'rev'
export const KPI_OPTIONS: [KpiKind, string][] = [['qty', 'Số lượng bán'], ['rev', 'Doanh thu']]
export const kpiUnit = (kind: KpiKind) => kind === 'qty' ? 'SP' : '₫'
export const formatKpi = (n: number, kind: KpiKind) => kind === 'qty' ? `${formatNumber(n)} SP` : formatMoney(n)
export const STAFF = [
  { id: 'an', name: 'Nguyễn Thu An', storeId: DEMO_STORE.id },
  { id: 'linh', name: 'Trần Khánh Linh', storeId: STORES[1].id },
  { id: 'minh', name: 'Phạm Đức Minh', storeId: STORES[2].id },
  { id: 'ha', name: 'Đỗ Ngọc Hà', storeId: STORES[3].id },
  { id: 'nam', name: 'Lê Hoàng Nam', storeId: STORES[4].id },
  { id: 'trang', name: 'Vũ Thùy Trang', storeId: STORES[5].id },
  { id: 'huy', name: 'Bùi Quang Huy', storeId: STORES[6].id },
  { id: 'mai', name: 'Ngô Thanh Mai', storeId: STORES[7].id },
  { id: 'son', name: 'Hoàng Hải Sơn', storeId: STORES[8].id },
] as const
export const DEMO_STAFF = STAFF[0]
export const staffStore = (id: string) => STORES.find(s => s.id === id) ?? DEMO_STORE
export function staffKpi(id: string, key: string, kind: KpiKind) {
  const i = Math.max(0, STAFF.findIndex(s => s.id === id))
  const monthShift = key === '2026-10' ? 0 : -7
  const pct = [82, 109, 96, 118, 91, 105, 75, 112, 88][(i + (kind === 'rev' ? 3 : 0)) % STAFF.length] + monthShift
  const target = kind === 'qty' ? 350 + i * 25 : (46 + i * 4) * 1_000_000
  const actual = Math.round(target * pct / 100)
  return { target, actual, pct: rate(actual, target) }
}
export const topStaff = (key: string, kind: KpiKind) => STAFF.map(person => ({ ...person, ...staffKpi(person.id, key, kind) })).sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name, 'vi')).slice(0, 5)

export function commissionRows(id: string, key: string) {
  const i = Math.max(0, STAFF.findIndex(s => s.id === id))
  return productsFor(key).filter(p => p.focus).slice(0, 6).map((product, j) => {
    const quantity = 3 + ((i * 5 + j * 3 + seed(key)) % 15)
    const commission = quantity * (12_000 + j * 3_000)
    return { product, quantity, commission }
  })
}
export const commissionTotal = (id: string, key: string) => commissionRows(id, key).reduce((s, r) => s + r.commission, 0)
export function commissionStanding(id: string, key: string) {
  const ranked = STAFF.map(p => ({ id: p.id, total: commissionTotal(p.id, key) })).sort((a, b) => b.total - a.total)
  return { rank: ranked.findIndex(p => p.id === id) + 1, leader: ranked[0].total, count: ranked.length }
}
export function loyaltyFor(key: string) {
  const shift = key === '2026-10' ? 0 : -8
  return { personal: { bills: 94 + shift, customers: 171 + shift * 2 }, store: { bills: 840 + shift * 10, customers: storePos(key).customers } }
}
export const levelOfProduct = (p: UserProduct) => levelFor(rate(p.actual, p.target))
