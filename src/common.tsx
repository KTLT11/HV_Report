import { useEffect, useState } from 'react'
import { ArrowRight, CalendarClock, ChevronDown, ListOrdered, Menu, MapPin, Star, TrendingDown, BadgePercent, X } from 'lucide-react'
import NotificationBell from './notifications'
import logo from './imports/image.png'
import { DEMO_STORE } from './userData'

export const LEVELS = [
  { key: 'risk', label: 'Nguy cơ', count: 6, bar: 'bg-lv1', num: 'text-lv1' },
  { key: 'watch', label: 'Cần chú ý', count: 14, bar: 'bg-lv2', num: 'text-[#c46a0f]' },
  { key: 'ok', label: 'Đạt', count: 38, bar: 'bg-lv3', num: 'text-mute' },
  { key: 'good', label: 'Tốt', count: 52, bar: 'bg-lv4', num: 'text-[#357f55]' },
  { key: 'great', label: 'Rất tốt', count: 24, bar: 'bg-lv5', num: 'text-lv5' },
]
export const TOTAL = LEVELS.reduce((s, l) => s + l.count, 0)
export const PERIODS = ['Hôm nay', 'Tuần này', 'Tháng 10/2026']
export const NAV = ['Tổng quan', 'Sản phẩm', 'Báo cáo KPI', 'Hàng tồn chưa bán', 'Hoa hồng']

export const TAGS: Record<string, { icon: typeof Star; cls: string }> = {
  'Cận date': { icon: CalendarClock, cls: 'bg-lv1/10 text-[#c22d20]' },
  'KPI thấp': { icon: TrendingDown, cls: 'bg-lv2/15 text-[#a85a0a]' },
  'Hoa hồng': { icon: BadgePercent, cls: 'bg-lv5/10 text-lv5' },
  'Hoa hồng cao': { icon: BadgePercent, cls: 'bg-lv5/10 text-lv5' },
  'Trọng yếu': { icon: Star, cls: 'bg-[#F5F2EF] text-[#4E4743] ring-1 ring-inset ring-[#E7E1DC] font-medium' },
}

export function Chip({ tag }: { tag: string }) {
  const t = TAGS[tag]
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-semibold whitespace-nowrap ${t.cls}`}>
      <t.icon className="size-3.5" />{tag}
    </span>
  )
}

export const THUMBS = [
  { main: '#f4f7fb', dark: '#c9d4e2', light: '#ffffff', band: '#2f6db5', mark: '#2f6db5' },
  { main: '#f6a640', dark: '#d98a26', light: '#fbc780', band: '#c8671a', mark: '#d98a26' },
  { main: '#d9b25b', dark: '#b8913f', light: '#ebd08f', band: '#2d3a63', mark: '#b8913f' },
  { main: '#3f9a6e', dark: '#2c7a54', light: '#78c29a', band: '#1f5c40', mark: '#2c7a54' },
  { main: '#4aa3b0', dark: '#2f808c', light: '#86c8d1', band: '#1d5963', mark: '#2f808c' },
  { main: '#8a78c0', dark: '#6a589f', light: '#b4a6dc', band: '#40336f', mark: '#6a589f' },
  { main: '#5b9bd5', dark: '#3f78ab', light: '#9cc5e8', band: '#234e78', mark: '#3f78ab' },
  { main: '#c9a27a', dark: '#a37f58', light: '#e2c3a2', band: '#5e4630', mark: '#a37f58' },
]

export function ProductThumb({ i, size = 84 }: { i: number; size?: number }) {
  const t = THUMBS[i % THUMBS.length]
  return (
    <span className="grid place-items-center rounded-xl bg-sand shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 96 96" style={{ width: size * 0.86, height: size * 0.86 }}>
        <ellipse cx="48" cy="86" rx="32" ry="4" fill="#231f20" opacity="0.08" />
        <polygon points="66,22 78,16 78,74 66,82" fill={t.dark} />
        <polygon points="20,22 32,16 78,16 66,22" fill={t.light} />
        <rect x="20" y="22" width="46" height="60" rx="2" fill={t.main} />
        <rect x="20" y="68" width="46" height="14" fill={t.band} />
        <rect x="26" y="30" width="34" height="26" rx="3" fill="#fff" opacity="0.92" />
        <rect x="41" y="34" width="4" height="12" rx="1" fill={t.mark} />
        <rect x="37" y="38" width="12" height="4" rx="1" fill={t.mark} />
        <rect x="30" y="50" width="26" height="2" rx="1" fill={t.dark} opacity="0.6" />
      </svg>
    </span>
  )
}


export function PickFirst() {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium whitespace-nowrap bg-[#EEF4FA] text-[#3F6480] ring-1 ring-inset ring-[#D8E4ED]">
      <ListOrdered className="size-3.5" />Ưu tiên lấy trước
    </span>
  )
}

const LEVEL_N: Record<string, number> = { risk: 1, watch: 2, ok: 3, good: 4, great: 5 }
export function LevelBadge({ level, label }: { level: string; label: string }) {
  const v = `var(--color-lv${LEVEL_N[level] ?? 3})`
  return (
    <span style={{ backgroundColor: `color-mix(in srgb, ${v} 15%, white)`, color: `color-mix(in srgb, ${v} 62%, black)` }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-semibold whitespace-nowrap">
      <span style={{ backgroundColor: v }} className="size-2 rounded-full" />{label}
    </span>
  )
}

export function Cta({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.() }} className="group inline-flex items-center gap-2 min-h-12 text-[15px] font-semibold text-brand hover:text-brand-deep">
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
    </button>
  )
}

export function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[21px] font-semibold tracking-[-0.01em] leading-snug">{title}</h2>
      <p className="text-sm text-mute mt-1">{sub}</p>
    </div>
  )
}

export function Sheet({ onClose, eyebrow, title, sub, lead, badges, cta, onCta, children }: { onClose: () => void; eyebrow: string; title: React.ReactNode; sub?: React.ReactNode; lead?: React.ReactNode; badges?: React.ReactNode; cta: string; onCta?: () => void; children: React.ReactNode }) {
  const [dy, setDy] = useState(0)
  const [y0, setY0] = useState<number | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={eyebrow}>
      <div className="qv-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        className="qv-panel absolute bottom-0 inset-x-0 max-h-[90vh] md:max-h-none md:inset-y-0 md:left-auto md:right-0 md:w-[460px] lg:w-[500px] bg-white rounded-t-2xl md:rounded-t-none md:rounded-l-2xl shadow-[0_-8px_32px_rgba(35,31,32,0.14)] md:shadow-[-8px_0_32px_rgba(35,31,32,0.14)] flex flex-col"
        style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
      >
        <div
          className="md:hidden pt-3 pb-1 touch-none"
          onTouchStart={(e) => setY0(e.touches[0].clientY)}
          onTouchMove={(e) => y0 !== null && setDy(Math.max(0, e.touches[0].clientY - y0))}
          onTouchEnd={() => { if (dy > 90) onClose(); setDy(0); setY0(null) }}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        </div>
        <div className="flex items-start justify-between gap-3 px-6 pt-4 md:pt-6 pb-5">
          <div className="flex items-center gap-4 min-w-0">
            {lead}
            <div className="min-w-0">
              <p className="text-[13px] text-mute font-medium">{eyebrow}</p>
              <h2 className="mt-1 text-[30px] leading-[1.15] font-[650]">{title}</h2>
              {sub && <p className="mt-1.5 text-[15px] text-mute">{sub}</p>}
              {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" autoFocus className="-mr-2 -mt-1 size-11 grid place-items-center rounded-full text-mute hover:bg-sand hover:text-ink shrink-0"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        <div className="px-6 pt-4 pb-6 md:pb-5 border-t border-line">
          <button onClick={onCta} className="group w-full min-h-[52px] rounded-lg bg-brand hover:bg-brand-deep text-white text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors">
            {cta}<ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

export type Route = { page: 'overview' } | { page: 'products'; mode: 'all' | 'kpi' | 'expiry' | 'key' | 'comm'; level?: string; cat?: string } | { page: 'detail'; id: number } | { page: 'report' } | { page: 'inventory' } | { page: 'commission' } | { page: 'staff' } | { page: 'login' } | { page: 'admin' }

export function TopNav({ active, go }: { active: number; go: (r: Route) => void }) {
  const [mob, setMob] = useState(false)
  const [acct, setAcct] = useState(false)
  const link = (i: number) => {
    setMob(false)
    if (i === 0) go({ page: 'overview' })
    if (i === 1) go({ page: 'products', mode: 'all' })
    if (i === 2) go({ page: 'report' })
    if (i === 3) go({ page: 'inventory' })
    if (i === 4) go({ page: 'commission' })
  }
  return (
    <div className="bg-brand text-white relative max-md:pt-[max(env(safe-area-inset-top),3.25rem)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Hồng Vân Pharmacy" className="h-9 w-auto" />
          <span className="hidden xl:inline text-sm text-white/80 pl-3 border-l border-white/30">Quản lý bán hàng</span>
        </div>
        <nav className="hidden lg:flex gap-1 ml-auto mr-3 text-[13px] xl:text-[14px]">
          {NAV.map((n, i) => {
            const cls = `relative px-4 py-[18px] transition-colors ${i === active ? 'font-semibold after:absolute after:left-4 after:right-4 after:bottom-0 after:h-0.5 after:bg-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`
            return <button key={n} onClick={() => link(i)} className={cls}>{n}</button>
          })}
        </nav>
        <div className="flex items-center gap-1.5 max-md:ml-auto">
          <NotificationBell go={go} />
          <div className="relative">
            <button aria-label="Tài khoản Trưởng quầy" aria-haspopup="menu" aria-expanded={acct} onClick={() => setAcct(!acct)} className="size-9 rounded-full bg-white/20 grid place-items-center text-sm font-semibold hover:bg-white/30">TL</button>
            {acct && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setAcct(false)} />
                <div role="menu" className="absolute right-0 top-full mt-2 z-40 w-48 rounded-xl bg-white text-ink py-2 shadow-[0_8px_24px_rgba(35,31,32,0.14)]">
                  <p className="px-4 py-2 text-sm font-semibold">Trưởng quầy · {DEMO_STORE.name}</p>
                  <button role="menuitem" onClick={() => go({ page: 'login' })} className="w-full text-left min-h-11 px-4 text-[15px] hover:bg-sand">Đăng xuất</button>
                </div>
              </>
            )}
          </div>
          <button aria-label="Menu" aria-expanded={mob} onClick={() => setMob(!mob)} className="lg:hidden size-11 grid place-items-center rounded-full hover:bg-white/10">{mob ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
      </div>
      {mob && (
        <div className="lg:hidden absolute inset-x-0 top-full z-40 bg-white text-ink shadow-[0_8px_24px_rgba(35,31,32,0.14)] py-2">
          {NAV.map((name, i) => <button key={name} onClick={() => link(i)} className={`w-full text-left min-h-12 px-5 text-base ${active === i ? 'font-semibold text-brand' : ''}`}>{name}</button>)}
        </div>
      )}
    </div>
  )
}

export function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none min-h-12 pl-5 pr-11 rounded-full bg-sand text-[15px] font-semibold focus:outline-2 focus:outline-brand"
      >
        {PERIODS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <ChevronDown className="size-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-mute" />
    </div>
  )
}
