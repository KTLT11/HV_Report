import { createContext, useContext, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { STATUS_LABEL, type KpiId, type Page, type Status, type StoreCfg } from './data'

export type ToastOpts = { action?: { label: string; onClick: () => void } }
export type AdminCtx = {
  period: string
  kpi: KpiId
  setPeriod: (p: string) => void
  setKpi: (k: KpiId) => void
  go: (p: Page) => void
  cfgOf: (period: string, kpi: KpiId, storeId: number) => StoreCfg
  saveCfg: (period: string, kpi: KpiId, storeId: number, cfg: StoreCfg) => void
  toast: (m: string, o?: ToastOpts) => void
  setDirty: (b: boolean) => void
  listUi: { q: string; status: string }
  setListUi: (v: { q: string; status: string }) => void
}
export const Ctx = createContext<AdminCtx>(null as unknown as AdminCtx)
export const useAdmin = () => useContext(Ctx)

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export function Btn({ kind = 'secondary', children, onClick, disabled, className = '', title }: { kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; title?: string }) {
  const k = {
    primary: 'bg-brand text-white hover:bg-brand-deep disabled:bg-[#d9b3b5]',
    secondary: 'bg-white text-ink ring-1 ring-inset ring-[#d8d2cf] hover:bg-sand disabled:text-mute/60 disabled:hover:bg-white',
    ghost: 'text-brand hover:bg-tint disabled:text-mute/60',
    danger: 'text-[#c22d20] hover:bg-risk-bg',
  }[kind]
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg text-[15px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed', k, className)}>
      {children}
    </button>
  )
}

const TONES = {
  green: 'bg-[#1e7f5c]/10 text-[#1e7f5c]',
  amber: 'bg-[#ee8a2b]/15 text-[#a85a0a]',
  gray: 'bg-[#EEF0EF] text-[#4E5855]',
  red: 'bg-[#e0392b]/10 text-[#c22d20]',
  blue: 'bg-[#EEF4FA] text-[#3F6480]',
}
export function Badge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-semibold whitespace-nowrap', TONES[tone])}>{children}</span>
}
export function StatusBadge({ s }: { s: Status }) {
  const t = { none: 'gray', partial: 'amber', done: 'green' } as const
  return <Badge tone={t[s]}>{STATUS_LABEL[s]}</Badge>
}

export function PageHead({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-[650] tracking-[-0.01em]">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-mute">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Select({ value, onChange, options, label, className = '' }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string; className?: string }) {
  return (
    <label className={cx('relative block', className)}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none w-full min-h-11 pl-3.5 pr-9 rounded-lg bg-white ring-1 ring-inset ring-[#d8d2cf] text-[15px] font-medium focus:outline-2 focus:outline-brand">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-mute" />
    </label>
  )
}

export function SearchBox({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cx('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-11 pl-10 pr-3 rounded-lg bg-white ring-1 ring-inset ring-[#d8d2cf] text-[15px] placeholder:text-mute/70 focus:outline-2 focus:outline-brand" />
    </label>
  )
}

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size))
  if (total === 0) return null
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm text-mute">
      <span>Hiển thị {from}–{to} / {total}</span>
      <div className="flex items-center gap-1">
        <button aria-label="Trang trước" disabled={page <= 1} onClick={() => onPage(page - 1)} className="size-10 grid place-items-center rounded-lg hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent"><ChevronLeft className="size-5" /></button>
        <span className="px-2 text-ink font-medium">{page} / {pages}</span>
        <button aria-label="Trang sau" disabled={page >= pages} onClick={() => onPage(page + 1)} className="size-10 grid place-items-center rounded-lg hover:bg-sand disabled:opacity-35 disabled:hover:bg-transparent"><ChevronRight className="size-5" /></button>
      </div>
    </div>
  )
}

export function Modal({ title, sub, onClose, wide, footer, children, z = 60 }: { title: string; sub?: string; onClose: () => void; wide?: boolean; footer?: React.ReactNode; children: React.ReactNode; z?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 grid place-items-end sm:place-items-center" style={{ zIndex: z }} role="dialog" aria-modal="true" aria-label={title}>
      <div className="qv-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={cx('adm-pop relative bg-white w-full flex flex-col max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-[0_16px_48px_rgba(35,31,32,0.22)]', wide ? 'sm:max-w-[1040px]' : 'sm:max-w-[560px]')}>
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="text-[21px] font-semibold leading-snug">{title}</h2>
            {sub && <p className="mt-0.5 text-sm text-mute">{sub}</p>}
          </div>
          <button aria-label="Đóng" onClick={onClose} className="-mr-2 -mt-1 size-11 grid place-items-center rounded-full text-mute hover:bg-sand shrink-0"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-line flex flex-wrap items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}

export function Confirm({ title, children, cancel = 'Quay lại', ok, onCancel, onOk, z = 70 }: { title: string; children: React.ReactNode; cancel?: string; ok: string; onCancel: () => void; onOk: () => void; z?: number }) {
  return (
    <Modal z={z} title={title} onClose={onCancel} footer={<><Btn onClick={onCancel}>{cancel}</Btn><Btn kind="primary" onClick={onOk}>{ok}</Btn></>}>
      <div className="text-base text-ink/90 space-y-2">{children}</div>
    </Modal>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-mute mb-1.5">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-[13px] text-mute">{hint}</span>}
    </label>
  )
}

export const textInput = (invalid?: boolean) =>
  cx('w-full min-h-11 px-3.5 rounded-lg bg-white text-[15px] ring-1 ring-inset focus:outline-2 focus:outline-brand', invalid ? 'ring-[#e0392b] bg-risk-bg' : 'ring-[#d8d2cf]')
