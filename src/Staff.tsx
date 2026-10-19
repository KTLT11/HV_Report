import { useState } from 'react'
import { Trophy, Wallet, Users } from 'lucide-react'
import { LevelBadge, Sheet, type Route } from './common'
import { levelFor } from './levels'
import { DEMO_STAFF, DEMO_STORE, KPI_OPTIONS, USER_PERIODS, commissionRows, commissionStanding, commissionTotal, formatKpi, formatMoney, formatNumber, kpiUnit, loyaltyFor, rate, staffKpi, staffStore, topStaff, type KpiKind, type PeriodKey } from './userData'
import logo from './imports/image.png'

export default function StaffDashboard({ go, period, setPeriod }: { go: (r: Route) => void; period: PeriodKey; setPeriod: (p: PeriodKey) => void }) {
  const [kpi, setKpi] = useState<KpiKind>('qty')
  const [leaderOpen, setLeaderOpen] = useState(false)
  const result = staffKpi(DEMO_STAFF.id, period, kpi)
  const level = levelFor(rate(result.actual, result.target))
  const rank = topStaff(period, kpi)
  const commission = commissionRows(DEMO_STAFF.id, period)
  const total = commissionTotal(DEMO_STAFF.id, period)
  const standing = commissionStanding(DEMO_STAFF.id, period)
  const loyalty = loyaltyFor(period)
  const leader = rank[0]

  return <div className="min-h-screen">
    <header className="bg-brand text-white relative max-lg:pt-[max(env(safe-area-inset-top),3.25rem)]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <img src={logo} alt="Hồng Vân Pharmacy" className="h-9 w-auto" />
        <span className="hidden sm:block border-l border-white/30 pl-3 text-sm text-white/80">Không gian Nhân viên</span>
        <div className="ml-auto relative group">
          <button aria-label="Tài khoản" className="size-9 rounded-full bg-white/20 font-semibold text-sm">TA</button>
          <div className="hidden group-hover:block group-focus-within:block absolute right-0 top-full z-50 w-56 rounded-lg border border-line bg-white text-ink shadow-lg p-2">
            <p className="px-2 py-1 text-sm font-semibold">{DEMO_STAFF.name}</p>
            <p className="px-2 text-xs text-mute">Nhân viên · {DEMO_STORE.name}</p>
            <button onClick={() => go({ page: 'login' })} className="mt-2 w-full rounded-md px-2 py-2 text-left hover:bg-sand">Đăng xuất</button>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-7 pb-16 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">Không gian Nhân viên · dữ liệu mẫu</p>
          <h1 className="mt-1 text-[30px] font-semibold">Tổng quan của tôi</h1>
          <p className="mt-1 text-mute">{DEMO_STAFF.name} · {DEMO_STORE.name} ({DEMO_STORE.location})</p>
        </div>
        <select aria-label="Kỳ" value={period} onChange={e => setPeriod(e.target.value as PeriodKey)} className="min-h-11 rounded-lg bg-sand px-4 font-semibold">{USER_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">KPI đã được giao:</span>
        <select aria-label="KPI đang xem" value={kpi} onChange={e => setKpi(e.target.value as KpiKind)} className="min-h-11 rounded-lg bg-sand px-4 font-semibold">{KPI_OPTIONS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
        <span className="text-sm text-mute">Chỉ chuyển chỉ tiêu đang xem, không thay đổi Target.</span>
      </div>

      <section aria-label="KPI cá nhân" className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-mute font-semibold">KPI cá nhân · {KPI_OPTIONS.find(([key]) => key === kpi)?.[1]}</p>
            <p className="mt-2 text-[38px] font-semibold">{rate(result.actual, result.target)}%</p>
            <p className="text-mute">hoàn thành · {formatKpi(result.actual, kpi)} / {formatKpi(result.target, kpi)}</p>
          </div>
          <LevelBadge level={level.key} label={level.label} />
        </div>
        <div className="mt-5 h-3 rounded-full bg-sand overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, rate(result.actual, result.target))}%`, backgroundColor: level.hex }} /></div>
        <p className="mt-3 font-medium">{result.actual >= result.target ? `Vượt mục tiêu ${formatKpi(result.actual - result.target, kpi)}` : `Còn ${formatKpi(result.target - result.actual, kpi)} để đạt mục tiêu`}</p>
      </section>

      <section aria-label="Khách tích điểm">
        <div className="flex items-center gap-2.5"><Users className="size-5 text-brand" /><h2 className="text-xl font-semibold">Khách tích điểm · cá nhân</h2></div>
        <p className="mt-1 text-sm text-mute">Dữ liệu mẫu cùng kỳ {period}. Tử số là số bill có khách tích điểm; mẫu số là tổng số khách đã bán.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">Bill có khách tích điểm</p><p className="mt-2 text-[28px] font-semibold">{formatNumber(loyalty.personal.bills)}</p></div>
          <div className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">Khách đã bán trong tháng</p><p className="mt-2 text-[28px] font-semibold">{formatNumber(loyalty.personal.customers)}</p></div>
        </div>
      </section>

      <section aria-label="Xếp hạng">
        <div className="flex items-center gap-2.5"><Trophy className="size-5 text-brand" /><h2 className="text-xl font-semibold">Xếp hạng · Top 5 toàn chuỗi</h2></div>
        <p className="mt-1 text-sm text-mute">Xếp theo tỷ lệ hoàn thành KPI {KPI_OPTIONS.find(([key]) => key === kpi)?.[1]?.toLowerCase()} trong {period}. Đơn vị: {kpiUnit(kpi)}.</p>
        <ol className="mt-4 rounded-xl border border-line bg-white divide-y divide-line">
          {rank.map((person, i) => (
            <li key={person.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="w-9 text-xl font-semibold text-brand">{i + 1}</span>
              <div className="flex-1 min-w-[200px]"><b>{person.name}</b><p className="text-sm text-mute">{staffStore(person.storeId).name} · {staffStore(person.storeId).location}</p></div>
              {i === 0 && (
                <>
                  <div className="text-right"><b>{person.pct}%</b><p className="text-sm text-mute">{formatKpi(person.actual, kpi)} / {formatKpi(person.target, kpi)}</p></div>
                  <button onClick={() => setLeaderOpen(true)} className="min-h-11 px-3 text-brand font-semibold">Xem chi tiết</button>
                </>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Hoa hồng">
        <div className="flex items-center gap-2.5"><Wallet className="size-5 text-brand" /><h2 className="text-xl font-semibold">Hoa hồng hàng trọng điểm</h2></div>
        <p className="mt-1 text-sm text-mute">Cá nhân · {period}. Số tiền minh họa, chưa phải chính sách hoa hồng.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[['Tổng hoa hồng cá nhân', formatMoney(total)], ['Thứ hạng toàn hệ thống', `${standing.rank} / ${standing.count}`], ['Mức của người đứng đầu', formatMoney(standing.leader)]].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-white p-5"><p className="text-sm text-mute">{label}</p><p className="mt-2 text-[25px] font-semibold">{value}</p></div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-line bg-white overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="bg-sand text-sm text-mute"><tr><th className="text-left px-4 py-3">Sản phẩm trọng điểm</th><th className="text-right px-4 py-3">Số lượng liên quan</th><th className="text-right px-4 py-3">Hoa hồng dòng</th></tr></thead>
            <tbody>{commission.map(r => <tr key={r.product.id} className="border-t border-line"><td className="px-4 py-3"><b>{r.product.name}</b><span className="block text-xs text-mute">{r.product.sku}</span></td><td className="px-4 py-3 text-right">{r.quantity} SP</td><td className="px-4 py-3 text-right font-semibold">{formatMoney(r.commission)}</td></tr>)}</tbody>
            <tfoot><tr className="border-t border-line bg-sand font-semibold"><td className="px-4 py-3">Tổng kỳ</td><td /><td className="px-4 py-3 text-right">{formatMoney(total)}</td></tr></tfoot>
          </table>
        </div>
      </section>
    </main>

    {leaderOpen && (
      <Sheet eyebrow="Hạng 1 · toàn chuỗi" title={leader.name} sub={`${staffStore(leader.storeId).name} · ${staffStore(leader.storeId).location}`} cta="Đóng" onClose={() => setLeaderOpen(false)} onCta={() => setLeaderOpen(false)}>
        <div className="rounded-xl bg-sand p-5">
          <p className="text-sm text-mute">KPI {KPI_OPTIONS.find(([key]) => key === kpi)?.[1]} · {period}</p>
          <p className="mt-2 text-[32px] font-semibold">{leader.pct}%</p>
          <p className="mt-2">Thực đạt {formatKpi(leader.actual, kpi)} / Target {formatKpi(leader.target, kpi)}</p>
        </div>
        <p className="mt-4 text-sm text-mute">Thứ hạng minh họa theo tỷ lệ hoàn thành KPI.</p>
      </Sheet>
    )}
  </div>
}
