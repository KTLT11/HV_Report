import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Sheet, TopNav, ProductThumb, type Route } from './common'
import { DEMO_STORE, USER_PERIODS, formatNumber, inventoryFor, type PeriodKey } from './userData'

export default function Inventory({ go, period, setPeriod }: { go: (r: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<number | null>(null)
  const rows = useMemo(() => inventoryFor(period), [period])
  const visible = rows.filter(r => status === 'all' || (status === 'warning') === r.warning)
  const warning = rows.filter(r => r.warning).length
  const detail = rows.find(r => r.product.id === selected)
  const previous = period === '2026-10' ? '09/2026' : '08/2026'
  return <div className="min-h-screen"><TopNav active={3} go={go} />
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-7 pb-16">
      <header className="flex flex-wrap justify-between gap-4">
        <div><h1 className="text-[30px] font-semibold">Hàng tồn chưa bán</h1><p className="mt-1 text-mute">{DEMO_STORE.name} · {DEMO_STORE.location}</p></div>
        <select aria-label="Kỳ" value={period} onChange={e => { setPeriod(e.target.value as PeriodKey); setSelected(null) }} className="min-h-11 rounded-lg bg-sand px-4 font-semibold">{USER_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
      </header>
      <p className="mt-5 rounded-lg bg-sand px-4 py-3 text-sm text-mute">Dữ liệu mẫu: mã còn tồn từ {previous}, không bán và không nhập trong tháng đó; đối chiếu số bán tháng {period.slice(5)}/2026 với 10% tồn đầu kỳ. Bằng ngưỡng được xem là đạt.</p>
      <section className="mt-6 grid grid-cols-3 gap-3">
        {[['Mã theo dõi', rows.length], ['Dưới ngưỡng', warning], ['Đạt ngưỡng', rows.length - warning]].map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-white p-4 sm:p-5"><p className="text-sm text-mute">{label}</p><p className="mt-1 text-[26px] font-semibold">{value}</p></div>)}
      </section>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Danh sách mã hàng</h2><label className="text-sm font-medium">Trạng thái <select value={status} onChange={e => setStatus(e.target.value)} className="ml-2 min-h-11 rounded-lg bg-sand px-3"><option value="all">Tất cả</option><option value="warning">Dưới ngưỡng</option><option value="ok">Đạt ngưỡng</option></select></label></div>
      <p className="mt-2 text-sm text-mute">{visible.length} / {rows.length} mã phù hợp</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
        {visible.length === 0 ? <p className="py-12 text-center text-mute">Không có mã hàng phù hợp bộ lọc.</p> :
          <table className="w-full min-w-[820px] text-sm"><thead className="bg-sand text-left text-mute"><tr><th className="px-4 py-3">Mã / sản phẩm</th><th className="px-4 py-3 text-right">Tồn đầu kỳ</th><th className="px-4 py-3 text-right">Đã bán tháng này</th><th className="px-4 py-3 text-right">Ngưỡng 10%</th><th className="px-4 py-3 text-right">Chênh lệch</th><th className="px-4 py-3">Trạng thái</th></tr></thead><tbody>{visible.map(r => <tr key={r.product.id} onClick={() => setSelected(r.product.id)} className="border-t border-line hover:bg-sand/70 cursor-pointer"><td className="px-4 py-3"><b>{r.product.name}</b><span className="block text-xs text-mute">{r.product.sku}</span></td><td className="px-4 py-3 text-right">{r.opening} SP</td><td className="px-4 py-3 text-right">{r.currentSold} SP</td><td className="px-4 py-3 text-right">{r.threshold} SP</td><td className="px-4 py-3 text-right">{r.currentSold - r.threshold > 0 ? '+' : ''}{r.currentSold - r.threshold} SP</td><td className="px-4 py-3">{r.warning ? <span className="inline-flex gap-1 text-[#c22d20] font-semibold"><AlertTriangle className="size-4" />Dưới ngưỡng</span> : <span className="inline-flex gap-1 text-[#1e7f5c] font-semibold"><CheckCircle2 className="size-4" />Đạt ngưỡng</span>}</td></tr>)}</tbody></table>}
      </div>
      {detail && <Sheet eyebrow="Chi tiết hàng tồn" title={detail.product.name} sub={detail.product.sku} lead={<ProductThumb i={detail.product.thumb} />} cta="Đóng" onCta={() => setSelected(null)} onClose={() => setSelected(null)}>
        <div className="space-y-4 text-[15px]"><p>Quầy: <b>{DEMO_STORE.name}</b></p><p>Tháng trước ({previous}): <b>không bán, không nhập</b>; mã còn tồn đầu kỳ này.</p><div className="rounded-xl bg-sand p-4 space-y-2"><p>Tồn đầu kỳ: <b>{formatNumber(detail.opening)} SP</b></p><p>Ngưỡng theo dõi 10%: <b>{detail.threshold} SP</b></p><p>Đã bán tháng này: <b>{detail.currentSold} SP</b></p></div><p className="font-semibold">{detail.warning ? `Cảnh báo: còn thiếu ${detail.threshold - detail.currentSold} SP để đạt ngưỡng theo dõi.` : `Đã đạt ngưỡng theo dõi, cao hơn hoặc bằng ${detail.threshold} SP.`}</p><p className="text-sm text-mute">Ngưỡng dùng để minh họa báo cáo, chưa phải chính sách tồn kho chính thức.</p></div>
      </Sheet>}
    </main>
  </div>
}
