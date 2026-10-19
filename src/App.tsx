import { useMemo, useRef, useState } from "react"
import { ChevronRight, Target } from "lucide-react"
import {
  Cta,
  LevelBadge,
  PERIODS,
  PeriodSelect,
  ProductThumb,
  SectionHead,
  Sheet,
  TopNav,
  type Route,
} from "./common"
import ProductList from "./ProductList"
import ProductDetail from "./ProductDetail"
import Login from "./Login"
import Admin from "./admin"
import Report from "./Report"
import { levelOf, pctOf } from "./data"
import { DEFAULT_LEVELS, levelFor, levelIndex, renderMsg, type Level } from "./levels"
import { DEMO_STORE, USER_PERIODS, productsFor, storePos, storeTotals, rate, formatMoney, type PeriodKey } from "./userData"
import Inventory from "./Inventory"
import Commission from "./Commission"
import StaffDashboard from "./Staff"


function formatNumber(value: number) {
  return value.toLocaleString("vi-VN")
}

const tint = (hex: string, pct: number) => `color-mix(in srgb, ${hex} ${pct}%, white)`

const rangeLabel = (levels: Level[], i: number) =>
  i === levels.length - 1 ? `≥ ${levels[i].min}%` : `${levels[i].min}% – <${levels[i + 1].min}%`

function PerformanceGauge({ pct, level, go, period }: { pct: number; level: Level; go: (route: Route) => void; period: PeriodKey }) {
  const levels = DEFAULT_LEVELS
  const edges = [0, ...levels.slice(1).map((l) => l.min)]
  const scaleMax = Math.max(120, edges[edges.length - 1] + 20)
  edges.push(scaleMax)
  const cx = 180
  const cy = 170
  const R = 132
  const W = 30
  const VBW = 360
  const VBH = 190
  const ang = (v: number) => Math.PI * (1 - Math.min(Math.max(v, 0), scaleMax) / scaleMax)
  const pt = (v: number, r: number) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))]
  const GAP = 4
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a, R)
    const [x2, y2] = pt(b, R)
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`
  }
  const [nx, ny] = pt(pct, R - W / 2 - 8)
  const gapV = (GAP / R) * (scaleMax / Math.PI)

  const [hover, setHover] = useState<number | null>(null)
  const timer = useRef(0)
  const open = (i: number) => { window.clearTimeout(timer.current); setHover(i) }
  const close = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setHover(null), 180) }

  const stats = useMemo(
    () =>
      levels.map((l) => {
        const list = productsFor(period).filter((p) => p.target > 0 && levelOf(pctOf(p)) === l.key).sort((a, b) => pctOf(a) - pctOf(b))
        return { count: list.length, top: (l.key === "good" || l.key === "great" ? [...list].reverse() : list).slice(0, 3) }
      }),
    [levels, period],
  )

  const tip = hover !== null ? { l: levels[hover], s: stats[hover], mid: (edges[hover] + edges[hover + 1]) / 2 } : null
  const [tx, ty] = tip ? pt(tip.mid, R + W / 2) : [0, 0]

  return (
    <div className="w-full max-w-[400px]">
      <div className="relative">
        <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full h-auto" role="img" aria-label={`Hoàn thành ${pct}% KPI, mức ${level.label}`}>
          {levels.map((l, i) => {
            const a = edges[i]
            const b = edges[i + 1]
            const s = a + (i === 0 ? 0 : gapV / 2)
            const e = b - (i === levels.length - 1 ? 0 : gapV / 2)
            const d = arc(s, e)
            const on = hover === i
            return (
              <g
                key={l.key}
                tabIndex={0}
                role="button"
                aria-label={`${l.label}, ${rangeLabel(levels, i)}, ${stats[i].count} sản phẩm`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => open(i)}
                onMouseLeave={close}
                onFocus={() => open(i)}
                onBlur={close}
                onClick={() => (hover === i ? setHover(null) : open(i))}
              >
                <path d={d} fill="none" stroke={l.hex} strokeWidth={on ? W + 4 : W} style={{ opacity: hover !== null ? (on ? 1 : 0.45) : l.key === level.key ? 1 : 0.85, transition: "opacity .2s, stroke-width .2s" }} />
                <path d={d} fill="none" stroke="transparent" strokeWidth={W + 14} />
              </g>
            )
          })}
          {edges.map((v, i) => {
            const [x, y] = pt(v, R + W / 2 + 12)
            return (
              <text key={i} x={x} y={y + 4} textAnchor="middle" className="fill-mute pointer-events-none" fontSize="11" fontWeight="500">
                {v}{i === edges.length - 1 ? "%" : ""}
              </text>
            )
          })}
          <g className="pointer-events-none" style={{ transition: "all 0.7s" }}>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#231F20" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx={cx} cy={cy} r="8" fill="#231F20" className="pointer-events-none" />
          <circle cx={cx} cy={cy} r="3" fill="white" className="pointer-events-none" />
        </svg>

        {tip && (
          <div
            role="tooltip"
            onMouseEnter={() => open(hover!)}
            onMouseLeave={close}
            className="absolute z-30 w-[270px] max-w-[88vw] rounded-xl border border-line bg-white p-4 text-left shadow-[0_8px_24px_rgba(35,31,32,0.14)] qv-fade"
            style={{ left: `clamp(135px, ${(tx / VBW) * 100}%, calc(100% - 135px))`, top: `${(ty / VBH) * 100}%`, transform: "translate(-50%, calc(-100% - 6px))" }}
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: tip.l.hex }} />
              <span className="text-[15px] font-semibold">{tip.l.label}</span>
              <span className="ml-auto text-[13px] text-mute tabular-nums">{rangeLabel(levels, hover!)}</span>
            </div>
            <p className="mt-2 text-sm text-mute"><b className="text-ink font-semibold tabular-nums">{tip.s.count}</b> sản phẩm thuộc mức này</p>
            {tip.s.top.length > 0 && (
              <ul className="mt-2 space-y-1">
                {tip.s.top.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate">{p.name}</span>
                    <span className="tabular-nums text-mute shrink-0">{pctOf(p)}%</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              disabled={tip.s.count === 0}
              onClick={() => go({ page: "products", mode: "all", level: tip.l.key })}
              className="group mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-deep disabled:text-mute disabled:cursor-default"
            >
              <span className="group-enabled:group-hover:underline underline-offset-4">Xem danh sách {tip.l.label}</span>
              <ChevronRight className="size-4 transition-transform group-enabled:group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
      <div className="-mt-1 text-center">
        <span className="text-[44px] leading-none font-[650] tracking-[-0.03em]">{pct}<span className="text-[24px]">%</span></span>
        <span className="block mt-1 text-[13px] text-mute font-medium">hoàn thành</span>
        <div className="mt-2"><LevelBadge level={level.key} label={level.label} /></div>
      </div>
      <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12px] text-mute">
        {levels.map((l) => (
          <li key={l.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: l.hex }} />{l.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const PERIOD_START = new Date(2026, 9, 1)
const PERIOD_END = new Date(2026, 9, 31)
const DAY = 86400000
const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

function PeriodProgress({ remaining, period }: { remaining: number; period: PeriodKey }) {
  const total = Math.round((PERIOD_END.getTime() - PERIOD_START.getTime()) / DAY) + 1
  const elapsed = period === "2026-10" ? 19 : total
  const daysLeft = total - elapsed
  const perDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0

  return (
    <div className="border-t border-line px-5 sm:px-7 py-5 grid gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <p className="text-[13px] uppercase tracking-[0.08em] text-mute font-semibold">Tiến độ kỳ</p>
        <div className="mt-3 relative h-2 rounded-full bg-ink/10" role="img" aria-label={`Tiến độ kỳ ${period}, còn ${daysLeft} ngày`}>
          <span className="absolute inset-y-0 left-0 rounded-full bg-[#8b8583]" style={{ width: `${(elapsed / total) * 100}%` }} />
          <span aria-hidden className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-[#8b8583]" style={{ left: `${(elapsed / total) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-mute tabular-nums"><span>01/{period.slice(5)}/2026</span><span>{period === "2026-10" ? "31" : "30"}/{period.slice(5)}/2026</span></div>
      </div>
      <dl className="flex gap-8">
        <div><dt className="text-sm text-mute">{daysLeft ? "Còn lại" : "Trạng thái"}</dt><dd className="text-[20px] font-semibold tabular-nums">{daysLeft ? `${daysLeft} ngày` : "Đã kết thúc"}</dd></div>
        {daysLeft > 0 && <div><dt className="text-sm text-mute">Cần bán trung bình</dt><dd className="text-[20px] font-semibold tabular-nums">{formatNumber(perDay)} SP/ngày</dd></div>}
      </dl>
    </div>
  )
}

function Performance({ go, period }: { go: (route: Route) => void; period: PeriodKey }) {
  const STORE_KPI = storeTotals(period)
  const pct = rate(STORE_KPI.sold, STORE_KPI.target)
  const remaining = Math.max(0, STORE_KPI.target - STORE_KPI.sold)
  const idx = levelIndex(pct)
  const level = DEFAULT_LEVELS[idx]
  const next = DEFAULT_LEVELS[idx + 1]
  const message = renderMsg(level.msg, { store: DEMO_STORE.name, kpi: "Số lượng bán", pct, target: STORE_KPI.target, actual: STORE_KPI.sold })
  const needNext = next ? Math.max(0, Math.ceil((next.min / 100) * STORE_KPI.target) - STORE_KPI.sold) : 0

  return (
    <section className="rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(35,31,32,0.04)]">
      <div className="p-5 sm:p-7">
        <p className="text-[13px] uppercase tracking-[0.08em] text-mute font-semibold">KPI quầy {period === "2026-10" ? "tháng 10" : "tháng 9"}</p>

        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          <div className="flex-1 flex justify-center">
            <PerformanceGauge pct={pct} level={level} go={go} period={period} />
          </div>

          <div className="md:w-[300px] lg:w-[340px] md:border-l md:border-line md:pl-10">
            <p className="text-[13px] uppercase tracking-[0.08em] text-mute font-semibold">Chi tiết KPI</p>
            <dl className="mt-4 space-y-4">
              <div><dt className="text-sm text-mute">Đã bán</dt><dd className="text-[20px] font-semibold tabular-nums">{formatNumber(STORE_KPI.sold)} SP</dd></div>
              <div><dt className="text-sm text-mute">Target</dt><dd className="text-[20px] font-semibold tabular-nums">{formatNumber(STORE_KPI.target)} SP</dd></div>
              <div><dt className="text-sm text-mute">Còn</dt><dd className="text-[20px] font-semibold tabular-nums">{formatNumber(remaining)} SP</dd></div>
            </dl>
            <p className="mt-5 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[14px]" style={{ backgroundColor: next ? tint(next.hex, 12) : tint(level.hex, 12) }}>
              <span aria-hidden className="mt-1.5 size-2 rounded-full shrink-0" style={{ backgroundColor: next ? next.hex : level.hex }} />
              <span>{next ? <>Còn <strong className="font-semibold tabular-nums">{formatNumber(needNext)} SP</strong> để lên mức <strong className="font-semibold">{next.label}</strong> ({next.min}%).</> : "Cửa hàng đang ở mức cao nhất."}</span>
            </p>
          </div>
        </div>
      </div>

      <PeriodProgress remaining={remaining} period={period} />

      <div className="border-t rounded-b-2xl px-5 sm:px-7 py-4 flex items-start gap-3.5" style={{ backgroundColor: tint(level.hex, 10), borderColor: tint(level.hex, 30) }}>
        <span className="size-10 rounded-full grid place-items-center shrink-0 bg-white/70" style={{ color: level.hex }}>
          <Target className="size-5" strokeWidth={1.8} />
        </span>
        <p className="pt-1.5 text-[15px] sm:text-base leading-relaxed font-medium">{message}</p>
      </div>
    </section>
  )
}

function FocusProducts({ go, period }: { go: (route: Route) => void; period: PeriodKey }) {
  const ranked = productsFor(period).filter((p) => p.target > 0)
    .sort((a, b) => a.actual / a.target - b.actual / b.target)
    .slice(0, 5)

  return (
    <section>
      <SectionHead title="Sản phẩm cần đẩy mạnh bán" sub="5 sản phẩm có tỷ lệ hoàn thành KPI thấp nhất trong kỳ" />

      {ranked.length === 0 ? (
        <p className="rounded-xl border border-line py-10 text-center text-mute">Chưa có sản phẩm nào có Target trong kỳ này.</p>
      ) : (
        <ol className="rounded-xl border border-line overflow-hidden divide-y divide-line bg-white">
          {ranked.map((p, i) => {
            const pct = Math.round((p.actual / p.target) * 100)
            const level = levelFor(pct)
            const left = Math.max(0, p.target - p.actual)
            return (
              <li key={p.id}>
                <button
                  onClick={() => go({ page: "detail", id: p.id })}
                  className="group relative w-full text-left grid grid-cols-[2rem_minmax(0,1fr)_auto_1.25rem] md:grid-cols-[2.25rem_minmax(0,1.5fr)_5rem_8.5rem_minmax(9rem,0.9fr)_1.25rem] gap-x-4 gap-y-1 items-center pl-5 pr-4 py-4 hover:bg-sand/70 transition-colors"
                  style={{ backgroundColor: tint(level.hex, 4) }}
                >
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: level.hex }} />
                  <span className="text-[15px] font-semibold tabular-nums" style={{ color: level.hex }}>{String(i + 1).padStart(2, "0")}</span>

                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-snug truncate">{p.name}</span>
                    <span className="block mt-0.5 text-sm text-mute tabular-nums">{p.actual} / {p.target} SP</span>
                  </span>

                  <span className="hidden md:block text-[17px] font-semibold tabular-nums" style={{ color: level.hex }}>{pct}%</span>
                  <span className="hidden md:block"><LevelBadge level={level.key} label={level.label} /></span>
                  <span className="hidden md:block text-sm text-mute">{left > 0 ? <>Còn thiếu <b className="font-semibold text-ink tabular-nums">{left} SP</b></> : "Đã hoàn thành KPI"}</span>

                  <span className="md:hidden flex flex-col items-end gap-1">
                    <span className="text-[17px] font-semibold tabular-nums" style={{ color: level.hex }}>{pct}%</span>
                    <LevelBadge level={level.key} label={level.label} />
                  </span>
                  <ChevronRight className="size-5 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-transform" />

                  <span className="md:hidden col-start-2 col-span-3 text-sm text-mute">{left > 0 ? `Còn thiếu ${left} SP` : "Đã hoàn thành"}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex justify-end mt-2">
        <Cta onClick={() => go({ page: "products", mode: "all" })}>Xem tất cả sản phẩm</Cta>
      </div>
    </section>
  )
}

function TargetSummary({ period }: { period: PeriodKey }) {
  const [open, setOpen] = useState(false)
  const rows = productsFor(period).filter((p) => p.focus)
  const met = rows.filter((p) => p.actual >= p.target).length

  return (
    <section>
      <SectionHead title="Tổng kết chỉ tiêu quầy" sub="Mã hàng cần đẩy trong kỳ và mức độ đạt mục tiêu" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Mã hàng cần đẩy", rows.length], ["Mã đạt mục tiêu", met], ["Mã chưa đạt", rows.length - met]].map(([label, n]) => (
          <div key={label} className="rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-mute">{label} · quầy</p>
            <p className="mt-2 text-[32px] font-semibold">{n}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-sand p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{met}/{rows.length} mã hàng cần đẩy đã đạt mục tiêu</p>
          <p className="mt-1 text-sm text-mute">Trạng thái tổng hợp: {met === rows.length ? "Đã đạt tất cả" : "Còn mã chưa đạt"}</p>
        </div>
        <button onClick={() => setOpen(true)} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-deep">Xem danh sách mã</button>
      </div>
      {open && (
        <Sheet eyebrow="Danh sách mã cần đẩy" title={USER_PERIODS.find((p) => p.key === period)?.label} sub={DEMO_STORE.name} cta="Đóng" onCta={() => setOpen(false)} onClose={() => setOpen(false)}>
          <p className="mb-3 text-sm text-mute">{rows.length} mã hàng · {met} mã đạt mục tiêu</p>
          <ul className="divide-y divide-line">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <ProductThumb i={p.thumb} size={42} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{p.name}</b>
                  <span className="text-xs text-mute">{p.sku} · {p.actual}/{p.target} SP · {rate(p.actual, p.target)}%</span>
                </span>
                <span className={p.actual >= p.target ? "text-[#1e7f5c] font-semibold" : "text-[#c22d20] font-semibold"}>{p.actual >= p.target ? "Đạt" : "Chưa đạt"}</span>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </section>
  )
}

function Overview({ go, period, setPeriod }: { go: (route: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const pos = storePos(period)

  return (
    <div className="min-h-screen text-[15px]">
      <TopNav active={0} go={go} />
      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-7 pb-14 space-y-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[30px] leading-tight font-[650] tracking-[-0.01em]">
              Tổng quan cửa hàng
            </h1>
            <p className="mt-1.5 text-[19px] font-semibold">
              {DEMO_STORE.name} ({DEMO_STORE.location})
            </p>
            <p className="text-sm text-mute mt-1">Dữ liệu mẫu · {period === "2026-10" ? "cập nhật 19/10/2026" : "kỳ đã kết thúc"}</p>
          </div>
          <select aria-label="Kỳ" value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="min-h-12 rounded-full bg-sand px-5 font-semibold">{USER_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
        </header>

        <Performance go={go} period={period} />
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">Doanh thu bán hàng bình quân mỗi khách · quầy</p><p className="mt-2 text-[26px] font-semibold">{formatMoney(pos.avgRevenue)}<span className="text-base text-mute">/khách</span></p><p className="mt-1 text-xs text-mute">Dữ liệu POS mô phỏng · {period}</p></div>
          <div className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">Lượng khách bình quân mỗi ngày · quầy</p><p className="mt-2 text-[26px] font-semibold">{formatNumber(pos.avgCustomers)}<span className="text-base text-mute"> khách/ngày</span></p><p className="mt-1 text-xs text-mute">Dữ liệu POS mô phỏng · {period}</p></div>
        </section>
        <FocusProducts go={go} period={period} />
        <TargetSummary period={period} />
      </main>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState<Route>({ page: "login" })
  const [role, setRole] = useState<"manager" | "staff" | "admin" | null>(null)
  const [period, setPeriod] = useState<PeriodKey>("2026-10")
  const go = (nextRoute: Route) => {
    if (nextRoute.page === "login") setRole(null)
    if (role === "staff" && !["staff", "login"].includes(nextRoute.page)) return
    if (role === "manager" && ["staff", "admin"].includes(nextRoute.page)) return
    setRoute(nextRoute)
    window.scrollTo({ top: 0 })
  }

  if (route.page === "login")
    return (
      <Login
        onLogin={(nextRole) => { setRole(nextRole); setRoute(nextRole === "admin" ? { page: "admin" } : nextRole === "staff" ? { page: "staff" } : { page: "overview" }) }}
      />
    )
  if (route.page === "admin") return <Admin exit={go} />
  if (route.page === "staff") return <StaffDashboard go={go} period={period} setPeriod={setPeriod} />
  if (route.page === "overview") return <Overview go={go} period={period} setPeriod={setPeriod} />
  if (route.page === "report")
    return <Report key={JSON.stringify(route)} go={go} period={period} setPeriod={setPeriod} />
  if (route.page === "inventory") return <Inventory go={go} period={period} setPeriod={setPeriod} />
  if (route.page === "commission") return <Commission go={go} period={period} setPeriod={setPeriod} />
  if (route.page === "detail")
    return <ProductDetail key={route.id} id={route.id} go={go} period={period} />
  return <ProductList key={JSON.stringify(route)} route={route} go={go} period={period} setPeriod={setPeriod} />
}
