import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Bell, CalendarClock, Package, Trophy, TrendingUp, type LucideIcon } from "lucide-react"
import { productsFor, storeTotals, DEMO_STORE, rate } from "./userData"
import { DEFAULT_LEVELS, levelFor } from "./levels"
import type { Route } from "./common"

const NOW = new Date(2026, 9, 19, 8, 30)
const MANAGED_STORE = "nguyen-trai"
const KPI = storeTotals('2026-10')
const DAYS_LEFT = 12
const FOCUS = productsFor('2026-10').filter(p => p.target > 0).sort((a, b) => rate(a.actual, a.target) - rate(b.actual, b.target))[0]

type Kind = "bottom5" | "level" | "reminder" | "complete"
type Seed = { id: string; store: string; kind: Kind; at: Date; read: boolean }
type View = { id: string; kind: Kind; title: string; body: string; time: string; read: boolean; route: Route; Icon: LucideIcon; tone: string; fg: string }

const SEEDS: Seed[] = [
  { id: "level:2026-10:watch-ok", store: MANAGED_STORE, kind: "level", at: new Date(2026, 9, 19, 8, 5), read: false },
  { id: "reminder:2026-10:w1", store: MANAGED_STORE, kind: "reminder", at: new Date(2026, 9, 19, 7, 30), read: false },
  { id: `bottom5:2026-10:${FOCUS.id}`, store: MANAGED_STORE, kind: "bottom5", at: new Date(2026, 9, 18, 17, 40), read: false },
  { id: "complete:2026-09", store: MANAGED_STORE, kind: "complete", at: new Date(2026, 8, 28, 17, 20), read: true },
  { id: "complete:other-store", store: "quan-1", kind: "complete", at: new Date(2026, 9, 6, 9, 0), read: false },
]

let readIds = new Set(SEEDS.filter((s) => s.read).map((s) => s.id))
const subs = new Set<() => void>()
let snap = 0
const emit = () => { snap++; subs.forEach((f) => f()) }
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
const markRead = (ids: string[]) => { readIds = new Set([...readIds, ...ids]); emit() }

const fmtTime = (d: Date) => {
  const mins = Math.round((NOW.getTime() - d.getTime()) / 60000)
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  if (mins < 60) return `${Math.max(1, mins)} phút trước`
  if (d.toDateString() === NOW.toDateString()) return `${Math.floor(mins / 60)} giờ trước`
  const y = new Date(NOW); y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return `Hôm qua, ${hm}`
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function build(): View[] {
  const pct = rate(KPI.sold, KPI.target)
  const cur = levelFor(pct)
  const left = KPI.target - KPI.sold
  return SEEDS.filter((s) => s.store === MANAGED_STORE)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((s): View => {
      const base = { id: s.id, kind: s.kind, time: fmtTime(s.at), read: readIds.has(s.id) }
      if (s.kind === "level")
        return { ...base, title: "Tiến độ KPI quầy", body: `${DEMO_STORE.name} đang đạt ${pct}% KPI tháng 10, mức ${cur.label}.`, route: { page: "overview" }, Icon: TrendingUp, tone: `color-mix(in srgb, ${cur.hex} 15%, white)`, fg: `color-mix(in srgb, ${cur.hex} 62%, black)` }
      if (s.kind === "reminder")
        return { ...base, title: "Nhắc tiến độ kỳ KPI", body: `Còn ${DAYS_LEFT} ngày để hoàn thành KPI tháng. Cửa hàng cần bán thêm ${left.toLocaleString("vi-VN")} sản phẩm (khoảng ${Math.ceil(left / DAYS_LEFT)} SP/ngày).`, route: { page: "overview" }, Icon: CalendarClock, tone: "#FDF3E3", fg: "#9a6a12" }
      if (s.kind === "bottom5")
        return { ...base, title: "Sản phẩm cần đẩy mạnh bán", body: `${FOCUS.name} nằm trong nhóm sản phẩm có tỷ lệ KPI thấp nhất tháng 10 (${rate(FOCUS.actual, FOCUS.target)}%).`, route: { page: "detail", id: FOCUS.id }, Icon: Package, tone: "#EEF4FA", fg: "#3F6480" }
      return { ...base, title: "Kỳ KPI trước", body: `Xem kết quả KPI tháng 9 của ${DEMO_STORE.name}.`, route: { page: "overview" }, Icon: Trophy, tone: `color-mix(in srgb, ${DEFAULT_LEVELS[DEFAULT_LEVELS.length - 1].hex} 15%, white)`, fg: `color-mix(in srgb, ${DEFAULT_LEVELS[DEFAULT_LEVELS.length - 1].hex} 62%, black)` }
    })
}

export default function NotificationBell({ go }: { go: (r: Route) => void }) {
  useSyncExternalStore(subscribe, () => snap)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [top, setTop] = useState(0)
  const loaded = useRef(false)
  const box = useRef<HTMLDivElement>(null)
  const items = build()
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key) }
  }, [open])

  const toggle = () => {
    if (!open) {
      setTop((box.current?.getBoundingClientRect().bottom ?? 0) + 8)
      if (!loaded.current) { loaded.current = true; setLoading(true); window.setTimeout(() => setLoading(false), 450) }
    }
    setOpen(!open)
  }

  return (
    <div ref={box} className="relative">
      <button aria-label={unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo"} aria-haspopup="dialog" aria-expanded={open} onClick={toggle} className={`relative size-11 grid place-items-center rounded-full hover:bg-white/10 ${open ? "bg-white/10" : ""}`}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[#8f1519] ring-2 ring-white text-[11px] font-semibold leading-none">{unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Thông báo" style={{ ["--nt" as string]: `${top}px` }} className="max-sm:fixed max-sm:inset-x-3 max-sm:top-[var(--nt)] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[400px] z-40 rounded-xl border border-line bg-white text-ink shadow-[0_8px_24px_rgba(35,31,32,0.14)] overflow-hidden qv-fade">
          <div className="flex items-center gap-2 px-4 min-h-14 border-b border-line">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold leading-tight">Thông báo</h2>
              <p className="text-[13px] text-mute leading-tight mt-0.5">{unread > 0 ? `${unread} chưa đọc` : "Đã đọc tất cả"}</p>
            </div>
            <button type="button" disabled={unread === 0} onClick={() => markRead(items.map((n) => n.id))} className="ml-auto min-h-9 px-2.5 rounded-md text-[13px] font-semibold text-brand hover:bg-sand disabled:text-mute disabled:hover:bg-transparent disabled:cursor-default">Đánh dấu tất cả đã đọc</button>
          </div>
          {loading ? (
            <ul aria-busy className="divide-y divide-line">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-3 px-4 py-4"><span className="size-9 rounded-lg bg-sand animate-pulse" /><span className="flex-1 space-y-2"><span className="block h-3.5 w-1/2 rounded bg-sand animate-pulse" /><span className="block h-3 w-full rounded bg-sand animate-pulse" /></span></li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="px-4 py-12 text-center text-[14px] text-mute">Bạn chưa có thông báo nào</p>
          ) : (
            <ul className="max-h-[min(70vh,440px)] overflow-y-auto divide-y divide-line">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => { markRead([n.id]); setOpen(false); go(n.route) }}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand ${n.read ? "bg-white" : "bg-[#FDF6F5]"}`}
                  >
                    <span className="mt-0.5 size-9 rounded-lg grid place-items-center shrink-0" style={{ backgroundColor: n.tone, color: n.fg }}><n.Icon className="size-[18px]" strokeWidth={1.9} /></span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14px] leading-snug ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                      <span className="block mt-0.5 text-[13px] leading-snug text-mute line-clamp-3">{n.body}</span>
                      <span className="block mt-1.5 text-[12px] text-mute">{n.time}</span>
                    </span>
                    {n.read ? <span className="sr-only">Đã đọc</span> : <span aria-label="Chưa đọc" className="mt-2 size-2 rounded-full bg-brand shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
