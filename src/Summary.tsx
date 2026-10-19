import { useState } from 'react'
import { Sheet, ProductThumb, TopNav, type Route } from './common'
import { DEMO_STORE, USER_PERIODS, productsFor, rate, type PeriodKey } from './userData'

export default function Summary({ go, period, setPeriod }: { go: (r: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const [open, setOpen] = useState(false)
  const rows = productsFor(period).filter(p => p.focus)
  const met = rows.filter(p => p.actual >= p.target).length
  return <div className="min-h-screen"><TopNav active={4} go={go} /><main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-7 pb-16">
    <header className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[30px] font-semibold">Tổng kết chỉ tiêu quầy</h1><p className="mt-1 text-mute">{DEMO_STORE.name} · {DEMO_STORE.location}</p></div><select aria-label="Kỳ" value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="min-h-11 rounded-lg bg-sand px-4 font-semibold">{USER_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></header>
    <p className="mt-4 text-sm text-mute">Dữ liệu đầu vào minh họa để tổng kết chỉ tiêu; không tính lương hoặc thưởng. Số mã là số SKU, không phải số đơn vị sản phẩm.</p>
    <section className="mt-6 grid gap-4 sm:grid-cols-3">{[['Mã hàng cần đẩy', rows.length], ['Mã đạt mục tiêu', met], ['Mã chưa đạt', rows.length - met]].map(([label, n]) => <div key={label} className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">{label} · quầy</p><p className="mt-2 text-[32px] font-semibold">{n}</p></div>)}</section>
    <div className="mt-6 rounded-xl bg-sand p-5 flex flex-wrap items-center justify-between gap-4"><div><p className="font-semibold">{met}/{rows.length} mã hàng cần đẩy đã đạt mục tiêu</p><p className="mt-1 text-sm text-mute">Trạng thái tổng hợp: {met === rows.length ? 'Đã đạt tất cả' : 'Còn mã chưa đạt'}</p></div><button onClick={() => setOpen(true)} className="min-h-11 rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-deep">Xem danh sách mã</button></div>
    {open && <Sheet eyebrow="Danh sách mã cần đẩy" title={USER_PERIODS.find(p => p.key === period)?.label} sub={DEMO_STORE.name} cta="Đóng" onCta={() => setOpen(false)} onClose={() => setOpen(false)}><p className="mb-3 text-sm text-mute">{rows.length} mã hàng · {met} mã đạt mục tiêu</p><ul className="divide-y divide-line">{rows.map(p => <li key={p.id} className="flex items-center gap-3 py-3"><ProductThumb i={p.thumb} size={42} /><span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><span className="text-xs text-mute">{p.sku} · {p.actual}/{p.target} SP · {rate(p.actual, p.target)}%</span></span><span className={p.actual >= p.target ? 'text-[#1e7f5c] font-semibold' : 'text-[#c22d20] font-semibold'}>{p.actual >= p.target ? 'Đạt' : 'Chưa đạt'}</span></li>)}</ul></Sheet>}
  </main></div>
}
