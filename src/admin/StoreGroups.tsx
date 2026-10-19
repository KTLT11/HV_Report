import { useMemo, useState } from 'react'
import { CURRENT_PERIOD, GROUPS, STORES, headcountOf, norm, periodLabel } from './data'
import { PageHead, Pager, SearchBox, Select, cx, useAdmin } from './ui'

const SIZE = 12

export default function StoreGroups() {
  const { groupOf, setGroup } = useAdmin()
  const [filterGroup, setFilterGroup] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [viewBy, setViewBy] = useState<'store' | 'staff'>('store')
  const [focusGroup, setFocusGroup] = useState(0)

  const rows = useMemo(() => STORES.map((s) => ({ s, group: groupOf(s.id) })), [groupOf])
  const countOf = (g: number) => rows.filter((r) => r.group === g).length
  const list = rows.filter((r) => (filterGroup === 'all' || String(r.group) === filterGroup) && (!q || norm(r.s.name + r.s.code + r.s.area).includes(norm(q))))
  const view = list.slice((page - 1) * SIZE, page * SIZE)
  const setUi = (f: string, qq: string) => { setFilterGroup(f); setQ(qq); setPage(1) }

  const g = GROUPS[focusGroup]
  const storesInGroup = rows.filter((r) => r.group === focusGroup)

  return (
    <div className="pb-14 space-y-8">
      <PageHead title="Nhóm quầy" sub="Phân loại cửa hàng theo khả năng bán, dùng để tham chiếu mức hàng cần đẩy. Không thay thế Target riêng của từng cửa hàng." />

      <section aria-label="Tổng hợp theo nhóm" className="rounded-xl border border-line bg-white overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
          {GROUPS.map((gr) => (
            <button key={gr.key} onClick={() => setFocusGroup(gr.key)} className={cx('px-5 py-4 text-left hover:bg-sand transition-colors', focusGroup === gr.key ? 'bg-tint' : 'bg-white')}>
              <p className="text-[13px] text-mute font-medium">{gr.label}</p>
              <p className="mt-1 text-[24px] leading-tight font-semibold">{countOf(gr.key)} <span className="text-[14px] font-normal text-mute">cửa hàng</span></p>
              <p className="mt-0.5 text-[13px] text-mute">{gr.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Mức hàng cần đẩy theo nhóm" className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-semibold">Hàng {g.label.toLowerCase()} cần đẩy</h2>
            <p className="mt-1 text-sm text-mute">{g.desc} · {storesInGroup.length} cửa hàng thuộc nhóm · Kỳ {periodLabel(CURRENT_PERIOD)}</p>
          </div>
          <div className="inline-flex rounded-lg bg-sand p-1">
            <button onClick={() => setViewBy('store')} className={cx('px-3.5 min-h-9 rounded-md text-[14px] font-semibold transition-colors', viewBy === 'store' ? 'bg-white shadow-sm' : 'text-mute')}>Theo quầy</button>
            <button onClick={() => setViewBy('staff')} className={cx('px-3.5 min-h-9 rounded-md text-[14px] font-semibold transition-colors', viewBy === 'staff' ? 'bg-white shadow-sm' : 'text-mute')}>Theo nhân viên</button>
          </div>
        </div>
        {viewBy === 'store' ? (
          <p className="mt-4 text-[34px] font-semibold tabular-nums">{g.monthlyPushTarget} SP<span className="text-base font-normal text-mute">/tháng · mỗi quầy</span></p>
        ) : (
          <>
            <p className="mt-4 text-sm text-mute">Ước tính theo số nhân viên minh họa của từng quầy (3–6 người); mức mỗi nhân viên = mức nhóm ÷ số nhân viên quầy đó.</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-sand text-left text-mute"><tr><th className="px-4 py-2.5">Cửa hàng</th><th className="px-4 py-2.5 text-right">Nhân viên</th><th className="px-4 py-2.5 text-right">Mức/nhân viên</th></tr></thead>
                <tbody>{storesInGroup.slice(0, 8).map((r) => { const h = headcountOf(r.s.id); return (
                  <tr key={r.s.id} className="border-t border-line"><td className="px-4 py-2.5">{r.s.name}</td><td className="px-4 py-2.5 text-right">{h} người</td><td className="px-4 py-2.5 text-right font-semibold">{Math.round(g.monthlyPushTarget / h)} SP</td></tr>
                )})}</tbody>
              </table>
              {storesInGroup.length > 8 && <p className="px-4 py-2.5 text-[13px] text-mute border-t border-line">Và {storesInGroup.length - 8} cửa hàng khác thuộc {g.label.toLowerCase()}.</p>}
            </div>
          </>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Gán nhóm cho cửa hàng</h2>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <SearchBox value={q} onChange={(v) => setUi(filterGroup, v)} placeholder="Tìm cửa hàng..." className="w-full sm:w-[220px]" />
            <Select label="Nhóm" value={filterGroup} onChange={(v) => setUi(v, q)} options={[['all', 'Tất cả nhóm'], ...GROUPS.map((gr): [string, string] => [String(gr.key), gr.label])]} className="w-full sm:w-[180px]" />
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-line bg-white overflow-hidden">
          {list.length === 0 ? (
            <p className="py-10 text-center text-mute">Không có cửa hàng phù hợp.</p>
          ) : (
            <table className="w-full text-[15px]">
              <thead className="bg-sand text-left text-[13px] text-mute"><tr><th className="px-5 py-3 font-semibold">Cửa hàng</th><th className="px-5 py-3 font-semibold">Khu vực</th><th className="px-5 py-3 font-semibold w-52">Nhóm quầy</th></tr></thead>
              <tbody>
                {view.map((r) => (
                  <tr key={r.s.id} className="border-t border-line">
                    <td className="px-5 py-3"><p className="font-semibold">{r.s.name}</p><p className="text-[13px] text-mute">{r.s.code}</p></td>
                    <td className="px-5 py-3 text-mute">{r.s.area}</td>
                    <td className="px-5 py-3">
                      <Select label={`Nhóm của ${r.s.name}`} value={String(r.group)} onChange={(v) => setGroup(r.s.id, Number(v))} options={GROUPS.map((gr): [string, string] => [String(gr.key), gr.label])} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t border-line px-4"><Pager page={page} size={SIZE} total={list.length} onPage={setPage} /></div>
        </div>
      </section>
    </div>
  )
}
