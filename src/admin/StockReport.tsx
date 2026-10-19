import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { GROUPS, PROD_BY_ID, STOCK_PERIODS, STORES, fmtVal, groupLabel, norm, skuOf, stockRowsFor, type StockRow } from './data'
import { Modal, PageHead, Pager, SearchBox, Select } from './ui'

const SIZE = 14
type Row = StockRow & { storeId: number }

export default function StockReport() {
  const [period, setPeriod] = useState(STOCK_PERIODS[0][0])
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Row | null>(null)

  const allRows = useMemo<Row[]>(() => STORES.flatMap((s) => stockRowsFor(period, s.id).map((r) => ({ ...r, storeId: s.id }))), [period])
  const warning = allRows.filter((r) => r.warning).length
  const storesWithWarning = new Set(allRows.filter((r) => r.warning).map((r) => r.storeId)).size

  const setUi = (f: Partial<{ group: string; q: string; status: string }>) => {
    if (f.group !== undefined) setGroup(f.group)
    if (f.q !== undefined) setQ(f.q)
    if (f.status !== undefined) setStatus(f.status)
    setPage(1)
  }

  const list = allRows.filter((r) => {
    const store = STORES[r.storeId]
    if (group !== 'all' && String(store.group) !== group) return false
    if (status === 'warning' && !r.warning) return false
    if (status === 'ok' && r.warning) return false
    if (q) { const p = PROD_BY_ID.get(r.productId)!; if (!norm(store.name + store.code + p.name + skuOf(p)).includes(norm(q))) return false }
    return true
  })
  const view = list.slice((page - 1) * SIZE, page * SIZE)
  const prevLabel = period === '2026-10' ? 'Tháng 09/2026' : 'Tháng 08/2026'

  return (
    <div className="pb-14 space-y-6">
      <PageHead title="Hàng tồn chưa bán · toàn hệ thống" sub="Mã còn tồn từ kỳ trước, không bán và không nhập trong kỳ đó, đối chiếu số bán kỳ hiện tại với ngưỡng 10% tồn đầu kỳ." />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Mã theo dõi</p><p className="mt-1 text-[26px] font-semibold">{allRows.length}</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Mã dưới ngưỡng</p><p className="mt-1 text-[26px] font-semibold text-[#c22d20]">{warning}</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Cửa hàng có cảnh báo</p><p className="mt-1 text-[26px] font-semibold">{storesWithWarning}</p></div>
      </section>

      <div className="flex flex-wrap gap-2.5">
        <Select label="Kỳ" value={period} onChange={(v) => { setPeriod(v); setPage(1) }} options={STOCK_PERIODS} className="w-full sm:w-[190px]" />
        <Select label="Nhóm quầy" value={group} onChange={(v) => setUi({ group: v })} options={[['all', 'Tất cả nhóm'], ...GROUPS.map((g): [string, string] => [String(g.key), g.label])]} className="w-full sm:w-[180px]" />
        <SearchBox value={q} onChange={(v) => setUi({ q: v })} placeholder="Tìm cửa hàng hoặc mã sản phẩm..." className="w-full sm:w-[260px]" />
        <Select label="Trạng thái" value={status} onChange={(v) => setUi({ status: v })} options={[['all', 'Tất cả trạng thái'], ['warning', 'Dưới ngưỡng'], ['ok', 'Đạt ngưỡng']]} className="w-full sm:w-[180px]" />
      </div>
      <p className="text-sm text-mute">{list.length} / {allRows.length} dòng phù hợp · Tháng trước ({prevLabel}): không bán, không nhập.</p>

      <div className="rounded-xl border border-line bg-white overflow-x-auto">
        {view.length === 0 ? (
          <p className="py-12 text-center text-mute">Không có dữ liệu phù hợp bộ lọc.</p>
        ) : (
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-sand text-left text-mute"><tr><th className="px-4 py-3">Cửa hàng</th><th className="px-4 py-3">Mã / sản phẩm</th><th className="px-4 py-3 text-right">Tồn đầu kỳ</th><th className="px-4 py-3 text-right">Đã bán</th><th className="px-4 py-3 text-right">Ngưỡng 10%</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
            <tbody>{view.map((r) => {
              const store = STORES[r.storeId]
              const p = PROD_BY_ID.get(r.productId)!
              return (
                <tr key={`${r.storeId}-${r.productId}`} onClick={() => setDetail(r)} className="border-t border-line hover:bg-sand/70 cursor-pointer">
                  <td className="px-4 py-3"><b>{store.name}</b><span className="block text-xs text-mute">{store.code} · {groupLabel(store.group)}</span></td>
                  <td className="px-4 py-3"><b>{p.name}</b><span className="block text-xs text-mute">{skuOf(p)}</span></td>
                  <td className="px-4 py-3 text-right">{r.opening} SP</td>
                  <td className="px-4 py-3 text-right">{r.currentSold} SP</td>
                  <td className="px-4 py-3 text-right">{r.threshold} SP</td>
                  <td className="px-4 py-3">{r.warning ? <span className="inline-flex gap-1 text-[#c22d20] font-semibold"><AlertTriangle className="size-4" />Dưới ngưỡng</span> : <span className="inline-flex gap-1 text-[#1e7f5c] font-semibold"><CheckCircle2 className="size-4" />Đạt ngưỡng</span>}</td>
                </tr>
              )
            })}</tbody>
          </table>
        )}
        <div className="border-t border-line px-4"><Pager page={page} size={SIZE} total={list.length} onPage={setPage} /></div>
      </div>

      {detail && (() => {
        const store = STORES[detail.storeId]
        const p = PROD_BY_ID.get(detail.productId)!
        return (
          <Modal title={p.name} sub={`${skuOf(p)} · ${store.name} · ${store.code}`} onClose={() => setDetail(null)}>
            <div className="space-y-3 text-[15px]">
              <p>Nhóm quầy: <b>{groupLabel(store.group)}</b></p>
              <div className="rounded-xl bg-sand p-4 space-y-2">
                <p>Tồn đầu kỳ: <b>{fmtVal('qty', detail.opening)}</b></p>
                <p>Ngưỡng theo dõi 10%: <b>{fmtVal('qty', detail.threshold)}</b></p>
                <p>Đã bán kỳ này: <b>{fmtVal('qty', detail.currentSold)}</b></p>
              </div>
              <p className="font-semibold">{detail.warning ? `Cảnh báo: còn thiếu ${detail.threshold - detail.currentSold} SP để đạt ngưỡng theo dõi.` : 'Đã đạt ngưỡng theo dõi.'}</p>
              <p className="text-sm text-mute">Ngưỡng dùng để minh họa báo cáo, chưa phải chính sách tồn kho chính thức.</p>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}
