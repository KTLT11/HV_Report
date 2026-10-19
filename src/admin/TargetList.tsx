import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Copy, Upload } from 'lucide-react'
import { PERIODS, STORES, STATUS_LABEL, fmtVal, norm, summarize, type Status } from './data'
import { CopyModal, DRAFT_TOAST, ImportModal } from './TargetTools'
import { Pager, PageHead, SearchBox, Select, StatusBadge, cx, useAdmin } from './ui'

const KPI = 'qty' as const
const SIZE = 12
const DOT: Record<Status, string> = { done: 'bg-[#3d9a73]', partial: 'bg-[#d9a441]', none: 'bg-[#b8b2b0]' }

export default function TargetList({ autoImport, onAutoImported }: { autoImport?: boolean; onAutoImported?: () => void }) {
  const { period, setPeriod, setKpi, go, cfgOf, toast, listUi, setListUi } = useAdmin()
  const [modal, setModal] = useState<null | 'copy' | 'import'>(null)
  const [page, setPage] = useState(1)

  useEffect(() => { setKpi(KPI) }, [setKpi])
  useEffect(() => { if (autoImport) { setModal('import'); onAutoImported?.() } }, [autoImport, onAutoImported])

  const rows = useMemo(() => STORES.map((s) => ({ s, ...summarize(s, cfgOf(period, KPI, s.id)) })), [cfgOf, period])
  const count = (st: Status) => rows.filter((r) => r.status === st).length
  const systemTarget = rows.reduce((a, r) => a + r.assigned, 0)
  const doneN = count('done')

  const list = rows.filter((r) => (listUi.status === 'all' || r.status === listUi.status) && (!listUi.q || norm(r.s.name + r.s.code + r.s.area).includes(norm(listUi.q))))
  const view = list.slice((page - 1) * SIZE, page * SIZE)
  const setUi = (v: Partial<typeof listUi>) => { setListUi({ ...listUi, ...v }); setPage(1) }

  const onApplied = () => { setModal(null); toast(DRAFT_TOAST) }
  const cta = (st: Status) => (st === 'none' ? 'Thiết lập' : st === 'partial' ? 'Tiếp tục' : 'Xem')

  const quick = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button onClick={onClick} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white ring-1 ring-inset ring-[#e2c9ca] text-[14px] font-semibold text-brand hover:bg-tint transition-colors">{icon}{label}</button>
  )

  return (
    <div className="pb-14 space-y-8">
      <PageHead title="Cấu hình Target" sub="Thiết lập Target Số lượng bán cho từng cửa hàng và sản phẩm theo kỳ.">
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-[190px]"><Select label="Kỳ" value={period} onChange={(v) => { setPeriod(v); setPage(1) }} options={PERIODS} /></div>
          <div className="min-h-11 px-3.5 rounded-lg bg-sand flex items-center text-[15px] font-medium w-full sm:w-auto" title="KPI cố định cho hệ thống">KPI: Số lượng bán (SP)</div>
        </div>
      </PageHead>

      <section className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="flex items-center gap-2.5 text-[17px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Tạo Target nhanh</h2>
          <p className="mt-0.5 text-sm text-mute">Tạo Target hàng loạt để giảm thao tác nhập thủ công.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {quick(<Copy className="size-4" />, 'Sao chép kỳ trước', () => setModal('copy'))}
          {quick(<Upload className="size-4" />, 'Import Excel', () => setModal('import'))}
        </div>
      </section>

      <section aria-label="Tổng quan hệ thống" className="rounded-xl border border-line bg-white overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
          <div className="bg-white px-5 py-4 col-span-2 md:col-span-1">
            <p className="text-[13px] text-mute font-medium">Target toàn hệ thống</p>
            <p className="mt-1 text-[24px] leading-tight font-semibold">{fmtVal(KPI, systemTarget)}</p>
          </div>
          {([['done', 'Đã hoàn tất'], ['partial', 'Chưa hoàn tất'], ['none', 'Chưa cấu hình']] as [Status, string][]).map(([st, l]) => (
            <button key={st} onClick={() => setUi({ status: listUi.status === st ? 'all' : st })} className={cx('px-5 py-4 text-left hover:bg-sand transition-colors', listUi.status === st ? 'bg-tint' : 'bg-white')}>
              <p className="text-[24px] leading-tight font-semibold">{count(st)}</p>
              <p className="mt-1 flex items-center gap-2 text-[14px] text-mute font-medium"><span className={cx('size-2 rounded-full', DOT[st])} />{l}</p>
            </button>
          ))}
        </div>
        <div className="border-t border-line px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex-1 min-w-[180px] max-w-[320px] h-1.5 rounded-full bg-ink/10 overflow-hidden"><span className="block h-full rounded-full bg-[#3d9a73]" style={{ width: `${(doneN / rows.length) * 100}%` }} /></span>
          <span className="text-[14px] text-mute">{doneN}/{rows.length} cửa hàng đã hoàn tất · Target toàn hệ thống được tính từ Target sản phẩm của các cửa hàng.</span>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Target theo cửa hàng</h2>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <SearchBox value={listUi.q} onChange={(q) => setUi({ q })} placeholder="Tìm cửa hàng..." className="w-full sm:w-[240px]" />
            <Select label="Trạng thái" value={listUi.status} onChange={(status) => setUi({ status })} options={[['all', 'Tất cả trạng thái'], ['done', STATUS_LABEL.done], ['partial', STATUS_LABEL.partial], ['none', STATUS_LABEL.none]]} className="w-full sm:w-[190px]" />
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-white overflow-hidden">
          {list.length === 0 ? (
            <p className="py-10 text-center text-mute">Không có cửa hàng phù hợp.</p>
          ) : (
            <>
              <table className="hidden md:table w-full text-[15px]">
                <thead className="bg-sand text-left text-[13px] text-mute">
                  <tr><th className="px-5 py-3 font-semibold">Cửa hàng</th><th className="px-5 py-3 font-semibold text-right">Target cửa hàng</th><th className="px-5 py-3 font-semibold text-right">Sản phẩm đã cấu hình</th><th className="px-5 py-3 font-semibold">Trạng thái</th><th className="px-5 py-3 w-44" /></tr>
                </thead>
                <tbody>
                  {view.map((r) => (
                    <tr key={r.s.id} onClick={() => go({ name: 'store', id: r.s.id })} className="border-t border-line hover:bg-sand/70 cursor-pointer">
                      <td className="px-5 py-3"><p className="font-semibold">{r.s.name}</p><p className="text-[13px] text-mute">{r.s.code} · {r.s.area}</p></td>
                      <td className="px-5 py-3 text-right font-semibold">{r.configured ? fmtVal(KPI, r.assigned) : <span className="text-mute font-normal">—</span>}</td>
                      <td className="px-5 py-3 text-right text-mute">{r.scope === 0 ? 'Chưa có sản phẩm' : `${r.configured} / ${r.scope}`}</td>
                      <td className="px-5 py-3"><StatusBadge s={r.status} /></td>
                      <td className="px-5 py-3 text-right"><span className="inline-flex items-center gap-1 font-semibold text-brand">{cta(r.status)}<ChevronRight className="size-4" /></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="md:hidden divide-y divide-line">
                {view.map((r) => (
                  <li key={r.s.id}>
                    <button onClick={() => go({ name: 'store', id: r.s.id })} className="w-full text-left px-4 py-3.5 hover:bg-sand">
                      <span className="flex items-start justify-between gap-3"><span><span className="block font-semibold">{r.s.name}</span><span className="block text-[13px] text-mute">{r.s.code} · {r.s.area}</span></span><StatusBadge s={r.status} /></span>
                      <span className="mt-2 flex items-center justify-between text-[14px]"><span className="text-mute">{r.configured}/{r.scope} sản phẩm · <b className="text-ink">{r.configured ? fmtVal(KPI, r.assigned) : '—'}</b></span><span className="font-semibold text-brand">{cta(r.status)}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="border-t border-line px-4"><Pager page={page} size={SIZE} total={list.length} onPage={setPage} /></div>
        </div>
      </section>

      {modal === 'copy' && <CopyModal onClose={() => setModal(null)} onApplied={onApplied} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onApplied={onApplied} />}
    </div>
  )
}
