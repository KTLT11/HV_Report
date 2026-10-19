import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { CAT_NAMES } from '../data'
import { PROD_BY_ID, STORES, fmtVal, kpiName, norm, parseVal, periodLabel, prevPeriods, skuOf, summarize } from './data'
import { Badge, Btn, Confirm, Field, Modal, Select, StatusBadge, cx, textInput, useAdmin } from './ui'

const KPI = 'qty' as const
const grp = (n: number) => n.toLocaleString('en-US')
type Mode = null | 'set' | 'up' | 'down' | 'clear'

export default function StoreDetail({ id }: { id: number }) {
  const { period, cfgOf, saveCfg, go, toast, setDirty } = useAdmin()
  const store = STORES[id]
  const saved = cfgOf(period, KPI, id)
  const prevP = prevPeriods(period)[0]?.[0]
  const prevCfg = prevP ? cfgOf(prevP, KPI, id) : null

  const [draft, setDraft] = useState<Record<number, string>>({})
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [shut, setShut] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<Mode>(null)

  const text = (pid: number) => (pid in draft ? draft[pid] : saved.products[pid] !== undefined ? grp(saved.products[pid]) : '')
  const info = (pid: number): { v?: number; err?: string } => {
    const t = text(pid).trim()
    if (t === '') return {}
    const r = parseVal(KPI, t)
    return 'err' in r ? { err: r.err } : r.v <= 0 ? { err: 'Target phải lớn hơn 0' } : { v: r.v }
  }
  const changed = (pid: number) => info(pid).err !== undefined ? true : (info(pid).v ?? null) !== (saved.products[pid] ?? null)

  const scope = store.scope
  const dirty = scope.some(changed)
  const val = (pid: number) => info(pid).v
  const configured = scope.filter((p) => val(p) !== undefined).length
  const invalid = scope.filter((p) => info(p).err).length
  const missing = scope.length - configured - invalid
  const total = scope.reduce((a, p) => a + (val(p) ?? 0), 0)
  const pctDone = scope.length ? (configured / scope.length) * 100 : 0
  const savedStatus = summarize(store, saved).status

  useEffect(() => { setDirty(dirty) }, [dirty, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  const groups = useMemo(() => {
    const m = new Map<string, number[]>()
    for (const pid of scope) { const c = PROD_BY_ID.get(pid)!.cat; m.set(c, [...(m.get(c) ?? []), pid]) }
    return [...m.entries()].sort((a, b) => CAT_NAMES.indexOf(a[0]) - CAT_NAMES.indexOf(b[0]))
  }, [scope])

  const match = (pid: number) => {
    const p = PROD_BY_ID.get(pid)!
    if (q && !norm(p.name + skuOf(p)).includes(norm(q))) return false
    if (cat !== 'all' && p.cat !== cat) return false
    const st = onlyMissing ? 'unconfigured' : status
    const i = info(pid)
    if (st === 'configured') return i.v !== undefined
    if (st === 'unconfigured') return i.v === undefined && !i.err
    if (st === 'invalid') return !!i.err
    return true
  }
  const visible = groups.map(([c, ids]) => [c, ids, ids.filter(match)] as const).filter((g) => g[2].length)
  const visIds = visible.flatMap((g) => g[2])

  const setTexts = (pids: number[], f: (pid: number) => string) => setDraft((d) => { const n = { ...d }; pids.forEach((p) => { n[p] = f(p) }); return n })
  const toggle = (pid: number) => setSel((s) => { const n = new Set(s); n.has(pid) ? n.delete(pid) : n.add(pid); return n })
  const toggleMany = (pids: number[]) => setSel((s) => { const n = new Set(s); const all = pids.every((p) => n.has(p)); pids.forEach((p) => (all ? n.delete(p) : n.add(p))); return n })
  const selIds = [...sel].filter((p) => scope.includes(p))

  const focusNext = (pid: number, d: number) => {
    const i = visIds.indexOf(pid) + d
    if (i < 0 || i >= visIds.length) return
    const el = document.querySelector<HTMLInputElement>(`input[data-cell="${visIds[i]}"]`)
    el?.focus()
  }

  const save = () => {
    const products: Record<number, number> = {}
    scope.forEach((p) => { const v = val(p); if (v !== undefined) products[p] = v })
    saveCfg(period, KPI, id, { storeTarget: null, products })
    setDraft({}); setSel(new Set())
    toast(scope.length > 0 && Object.keys(products).length === scope.length ? 'Đã lưu Target. Cấu hình của cửa hàng đã hoàn tất.' : 'Đã lưu Target.')
  }

  const anyFilter = q || cat !== 'all' || status !== 'all' || onlyMissing
  const statusBadge = (pid: number) => {
    const i = info(pid)
    return i.err ? <Badge tone="red">Không hợp lệ</Badge> : i.v !== undefined ? <Badge tone="green">Đã cấu hình</Badge> : <Badge tone="gray">Chưa cấu hình</Badge>
  }

  return (
    <div className="pb-6">
      <button onClick={() => go({ name: 'target' })} className="inline-flex items-center gap-1.5 min-h-11 -ml-2 px-2 text-[15px] font-semibold text-brand hover:text-brand-deep"><ArrowLeft className="size-4" />Cấu hình Target</button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-[650] tracking-[-0.01em]">{store.name}</h1>
            <StatusBadge s={savedStatus} />
          </div>
          <p className="mt-1 text-[15px] text-mute">{store.code} · {store.area} · {periodLabel(period)} · KPI {kpiName(KPI)} (SP)</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn kind="primary" disabled={!dirty || invalid > 0} onClick={save}>Lưu thay đổi</Btn>
        </div>
      </div>

      <section aria-label="Tóm tắt" className="mt-5 rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
          <div>
            <p className="text-[13px] text-mute font-medium">Target cửa hàng</p>
            <p className="text-[28px] leading-tight font-semibold">{fmtVal(KPI, total)}</p>
          </div>
          <div className="min-w-[220px] flex-1 max-w-[420px]">
            <p className="text-[15px] font-medium">Đã cấu hình {configured}/{scope.length} sản phẩm</p>
            <span className="mt-1.5 block h-2 rounded-full bg-ink/10 overflow-hidden"><span className="block h-full rounded-full bg-[#3d9a73] transition-all" style={{ width: `${pctDone}%` }} /></span>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-mute">Target cửa hàng được tính tự động từ tổng Target sản phẩm. Cửa hàng tự động hoàn tất khi mọi sản phẩm đều có Target hợp lệ.</p>
      </section>

      {scope.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-white py-12 text-center text-mute">Cửa hàng chưa có sản phẩm trong phạm vi.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <label className="relative block flex-1 min-w-[200px] sm:max-w-[320px]">
              <span className="sr-only">Tìm sản phẩm</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm hoặc SKU..." className="w-full min-h-11 px-3.5 rounded-lg bg-white ring-1 ring-inset ring-[#d8d2cf] text-[15px] placeholder:text-mute/70 focus:outline-2 focus:outline-brand" />
            </label>
            <Select label="Danh mục" value={cat} onChange={setCat} options={[['all', 'Tất cả danh mục'], ...groups.map(([c]): [string, string] => [c, c])]} className="w-full sm:w-[210px]" />
            <Select label="Trạng thái" value={onlyMissing ? 'unconfigured' : status} onChange={(v) => { setOnlyMissing(false); setStatus(v) }} options={[['all', 'Tất cả trạng thái'], ['configured', 'Đã cấu hình'], ['unconfigured', 'Chưa cấu hình'], ['invalid', 'Không hợp lệ']]} className="w-full sm:w-[190px]" />
            <label className="inline-flex items-center gap-2.5 min-h-11 px-1 text-[15px] cursor-pointer">
              <input type="checkbox" className="size-5 accent-[#C72128]" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />Chỉ hiện sản phẩm chưa cấu hình
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-white overflow-hidden">
            <div className="hidden md:grid grid-cols-[auto_minmax(0,1fr)_150px_170px_130px] gap-x-3 items-center px-4 min-h-11 bg-sand text-[13px] font-semibold text-mute">
              <input type="checkbox" aria-label="Chọn tất cả sản phẩm đang hiển thị" className="size-5 accent-[#C72128]" checked={visIds.length > 0 && visIds.every((p) => sel.has(p))} onChange={() => toggleMany(visIds)} />
              <span>Sản phẩm</span><span className="text-right">Target kỳ trước</span><span className="text-right">Target (SP)</span><span>Trạng thái</span>
            </div>
            {visible.length === 0 && <p className="py-10 text-center text-mute">Không có sản phẩm phù hợp.{anyFilter && <> <button className="font-semibold text-brand" onClick={() => { setQ(''); setCat('all'); setStatus('all'); setOnlyMissing(false) }}>Xóa bộ lọc</button></>}</p>}
            {visible.map(([c, all, rows]) => {
              const open = !shut.has(c)
              const sum = all.reduce((a, p) => a + (val(p) ?? 0), 0)
              const cn = all.filter((p) => val(p) !== undefined).length
              return (
                <section key={c} aria-label={c}>
                  <div className="flex items-center gap-3 px-4 min-h-12 bg-[#F6F3F1] border-t border-line">
                    <input type="checkbox" aria-label={`Chọn danh mục ${c}`} className="size-5 accent-[#C72128]" checked={rows.every((p) => sel.has(p))} onChange={() => toggleMany(rows)} />
                    <button aria-expanded={open} onClick={() => setShut((s) => { const n = new Set(s); open ? n.add(c) : n.delete(c); return n })} className="flex-1 min-w-0 flex items-center gap-2 min-h-11 text-left">
                      {open ? <ChevronDown className="size-4 text-mute shrink-0" /> : <ChevronRight className="size-4 text-mute shrink-0" />}
                      <span className="font-semibold truncate">{c}</span>
                      <span className="text-[13px] text-mute whitespace-nowrap">{cn}/{all.length} sản phẩm</span>
                    </button>
                    <span className="text-[14px] font-semibold whitespace-nowrap" title="Tổng Target danh mục (tự động tính)"><span className="hidden sm:inline text-mute font-normal">Tổng: </span>{fmtVal(KPI, sum)}</span>
                  </div>
                  {open && rows.map((pid) => {
                    const p = PROD_BY_ID.get(pid)!
                    const i = info(pid)
                    const prev = prevCfg?.products[pid]
                    return (
                      <div key={pid} className={cx('grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_150px_170px_130px] gap-x-3 gap-y-1.5 items-center px-4 py-2.5 border-t border-line', sel.has(pid) && 'bg-tint/50')}>
                        <input type="checkbox" aria-label={`Chọn ${p.name}`} className="size-5 accent-[#C72128]" checked={sel.has(pid)} onChange={() => toggle(pid)} />
                        <div className="min-w-0"><p className="font-medium truncate">{p.name}</p><p className="text-[13px] text-mute">{skuOf(p)}</p></div>
                        <div className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto md:order-last">{statusBadge(pid)}</div>
                        <p className="col-start-2 md:col-start-auto md:text-right text-[14px] md:text-[15px] text-mute"><span className="md:hidden">Kỳ trước: </span>{prev !== undefined ? fmtVal(KPI, prev) : '—'}</p>
                        <div className="col-start-2 md:col-start-auto">
                          <input
                            data-cell={pid}
                            aria-label={`Target ${p.name}`}
                            value={text(pid)}
                            inputMode="numeric"
                            placeholder="Nhập Target"
                            onChange={(e) => setDraft((d) => ({ ...d, [pid]: e.target.value }))}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => { const v = info(pid).v; if (v !== undefined && pid in draft) setDraft((d) => ({ ...d, [pid]: grp(v) })) }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); focusNext(pid, e.shiftKey ? -1 : 1) }
                              else if (e.key === 'ArrowUp') { e.preventDefault(); focusNext(pid, -1) }
                            }}
                            className={cx(textInput(!!i.err), 'text-right md:max-w-none max-w-[220px]', !i.err && pid in draft && changed(pid) && 'ring-brand/60')}
                          />
                          {i.err && <p className="mt-1 text-[13px] text-[#c22d20] md:text-right">{i.err}</p>}
                        </div>
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>
        </>
      )}

      <div className="h-6" />
      {(selIds.length > 0 || dirty) && (
        <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-8 bg-white border-t border-line shadow-[0_-6px_20px_rgba(35,31,32,0.08)]">
          {selIds.length > 0 && (
            <div className="px-4 sm:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 bg-tint/60">
              <p className="mr-auto text-[15px] font-semibold">{selIds.length} sản phẩm đã chọn</p>
              <Btn onClick={() => setMode('set')}>Đặt Target</Btn>
              <Btn onClick={() => setMode('up')}>Tăng %</Btn>
              <Btn onClick={() => setMode('down')}>Giảm %</Btn>
              <Btn kind="danger" onClick={() => setMode('clear')}>Xóa Target</Btn>
              <Btn kind="ghost" onClick={() => setSel(new Set())}>Bỏ chọn</Btn>
            </div>
          )}
          {dirty && (
            <div className="px-4 sm:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="mr-auto text-[15px] font-semibold">Có thay đổi chưa lưu</p>
              <Btn onClick={() => setDraft({})}>Hủy thay đổi</Btn>
              <Btn kind="primary" disabled={invalid > 0} onClick={save}>Lưu thay đổi</Btn>
            </div>
          )}
        </div>
      )}

      {mode && <BulkModal mode={mode} ids={selIds} val={val} onClose={() => setMode(null)} onApply={(f) => { setTexts(selIds, f); setMode(null) }} />}

    </div>
  )
}

function BulkModal({ mode, ids, val, onClose, onApply }: { mode: Exclude<Mode, null>; ids: number[]; val: (pid: number) => number | undefined; onClose: () => void; onApply: (f: (pid: number) => string) => void }) {
  const [t, setT] = useState('')
  const n = /^\d+(\.\d+)?$/.test(t.trim().replace(/,/g, '')) ? +t.trim().replace(/,/g, '') : null
  const hasVal = ids.filter((p) => val(p) !== undefined)
  const title = { set: 'Đặt Target', up: 'Tăng Target theo %', down: 'Giảm Target theo %', clear: 'Xóa Target' }[mode]

  let err = ''
  if (mode === 'set' && (n === null || n <= 0 || !Number.isInteger(n))) err = 'Nhập số nguyên lớn hơn 0.'
  if ((mode === 'up' || mode === 'down') && (n === null || n <= 0 || (mode === 'down' && n >= 100))) err = mode === 'down' ? 'Nhập số lớn hơn 0 và nhỏ hơn 100.' : 'Nhập số lớn hơn 0.'
  const show = t !== '' && err
  const f = (pid: number) => {
    if (mode === 'clear') return ''
    if (mode === 'set') return grp(n!)
    const v = val(pid)
    return v === undefined ? '' : grp(Math.max(1, Math.round(v * (mode === 'up' ? 1 + n! / 100 : 1 - n! / 100))))
  }
  const ok = mode === 'clear' ? ids.length > 0 : !err && (mode === 'set' || hasVal.length > 0)

  return (
    <Modal
      title={title}
      sub={`${ids.length} sản phẩm đã chọn`}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind={mode === 'clear' ? 'danger' : 'primary'} disabled={!ok} onClick={() => onApply(mode === 'set' || mode === 'clear' ? f : (pid) => (val(pid) === undefined ? '' : f(pid)))}>{mode === 'clear' ? 'Xóa Target' : 'Áp dụng'}</Btn></>}
    >
      <div className="space-y-3 pt-1">
        {mode === 'clear' ? (
          <p className="text-base">Target của {ids.length} sản phẩm sẽ trở về trạng thái Chưa cấu hình. Thay đổi chỉ có hiệu lực sau khi bấm Lưu thay đổi.</p>
        ) : (
          <>
            <Field label={mode === 'set' ? 'Target (SP)' : mode === 'up' ? 'Tăng thêm (%)' : 'Giảm đi (%)'}>
              <input autoFocus inputMode="decimal" value={t} onChange={(e) => setT(e.target.value)} className={textInput(!!show)} placeholder={mode === 'set' ? 'VD: 500' : 'VD: 10'} />
              {show && <span className="block mt-1 text-[13px] text-[#c22d20]">{err}</span>}
            </Field>
            {mode !== 'set' && <p className="text-[14px] text-mute">Áp dụng cho {hasVal.length} sản phẩm đã có Target.{ids.length - hasVal.length > 0 && ` ${ids.length - hasVal.length} sản phẩm chưa có Target sẽ được bỏ qua.`}</p>}
            {mode === 'set' && <p className="text-[14px] text-mute">Ghi đè Target hiện tại của các sản phẩm đã chọn.</p>}
          </>
        )}
      </div>
    </Modal>
  )
}
