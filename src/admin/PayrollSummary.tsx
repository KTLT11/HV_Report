import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { GROUPS, PAYROLL_PERIODS, PROD_BY_ID, STORES, groupLabel, norm, payrollRowFor, periodLabel, pushDetailFor, skuOf } from './data'
import { Modal, PageHead, Pager, SearchBox, Select } from './ui'

const SIZE = 14

export default function PayrollSummary() {
  const [period, setPeriod] = useState(PAYROLL_PERIODS[PAYROLL_PERIODS.length - 1][0])
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [storeId, setStoreId] = useState<number | null>(null)

  const rows = useMemo(() => STORES.map((s) => payrollRowFor(period, s.id)), [period])
  const totalPush = rows.reduce((a, r) => a + r.pushCount, 0)
  const totalDone = rows.reduce((a, r) => a + r.pushDone, 0)

  const setUi = (f: Partial<{ group: string; q: string }>) => {
    if (f.group !== undefined) setGroup(f.group)
    if (f.q !== undefined) setQ(f.q)
    setPage(1)
  }
  const list = rows.filter((r) => (group === 'all' || String(r.store.group) === group) && (!q || norm(r.store.name + r.store.code + r.store.area).includes(norm(q))))
  const view = list.slice((page - 1) * SIZE, page * SIZE)
  const detailRows = storeId !== null ? pushDetailFor(period, storeId) : []

  return (
    <div className="pb-14 space-y-6">
      <PageHead title="Tổng hợp mã cần đẩy · phục vụ tính lương" sub="Dữ liệu đầu vào cho tổng kết chỉ tiêu theo quầy; chưa thiết kế bảng lương hoặc ngày chốt lương." />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Cửa hàng</p><p className="mt-1 text-[26px] font-semibold">{rows.length}</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Tổng mã cần đẩy</p><p className="mt-1 text-[26px] font-semibold">{totalPush}</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-mute">Tổng mã đạt mục tiêu</p><p className="mt-1 text-[26px] font-semibold text-[#1e7f5c]">{totalDone}</p></div>
      </section>

      <div className="flex flex-wrap gap-2.5">
        <Select label="Kỳ" value={period} onChange={(v) => { setPeriod(v); setPage(1) }} options={PAYROLL_PERIODS} className="w-full sm:w-[190px]" />
        <Select label="Nhóm quầy" value={group} onChange={(v) => setUi({ group: v })} options={[['all', 'Tất cả nhóm'], ...GROUPS.map((g): [string, string] => [String(g.key), g.label])]} className="w-full sm:w-[180px]" />
        <SearchBox value={q} onChange={(v) => setUi({ q: v })} placeholder="Tìm cửa hàng..." className="w-full sm:w-[240px]" />
      </div>

      <div className="rounded-xl border border-line bg-white overflow-x-auto">
        {view.length === 0 ? (
          <p className="py-12 text-center text-mute">Không có cửa hàng phù hợp.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-sand text-left text-mute"><tr><th className="px-4 py-3">Cửa hàng</th><th className="px-4 py-3">Nhóm</th><th className="px-4 py-3 text-right">Mã cần đẩy</th><th className="px-4 py-3 text-right">Mã đạt mục tiêu</th><th className="px-4 py-3 text-right">Tỷ lệ</th><th className="px-4 py-3 w-10" /></tr></thead>
            <tbody>{view.map((r) => (
              <tr key={r.store.id} onClick={() => setStoreId(r.store.id)} className="border-t border-line hover:bg-sand/70 cursor-pointer">
                <td className="px-4 py-3"><b>{r.store.name}</b><span className="block text-xs text-mute">{r.store.code} · {r.store.area}</span></td>
                <td className="px-4 py-3">{groupLabel(r.store.group)}</td>
                <td className="px-4 py-3 text-right">{r.pushCount}</td>
                <td className="px-4 py-3 text-right">{r.pushDone}</td>
                <td className="px-4 py-3 text-right font-semibold">{r.pushCount ? Math.round((r.pushDone / r.pushCount) * 100) : 0}%</td>
                <td className="px-4 py-3 text-right"><ChevronRight className="size-4 text-mute inline" /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <div className="border-t border-line px-4"><Pager page={page} size={SIZE} total={list.length} onPage={setPage} /></div>
      </div>

      {storeId !== null && (
        <Modal wide title={STORES[storeId].name} sub={`${STORES[storeId].code} · ${groupLabel(STORES[storeId].group)} · ${periodLabel(period)}`} onClose={() => setStoreId(null)}>
          <p className="mb-3 text-sm text-mute">{detailRows.length} mã cần đẩy · {detailRows.filter((r) => r.done).length} mã đạt mục tiêu</p>
          <ul className="divide-y divide-line">
            {detailRows.map((r) => {
              const p = PROD_BY_ID.get(r.productId)!
              return (
                <li key={r.productId} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><span className="text-xs text-mute">{skuOf(p)} · {r.sold}/{r.target} SP</span></span>
                  <span className={r.done ? 'text-[#1e7f5c] font-semibold' : 'text-[#c22d20] font-semibold'}>{r.done ? 'Đạt' : 'Chưa đạt'}</span>
                </li>
              )
            })}
          </ul>
        </Modal>
      )}
    </div>
  )
}
