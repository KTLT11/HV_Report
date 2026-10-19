import { levelFor } from './levels'
export type Lot = { code: string; days: number; exp: string; qty: number; shelf: string }
export type Comm = { left: number; amt: number }
export type Prod = {
  id: number
  name: string
  cat: string
  thumb: number
  unitName: string
  price: number
  target: number
  actual: number
  stock: number
  lots: Lot[]
  key: boolean
  comm: Comm | null
  boost: number
  reason?: string
}
export type LevelKey = 'risk' | 'watch' | 'ok' | 'good' | 'great'

export const CAT_NAMES = ['Dược phẩm', 'Thực phẩm chức năng', 'Mẹ & Bé', 'Thiết bị y tế', 'Chăm sóc cá nhân', 'Chăm sóc răng miệng', 'Cảm cúm & hô hấp', 'Tiêu hóa', 'Da liễu', 'Mắt – Tai – Mũi', 'Hàng tiện ích', 'Xương khớp']
const [DP, TP, MB, TB, CS, RM, CC, TH, DL, MT, TI, XK] = CAT_NAMES
const NAME_CAT: Record<string, string> = {
  'Panadol Extra': DP, 'Vitamin C ABC': TP, 'Ensure Gold': TP, 'Siro ho Prospan': CC, 'Berberin 100mg': TH, 'Oresol Hydrite': TH, 'Kẽm Gluconat': TP, 'Omega-3 Nature': TP,
  'Canxi D3 Nic': XK, 'Hoạt huyết dưỡng não': TP, 'Decolgen Forte': CC, Strepsils: CC, Smecta: TH, Berocca: TP, 'Bổ gan Livergood': TP, Gaviscon: TH, 'Efferalgan 500mg': DP,
  'Nước muối Fysoline': MT, 'Vitamin D3 K2': TP,
  Acemuc: CC, Aspirin: DP, Augmentin: DP, Azithromycin: DP, Betadine: DL, Bioflora: TH, Bisolvon: CC, Cetirizin: DL, Corace: RM, Domperidon: TH, Enterogermina: TH, Eugica: RM,
  Fexofenadin: DL, 'Folic Acid': MB, Glucosamin: XK, Hapacol: MB, Ibuprofen: DP, Imodium: TH, Loratadin: DL, Lactacyd: CS, 'Magne B6': TP, Maalox: TH, Metronidazol: DP, Nacurgo: TB,
  Omeprazol: TH, Paracetamol: DP, Phosphalugel: TH, Pantoloc: TH, Biogaia: MB, Rhinocort: MT, Salonpas: XK, Ferrovit: MB, Terpin: CC, Ventolin: CC, Yumangel: TH, Zyrtec: DL,
  'Alpha Choay': TB, Arcalion: TB, 'Bổ phế Nam Hà': CC, Bepanthen: MB, 'Neo-Tergynan': CS, Pectol: CC, 'Rutin C': TI, Tatanol: DP, Tylenol: DP, Pharmaton: TP, Sterimar: MT, Vigorsan: TI,
}
const catOf = (name: string) => NAME_CAT[name.replace(/ (Forte|Kids)$/, '')] ?? DP

const RANK: LevelKey[] = ['risk', 'watch', 'ok', 'good', 'great']
export const pctOf = (p: Prod) => Math.round((p.actual / p.target) * 100)
export const levelOf = (pct: number): LevelKey => levelFor(pct).key
export const minDays = (p: Prod) => (p.lots.length ? Math.min(...p.lots.map((l) => l.days)) : null)

export function fmtMoney(k: number) {
  if (Math.abs(k) >= 1000) return `${(k / 1000).toFixed(1).replace(/\.0$/, '')}M`
  return `${Math.round(k)}K`
}

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261007)
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
function shuffle<T>(a: T[]) {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
const pad = (n: number) => String(n).padStart(2, '0')
const fmtDate = (days: number) => {
  const d = new Date(2026, 9, 7 + days)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
const shelf = () => `${pick(['A', 'B', 'C', 'D', 'E'])}${between(1, 3)}-${pad(between(1, 8))}`
const lot = (name: string, days: number, qty: number, n: number, sh?: string, code?: string): Lot => ({
  code: code ?? `${name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}24${pad(between(3, 8))}-${pad(n)}`,
  days,
  exp: fmtDate(days),
  qty,
  shelf: sh ?? shelf(),
})

type F = Omit<Prod, 'id' | 'cat' | 'lots' | 'boost' | 'comm' | 'key'> & { lots?: Lot[]; key?: boolean; comm?: Comm; boost?: number }
const base = (name: string, thumb: number, unitName: string, price: number, actual: number, target: number, stock: number): F => ({ name, thumb, unitName, price, actual, target, stock })

const FEATURED: F[] = [
  { ...base('Panadol Extra', 0, 'hộp', 85, 42, 100, 64), boost: 400, lots: [lot('PE', 8, 24, 1, 'A2-03', 'PE2406-01'), lot('PE', 41, 40, 2, 'A1-04', 'PE2409-02')] },
  { ...base('Vitamin C ABC', 1, 'lọ', 300, 62, 100, 64), boost: 380, key: true, comm: { left: 18, amt: 360 }, lots: [lot('VC', 11, 20, 2, 'B1-07', 'VC2407-02')] },
  { ...base('Ensure Gold', 2, 'lon', 650, 28, 80, 86), boost: 360, key: true, comm: { left: 22, amt: 20 }, reason: 'Tồn cao · tốc độ bán thấp hơn yêu cầu 28%' },
  { ...base('Siro ho Prospan', 3, 'chai', 120, 24, 50, 40), boost: 340, key: true, comm: { left: 12, amt: 210 } },
  { ...base('Berberin 100mg', 4, 'lọ', 45, 31, 100, 120), key: true, comm: { left: 30, amt: 20 }, lots: [lot('BB', 13, 60, 3, 'C1-02', 'BB2405-03')] },
  { ...base('Oresol Hydrite', 5, 'gói', 15, 22, 50, 150), key: true, comm: { left: 25, amt: 20 }, lots: [lot('OR', 14, 80, 1, 'C2-05', 'OR2406-01')] },
  { ...base('Kẽm Gluconat', 6, 'vỉ', 60, 40, 100, 55), key: true, comm: { left: 14, amt: 20 } },
  { ...base('Omega-3 Nature', 7, 'lọ', 250, 40, 60, 48), key: true, comm: { left: 12, amt: 25 } },
  { ...base('Canxi D3 Nic', 0, 'hộp', 180, 35, 50, 70), key: true, comm: { left: 15, amt: 180 } },
  { ...base('Hoạt huyết dưỡng não', 1, 'hộp', 150, 33, 50, 62), key: true, comm: { left: 9, amt: 25 } },
  { ...base('Decolgen Forte', 2, 'vỉ', 40, 82, 100, 90), key: true, comm: { left: 10, amt: 20 } },
  { ...base('Strepsils', 3, 'hộp', 55, 68, 80, 75) },
  { ...base('Smecta', 4, 'hộp', 70, 40, 50, 52) },
  { ...base('Berocca', 5, 'tuýp', 190, 48, 50, 36), key: true, comm: { left: 6, amt: 20 } },
  { ...base('Bổ gan Livergood', 6, 'hộp', 120, 47, 50, 44) },
  { ...base('Gaviscon', 7, 'gói', 20, 59, 60, 110) },
  { ...base('Efferalgan 500mg', 0, 'hộp', 60, 124, 100, 80) },
  { ...base('Nước muối Fysoline', 1, 'chai', 25, 59, 50, 140) },
  { ...base('Vitamin D3 K2', 2, 'lọ', 220, 44, 40, 38) },
]

const BASES = ['Acemuc', 'Aspirin', 'Augmentin', 'Azithromycin', 'Betadine', 'Bioflora', 'Bisolvon', 'Cetirizin', 'Corace', 'Domperidon', 'Enterogermina', 'Eugica', 'Fexofenadin', 'Folic Acid', 'Glucosamin', 'Hapacol', 'Ibuprofen', 'Imodium', 'Loratadin', 'Lactacyd', 'Magne B6', 'Maalox', 'Metronidazol', 'Nacurgo', 'Omeprazol', 'Paracetamol', 'Phosphalugel', 'Pantoloc', 'Biogaia', 'Rhinocort', 'Salonpas', 'Ferrovit', 'Terpin', 'Ventolin', 'Yumangel', 'Zyrtec', 'Alpha Choay', 'Arcalion', 'Bổ phế Nam Hà', 'Bepanthen', 'Neo-Tergynan', 'Pectol', 'Rutin C', 'Tatanol', 'Tylenol', 'Pharmaton', 'Sterimar', 'Vigorsan']
const NAMES = ['', ' Forte', ' Kids'].flatMap((v) => BASES.map((b) => b + v)).slice(0, 115)

function build(): Prod[] {
  const levelPool = shuffle<LevelKey>([...Array(10).fill('watch'), ...Array(35).fill('ok'), ...Array(49).fill('good'), ...Array(21).fill('great')])
  const expClasses = shuffle([...Array(7).fill(0), ...Array(17).fill(1), ...Array(24).fill(2)])
  const expIdx = new Set(shuffle([...Array(115).keys()]).slice(0, 48))
  const range: Record<string, [number, number]> = { watch: [51, 73], ok: [75, 89], good: [90, 99], great: [101, 130] }
  const commPool = [...Array(16).fill(19), 16]
  let watchKey = 0, goodKey = 0, ci = 0, ei = 0, secondLots = 0
  const out: Prod[] = FEATURED.map((f, i) => ({ ...f, cat: catOf(f.name), id: i, lots: f.lots ?? [], key: !!f.key, comm: f.comm ?? null, boost: f.boost ?? 0 }))
  NAMES.forEach((name, i) => {
    const lv = levelPool[i]
    const target = pick([40, 50, 60, 80, 100, 120])
    const [lo, hi] = range[lv]
    let actual = Math.max(1, Math.round((target * between(lo, hi)) / 100))
    for (let g = 0; g < 20 && levelOf(Math.round((actual / target) * 100)) !== lv; g++) actual += RANK.indexOf(levelOf(Math.round((actual / target) * 100))) < RANK.indexOf(lv) ? 1 : -1
    let key = false
    if (lv === 'watch' && watchKey < 3) { key = true; watchKey++ }
    else if ((lv === 'ok' || lv === 'good') && goodKey < 14) { key = true; goodKey++ }
    const stock = between(14, 140)
    const lots: Lot[] = []
    if (expIdx.has(i)) {
      const c = expClasses[ei++]
      const d = c === 0 ? between(3, 14) : c === 1 ? between(15, 30) : between(31, 60)
      lots.push(lot(name, d, Math.min(stock, between(6, 60)), 1))
      if (secondLots < 6 && d <= 40) { secondLots++; lots.push(lot(name, Math.min(60, d + between(10, 20)), Math.min(stock, between(6, 40)), 2)) }
    }
    out.push({
      id: out.length, name, cat: catOf(name), thumb: between(0, 7), unitName: pick(['hộp', 'lọ', 'chai', 'vỉ', 'tuýp', 'gói']), price: pick([45, 60, 85, 95, 120, 150, 180, 220, 300]),
      target, actual, stock, lots, key, comm: key ? { left: between(5, 28), amt: commPool[ci++] } : null, boost: 0,
    })
  })
  return out
}

export const PRODUCTS = build()
export const ALL_LOTS = PRODUCTS.flatMap((p) => p.lots.map((l) => ({ p, l })))
