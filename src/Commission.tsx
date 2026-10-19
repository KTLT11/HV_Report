import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Sheet, TopNav, type Route } from './common'
import { DEMO_STORE, USER_PERIODS, commissionRows, commissionStanding, commissionTotal, formatMoney, storeStaff, type PeriodKey } from './userData'

export default function Commission({ go, period, setPeriod }: { go: (r: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const [staffId, setStaffId] = useState<string | null>(null)

  const roster = useMemo(() => storeStaff(DEMO_STORE.id), [])
  const rows = useMemo(
    () => roster.map((s) => ({ ...s, total: commissionTotal(s.id, period), standing: commissionStanding(s.id, period) })).sort((a, b) => b.total - a.total),
    [roster, period],
  )
  const storeTotal = rows.reduce((a, r) => a + r.total, 0)
  const topStandingCount = rows[0]?.standing.count ?? 0

  const detail = staffId ? rows.find((r) => r.id === staffId) : null
  const detailRows = staffId ? commissionRows(staffId, period) : []

  return (
    <div className="min-h-screen">
      <TopNav active={4} go={go} />
      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-7 pb-16 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold">Hoa hồng</h1>
            <p className="mt-1 text-mute">{DEMO_STORE.name} ({DEMO_STORE.location}) · theo dõi hoa hồng hàng trọng điểm của quầy và từng nhân viên</p>
          </div>
          <select aria-label="Kỳ" value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="min-h-11 rounded-lg bg-sand px-4 font-semibold">
            {USER_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <p className="text-sm uppercase tracking-wide text-mute font-semibold">Tổng hoa hồng toàn quầy · {period}</p>
          <p className="mt-2 text-[38px] font-semibold">{formatMoney(storeTotal)}</p>
          <p className="mt-1 text-mute">{roster.length} nhân viên · thứ hạng tính trên {topStandingCount} nhân viên toàn hệ thống</p>
        </section>

        <section>
          <div className="flex items-center gap-2.5"><Trophy className="size-5 text-brand" /><h2 className="text-xl font-semibold">Hoa hồng theo nhân viên</h2></div>
          <p className="mt-1 text-sm text-mute">Xếp theo tổng hoa hồng hàng trọng điểm trong {period}. Số tiền minh họa, chưa phải chính sách hoa hồng.</p>
          <ol className="mt-4 rounded-xl border border-line bg-white divide-y divide-line">
            {rows.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="w-9 text-xl font-semibold text-brand">{i + 1}</span>
                <div className="flex-1 min-w-[200px]">
                  <b>{r.name}</b>
                  <p className="text-sm text-mute">Hạng {r.standing.rank}/{r.standing.count} toàn hệ thống</p>
                </div>
                <div className="text-right"><b>{formatMoney(r.total)}</b></div>
                <button onClick={() => setStaffId(r.id)} className="min-h-11 px-3 text-brand font-semibold">Xem chi tiết</button>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {detail && (
        <Sheet eyebrow="Chi tiết hoa hồng" title={detail.name} sub={`${DEMO_STORE.name} · Hạng ${detail.standing.rank}/${detail.standing.count} toàn hệ thống`} cta="Đóng" onClose={() => setStaffId(null)} onCta={() => setStaffId(null)}>
          <div className="rounded-xl bg-sand p-5">
            <p className="text-sm text-mute">Tổng hoa hồng · {period}</p>
            <p className="mt-2 text-[32px] font-semibold">{formatMoney(detail.total)}</p>
            <p className="mt-2">Mức của người đứng đầu hệ thống: {formatMoney(detail.standing.leader)}</p>
          </div>
          <div className="mt-5 rounded-xl border border-line overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-sand text-sm text-mute"><tr><th className="text-left px-4 py-3">Sản phẩm trọng điểm</th><th className="text-right px-4 py-3">Số lượng</th><th className="text-right px-4 py-3">Hoa hồng</th></tr></thead>
              <tbody>{detailRows.map((r) => (
                <tr key={r.product.id} className="border-t border-line"><td className="px-4 py-3"><b>{r.product.name}</b><span className="block text-xs text-mute">{r.product.sku}</span></td><td className="px-4 py-3 text-right">{r.quantity} SP</td><td className="px-4 py-3 text-right font-semibold">{formatMoney(r.commission)}</td></tr>
              ))}</tbody>
              <tfoot><tr className="border-t border-line bg-sand font-semibold"><td className="px-4 py-3">Tổng kỳ</td><td /><td className="px-4 py-3 text-right">{formatMoney(detail.total)}</td></tr></tfoot>
            </table>
          </div>
        </Sheet>
      )}
    </div>
  )
}
