import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, Download, FileSpreadsheet, FileText, LoaderCircle, TriangleAlert } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LevelBadge, SectionHead, TopNav, type Route } from './common'
import { DEFAULT_LEVELS, type Level } from './levels'
import { PRODUCTS } from './data'
import { DEMO_STORE, USER_PERIODS, productsFor, storeTotals, storeWeeks, periodRange, type PeriodKey } from './userData'
import { exportPdf, exportXlsx, fileBase, type ExportData } from './exportReport'
import { Select } from './ProductList'

const STORE_NAME = DEMO_STORE.name

type Period = { key: string; label: string; short: string; range: string; sold: number; target: number; weeks: number[] }

const periodData = (key: string): Period => {
  const totals = storeTotals(key)
  return { key, label: key, short: key === '2026-10' ? 'Tháng 10' : key === '2026-09' ? 'Tháng 9' : key === '2026-08' ? 'Tháng 8' : `Tháng ${key.slice(5)}/${key.slice(0, 4)}`, range: periodRange(key), sold: totals.sold, target: totals.target, weeks: storeWeeks(key) }
}
const PERIOD_OPTS: [string, string][] = USER_PERIODS.map(p => [p.key, p.label])
const PRIOR: Record<string, string> = { '2026-10': '2026-09', '2026-09': '2026-08' }
const YOY: Record<string, string> = { '2026-10': '2025-10', '2026-09': '2025-09' }

const nf = (n: number, d = 0) => n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
const sp = (n: number) => `${nf(n)} SP`
const pctOf = (p: Period) => Math.round((p.sold / p.target) * 1000) / 10

// Threshold lookup tolerates fractional percentages between integer-configured bands.
const levelFor = (pct: number): Level =>
  [...DEFAULT_LEVELS].reverse().find((l) => pct >= (l.min ?? 0)) ?? DEFAULT_LEVELS[0]

const GOOD = 'text-[#357f55]'
const BAD = 'text-[#c22d20]'

function Change({ n, unit, flat = 'Không đổi' }: { n: number; unit: string; flat?: string }) {
  if (n === 0) return <span className="font-semibold text-mute">{flat}</span>
  const Icon = n > 0 ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${n > 0 ? GOOD : BAD}`}>
      <Icon className="size-4" strokeWidth={2.5} />{nf(Math.abs(n), unit === 'điểm %' ? 1 : 0)} {unit}
    </span>
  )
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: { x: string; v: number } }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg bg-ink text-white px-3.5 py-2.5 text-[13px] shadow-lg">
      <div className="text-white/70">{p.x}</div>
      <div className="font-semibold tabular-nums text-[15px]">{sp(p.v)}</div>
    </div>
  )
}

export default function Report({ go, period, setPeriod }: { go: (r: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const [cmp, setCmp] = useState<'prev' | 'yoy'>('prev')
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!menu) return
    const down = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [menu])

  const pk = period
  const cur = periodData(pk)
  const base = periodData((cmp === 'yoy' ? YOY : PRIOR)[pk])
  const curPct = pctOf(cur)
  const basePct = pctOf(base)
  const curLv = levelFor(curPct)
  const baseLv = levelFor(basePct)
  const dPct = Math.round((curPct - basePct) * 10) / 10
  const dSold = cur.sold - base.sold
  const lvOrder = DEFAULT_LEVELS.map((l) => l.key)
  const dLv = lvOrder.indexOf(curLv.key) - lvOrder.indexOf(baseLv.key)
  const remaining = Math.max(0, cur.target - cur.sold)
  const cmpName = cmp === 'yoy' ? 'cùng kỳ năm trước' : cur.key === '2026-10' ? 'tháng trước' : 'kỳ trước'
  const month = cur.short
  const cmpHead = base.short
  const data = cur.weeks.map((v, i) => ({ x: `Tuần ${i + 1}`, v }))

  const rows: [string, React.ReactNode, React.ReactNode, React.ReactNode][] = [
    ['Số lượng bán', sp(base.sold), sp(cur.sold), <Change n={dSold} unit="SP" />],
    ['KPI được giao', sp(base.target), sp(cur.target), <span className="text-mute">—</span>],
    ['Hoàn thành', `${nf(basePct, 1)}%`, `${nf(curPct, 1)}%`, <Change n={dPct} unit="điểm %" />],
    [
      'Trạng thái',
      <LevelBadge level={baseLv.key} label={baseLv.label} />,
      <LevelBadge level={curLv.key} label={curLv.label} />,
      dLv === 0 ? <span className="font-semibold text-mute">Không đổi</span> : <span className={`inline-flex items-center gap-1 font-semibold ${dLv > 0 ? GOOD : BAD}`}>{dLv > 0 ? <ArrowUp className="size-4" strokeWidth={2.5} /> : <ArrowDown className="size-4" strokeWidth={2.5} />}{dLv > 0 ? 'Cải thiện' : 'Giảm'}</span>,
    ],
  ]

  const buildExport = (): ExportData => {
    const products = productsFor(pk).map(p => ({ name: p.name, sold: p.actual, target: p.target }))
    const now = new Date()
    return {
      store: STORE_NAME,
      period: cur.short,
      range: cur.range,
      exportedAt: now.toLocaleString('vi-VN'),
      kpi: { sold: cur.sold, target: cur.target, pct: curPct, status: curLv.label, remaining },
      compare: { label: cmpName, sold: base.sold, target: base.target, pct: basePct, status: baseLv.label },
      compareHead: base.short,
      dSold,
      dPct,
      trend: cur.weeks.map((v, i) => `Tuần ${i + 1}: ${nf(v)} SP`).join(' · '),
      products: products.map((p) => {
        const pct = Math.round((p.sold / p.target) * 100)
        return { ...p, pct, status: levelFor(pct).label }
      }),
    }
  }

  const run = async (kind: 'xlsx' | 'pdf') => {
    setMenu(false)
    setBusy(true)
    try {
      const d = buildExport()
      const base2 = fileBase(STORE_NAME, cur.key)
      if (kind === 'xlsx') await exportXlsx(d, base2)
      else await exportPdf(d, base2)
      setToast({ ok: true, msg: 'Xuất báo cáo thành công' })
    } catch {
      setToast({ ok: false, msg: 'Không thể xuất báo cáo. Vui lòng thử lại.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen text-[15px]">
      <TopNav active={2} go={go} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-7 pb-16">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1 basis-80">
            <h1 className="text-[28px] sm:text-[30px] leading-tight font-[650] tracking-[-0.01em]">Báo cáo</h1>
            <p className="mt-1.5 text-base text-mute">{DEMO_STORE.name} ({DEMO_STORE.location}) · Theo dõi kết quả KPI bán hàng và sự thay đổi hiệu suất theo thời gian</p>
          </div>
          <div ref={menuRef} className="relative max-sm:w-full">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              disabled={busy}
              onClick={() => setMenu(!menu)}
              className="min-w-[190px] max-sm:w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#D8D2CF] px-4 text-[15px] font-semibold hover:bg-sand hover:border-[#BDB6B3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:bg-sand disabled:text-mute transition-colors"
            >
              {busy ? <LoaderCircle className="size-[18px] animate-spin" /> : <Download className="size-[18px]" />}
              {busy ? 'Đang xuất báo cáo...' : 'Xuất báo cáo'}
              {!busy && <ChevronDown className={`size-4 text-mute transition-transform ${menu ? 'rotate-180' : ''}`} />}
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-full mt-2 z-30 w-full min-w-[230px] rounded-xl bg-white border border-line py-1.5 shadow-[0_8px_24px_rgba(35,31,32,0.12)]">
                <button role="menuitem" onClick={() => run('xlsx')} className="w-full min-h-11 px-4 flex items-center gap-3 text-left text-[15px] hover:bg-sand">
                  <FileSpreadsheet className="size-5 text-[#1e7f5c]" />Xuất Excel (.xlsx)
                </button>
                <button role="menuitem" onClick={() => run('pdf')} className="w-full min-h-11 px-4 flex items-center gap-3 text-left text-[15px] hover:bg-sand">
                  <FileText className="size-5 text-brand" />Xuất PDF (.pdf)
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Select label="Kỳ:" value={pk} onChange={v => setPeriod(v as PeriodKey)} options={PERIOD_OPTS} />
          <Select label="So với:" value={cmp} onChange={(v) => setCmp(v as 'prev' | 'yoy')} options={[['prev', 'Kỳ trước'], ['yoy', 'Cùng kỳ năm trước']]} />
        </div>
        <p className="mt-3 text-sm text-mute">{cur.range} · so với {cmpName}</p>

        <section className="mt-8" aria-label={`Kết quả KPI ${month.toLowerCase()}`}>
          <h2 className="text-[13px] font-semibold text-mute uppercase tracking-wide mb-3">Kết quả KPI {month.toLowerCase()}</h2>
          <div className="rounded-xl bg-sand p-5 sm:p-7">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-[1.4fr_1fr_auto] sm:items-start">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[34px] sm:text-[40px] font-[650] tabular-nums leading-none">{nf(cur.sold)}</span>
                  <span className="text-[20px] text-mute tabular-nums">/ {nf(cur.target)} SP</span>
                </div>
                <div className="mt-2 text-[13px] text-mute">Đã bán / KPI</div>
              </div>
              <div>
                <div className="text-[34px] sm:text-[40px] font-[650] tabular-nums leading-none text-brand">{nf(curPct, 1)}%</div>
                <div className="mt-2 text-[13px] text-mute">Hoàn thành</div>
              </div>
              <div className="sm:justify-self-end"><LevelBadge level={curLv.key} label={curLv.label} /></div>
            </div>
            <div className="mt-6 pt-5 border-t border-line grid gap-x-8 gap-y-4 sm:grid-cols-[1.4fr_1fr_auto]">
              <div>
                <div className="text-[19px] font-semibold tabular-nums">{remaining > 0 ? `Còn ${sp(remaining)}` : 'Đã hoàn thành KPI'}</div>
                <div className="mt-0.5 text-[13px] text-mute">{remaining > 0 ? 'để hoàn thành KPI' : `Vượt KPI ${sp(cur.sold - cur.target)}`}</div>
              </div>
              <div>
                <div className="text-[19px]"><Change n={dPct} unit="điểm %" /></div>
                <div className="mt-0.5 text-[13px] text-mute">so với {cmpName}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <SectionHead title={`So sánh với ${cmpName}`} sub="Đối chiếu kết quả KPI giữa hai kỳ" />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[13px] text-mute border-b border-line">
                <th className="py-2.5 pr-3 font-medium">Chỉ số</th>
                <th className="py-2.5 px-3 font-medium text-right">{cmpHead}</th>
                <th className="py-2.5 px-3 font-medium text-right">{month}</th>
                <th className="py-2.5 pl-3 font-medium text-right">Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b, d]) => (
                <tr key={label} className="border-b border-line min-h-14">
                  <th scope="row" className="py-4 pr-3 font-semibold text-[15px] sm:text-[16px]">{label}</th>
                  <td className="py-4 px-3 text-right tabular-nums text-mute"><span className="inline-flex justify-end">{a}</span></td>
                  <td className="py-4 px-3 text-right tabular-nums font-semibold"><span className="inline-flex justify-end">{b}</span></td>
                  <td className="py-4 pl-3 text-right tabular-nums"><span className="inline-flex justify-end">{d}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-mute">% hoàn thành KPI là chỉ số chính để so sánh hiệu suất, vì KPI được giao có thể khác nhau giữa các kỳ.</p>
        </section>

        <section className="mt-10">
          <SectionHead title="Xu hướng bán hàng" sub="Theo dõi sự thay đổi số lượng sản phẩm bán ra trong kỳ" />
          <p className="text-[13px] text-mute mb-2">Số lượng bán theo tuần · đơn vị: Sản phẩm</p>
          <div className="h-[220px] sm:h-[260px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#E9E4E1" vertical={false} />
                <XAxis dataKey="x" tick={{ fontSize: 13, fill: '#6B6465' }} tickLine={false} axisLine={{ stroke: '#E9E4E1' }} padding={{ left: 24, right: 24 }} />
                <YAxis tick={{ fontSize: 13, fill: '#6B6465' }} tickLine={false} axisLine={false} width={56} domain={[0, (m: number) => Math.ceil((m * 1.15) / 500) * 500]} tickFormatter={(v) => nf(Number(v))} />
                <Tooltip content={<Tip />} cursor={{ stroke: '#C9C2BF' }} />
                <Line type="monotone" dataKey="v" stroke="#C72128" strokeWidth={2.75} dot={{ r: 4, fill: '#C72128', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
      {toast && (
        <div role="status" aria-live="polite" className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] flex items-center gap-2.5 rounded-xl bg-ink text-white pl-3.5 pr-5 py-3 text-[15px] shadow-lg">
          {toast.ok ? <Check className="size-5 shrink-0 text-[#8dc8a0]" /> : <TriangleAlert className="size-5 shrink-0 text-[#ee8a2b]" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
