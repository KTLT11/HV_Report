import { useMemo, useState } from 'react'
import { Check, ChevronRight, Store } from 'lucide-react'
import { DEFAULT_LEVELS } from '../levels'
import { CURRENT_PERIOD, STORES, periodLabel, summarize, type Status } from './data'
import { PageHead, SearchBox, Select, cx, useAdmin } from './ui'

const KPI = 'qty' as const
const DOT: Record<Status, string> = { done: 'bg-[#3d9a73]', partial: 'bg-[#d9a441]', none: 'bg-[#b8b2b0]' }
const AREAS: [string, string][] = [['all', 'Tất cả'], ...Array.from(new Set(STORES.map((s) => s.area))).map((a): [string, string] => [a, a])]

export default function Overview() {
  const { cfgOf, go, setKpi, setPeriod, setListUi } = useAdmin()
  const [area, setArea] = useState('all')
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)

  const rows = useMemo(() => STORES.map((s) => { const c = cfgOf(CURRENT_PERIOD, KPI, s.id); return { s, ...summarize(s, c), storeTarget: c.storeTarget } }), [cfgOf])
  const count = (st: Status) => rows.filter((r) => r.status === st).length
  const todo = rows.filter((r) => r.status !== 'done').sort((a, b) => (a.status === b.status ? a.s.id - b.s.id : a.status === 'none' ? -1 : 1))
  const list = todo.filter((r) => (area === 'all' || r.s.area === area) && (!q || r.s.name.toLowerCase().includes(q.toLowerCase())))
  const shown = all ? list : list.slice(0, 6)

  const levelsReady = DEFAULT_LEVELS.length === 5 && DEFAULT_LEVELS.every((l) => l.min !== null && l.msg.trim() !== '')
  const checks = ['5 mức đánh giá', 'Màu trạng thái', 'Thông điệp động viên']

  const openStore = (id: number) => { setKpi(KPI); setPeriod(CURRENT_PERIOD); go({ name: 'store', id }) }
  const goList = (status: string) => { setKpi(KPI); setPeriod(CURRENT_PERIOD); setListUi({ q: '', status }); go({ name: 'target' }) }
  const info = (r: (typeof rows)[number]) =>
    r.scope === 0 ? 'Chưa có sản phẩm trong phạm vi cửa hàng'
    : r.configured === 0 ? (r.status === 'none' ? 'Chưa thiết lập Target kỳ hiện tại' : 'Chưa có Target cho sản phẩm')
    : r.configured < r.scope ? `${r.configured} / ${r.scope} sản phẩm đã có Target`
    : 'Có thay đổi sản phẩm chưa được cập nhật Target'
  const cta = (r: (typeof rows)[number]) => (r.configured === 0 ? 'Thiết lập Target' : r.configured < r.scope ? 'Tiếp tục cấu hình' : 'Cập nhật Target')

  const stat = (st: Status, label: string, filter: string) => (
    <button onClick={() => goList(filter)} className="bg-white px-5 py-4 text-left hover:bg-sand transition-colors">
      <p className="text-[28px] leading-tight font-semibold">{count(st)}</p>
      <p className="mt-0.5 flex items-center gap-2 text-[14px] text-mute font-medium"><span className={cx('size-2 rounded-full', DOT[st])} />{label}</p>
    </button>
  )

  return (
    <div className="pb-14 space-y-8">
      <PageHead title="Tổng quan cấu hình" sub="Theo dõi tình trạng thiết lập KPI và Target của các cửa hàng trong kỳ hiện tại." />

      <section aria-label="Tổng quan kỳ hiện tại" className="rounded-xl border border-line bg-white overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
          <div className="bg-white px-5 py-4"><p className="text-[13px] text-mute font-medium">Kỳ hiện tại</p><p className="mt-1 text-[19px] leading-tight font-semibold">{periodLabel(CURRENT_PERIOD)}</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[13px] text-mute font-medium">KPI đang áp dụng</p><p className="mt-1 text-[19px] leading-tight font-semibold">Số lượng bán</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[13px] text-mute font-medium">Đơn vị</p><p className="mt-1 text-[19px] leading-tight font-semibold">Sản phẩm (SP)</p></div>
          <div className="bg-white px-5 py-4"><p className="text-[13px] text-mute font-medium">Tổng cửa hàng</p><p className="mt-1 text-[19px] leading-tight font-semibold">{rows.length}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-line border-t border-line">
          {stat('done', 'Đã hoàn tất', 'done')}
          {stat('partial', 'Chưa hoàn tất', 'partial')}
          {stat('none', 'Chưa cấu hình', 'none')}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Cấu hình đánh giá</h2>
        <div className="mt-3 rounded-xl border border-line bg-white px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          <p className="flex items-center gap-2 font-semibold"><span className={cx('size-2 rounded-full', levelsReady ? 'bg-[#3d9a73]' : 'bg-[#d9a441]')} />{levelsReady ? 'Sẵn sàng áp dụng' : 'Chưa hoàn tất'}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-mute">
            {checks.map((c) => <li key={c} className="inline-flex items-center gap-1.5"><Check className={cx('size-4', levelsReady ? 'text-[#3d9a73]' : 'text-mute/50')} />{c}</li>)}
          </ul>
          <button onClick={() => go({ name: 'threshold' })} className="ml-auto inline-flex items-center gap-1 min-h-11 text-[15px] font-semibold text-brand hover:text-brand-deep">{levelsReady ? 'Xem cấu hình' : 'Hoàn thiện cấu hình'}<ChevronRight className="size-4" /></button>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Cần hoàn thiện</h2>
            <p className="mt-0.5 text-sm text-mute">{todo.length} cửa hàng chưa hoàn tất cấu hình Target trong kỳ hiện tại</p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <Select label="Khu vực" value={area} onChange={setArea} options={AREAS} className="w-full sm:w-[180px]" />
            <SearchBox value={q} onChange={setQ} placeholder="Tìm cửa hàng..." className="w-full sm:w-[220px]" />
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-line bg-white overflow-hidden">
          {list.length === 0 ? (
            <p className="py-8 text-center text-mute">{todo.length === 0 ? 'Tất cả cửa hàng đã hoàn tất cấu hình Target kỳ này.' : 'Không có cửa hàng phù hợp.'}</p>
          ) : (
            <ul>
              {shown.map((r) => (
                <li key={r.s.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-line last:border-b-0">
                  <span className="size-9 rounded-lg bg-tint grid place-items-center shrink-0 text-brand"><Store className="size-5" strokeWidth={1.75} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.s.name} <span className="font-normal text-sm text-mute">· {r.s.area}</span></p>
                    <p className="text-[14px] text-mute">{info(r)}</p>
                    {r.configured > 0 && r.configured < r.scope && (
                      <div className="mt-1.5 flex items-center gap-2.5 max-w-[320px]">
                        <span className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden"><span className="block h-full rounded-full bg-ink/45" style={{ width: `${(r.configured / r.scope) * 100}%` }} /></span>
                        <span className="text-[13px] text-mute w-9 text-right">{Math.round((r.configured / r.scope) * 100)}%</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => openStore(r.s.id)} className="inline-flex items-center gap-1 min-h-11 pl-2 text-[15px] font-semibold text-brand hover:text-brand-deep whitespace-nowrap">{cta(r)}<ChevronRight className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {list.length > 6 && <button onClick={() => setAll(!all)} className="w-full border-t border-line min-h-12 text-[15px] font-semibold text-brand hover:bg-sand">{all ? 'Thu gọn' : `Xem tất cả ${list.length} cửa hàng`}</button>}
        </div>
      </section>
    </div>
  )
}
