import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { PROD_BY_CODE, PROD_BY_ID, STORES, STORE_BY_CODE, fmtVal, kpiName, norm, periodLabel, prevPeriods, roundTo, skuOf, type StoreCfg } from './data'
import { Btn, Modal, SearchBox, Select, cx, textInput, useAdmin } from './ui'

const KPI = 'qty' as const
export const DRAFT_TOAST = 'Đã tạo Target. Trạng thái cấu hình của từng cửa hàng đã được cập nhật tự động.'

type Patch = { storeId: number; products: Record<number, number>; added: number }

export function CopyModal({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const { period, cfgOf, saveCfg } = useAdmin()
  const sources = prevPeriods(period)
  const [src, setSrc] = useState(sources[0]?.[0] ?? '')
  const [scope, setScope] = useState<'all' | 'some'>('all')
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<'keep' | 'up' | 'down'>('keep')
  const [pct, setPct] = useState('10')
  const [overwrite, setOverwrite] = useState(false)

  const pctN = /^\d+(\.\d+)?$/.test(pct.trim()) ? +pct : null
  const pctErr = mode !== 'keep' && (pctN === null || pctN <= 0 || (mode === 'down' && pctN >= 100))
  const factor = mode === 'keep' ? 1 : mode === 'up' ? 1 + (pctN ?? 0) / 100 : 1 - (pctN ?? 0) / 100

  const eligible = useMemo(() => STORES.filter((s) => s.scope.some((id) => cfgOf(src, KPI, s.id).products[id] !== undefined)), [src, cfgOf])
  const targets = scope === 'all' ? eligible : eligible.filter((s) => chosen.has(s.id))

  const plan = useMemo(() => {
    const out: (Patch & { before: number; after: number })[] = []
    for (const s of targets) {
      const prev = cfgOf(src, KPI, s.id)
      const cur = cfgOf(period, KPI, s.id)
      const products = { ...cur.products }
      let added = 0
      for (const id of s.scope) {
        const pv = prev.products[id]
        if (pv === undefined) continue
        if (cur.products[id] !== undefined && !overwrite) continue
        products[id] = Math.max(1, roundTo(KPI, pv * factor))
        added++
      }
      if (added) out.push({ storeId: s.id, products, added, before: s.scope.reduce((a, id) => a + (cur.products[id] ?? 0), 0), after: s.scope.reduce((a, id) => a + (products[id] ?? 0), 0) })
    }
    return out
  }, [targets, src, period, cfgOf, overwrite, factor])

  const totalProducts = plan.reduce((a, p) => a + p.added, 0)
  const totalAfter = plan.reduce((a, p) => a + p.after, 0)
  const totalBefore = plan.reduce((a, p) => a + p.before, 0)
  const canApply = plan.length > 0 && !pctErr

  const apply = () => {
    for (const p of plan) saveCfg(period, KPI, p.storeId, { storeTarget: null, products: p.products } satisfies StoreCfg)
    onApplied()
  }

  const list = eligible.filter((s) => !q || norm(s.name + s.code).includes(norm(q)))
  const radio = 'flex items-center gap-3 min-h-11'

  return (
    <Modal
      title="Sao chép từ kỳ trước"
      sub={`Sang ${periodLabel(period)} · KPI ${kpiName(KPI)}`}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!canApply} onClick={apply}>Áp dụng Target</Btn></>}
    >
      <div className="space-y-6 pt-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-[13px] font-medium text-mute mb-1.5">Sao chép từ kỳ</span>
            <Select label="Kỳ nguồn" value={src} onChange={setSrc} options={sources} />
          </div>
          <div>
            <span className="block text-[13px] font-medium text-mute mb-1.5">Áp dụng cho kỳ</span>
            <div className="min-h-11 px-3.5 rounded-lg bg-sand flex items-center text-[15px] font-medium">{periodLabel(period)}</div>
          </div>
        </div>

        <fieldset>
          <legend className="text-[15px] font-semibold mb-1">Phạm vi</legend>
          <label className={radio}><input type="radio" className="size-5 accent-[#C72128]" checked={scope === 'all'} onChange={() => setScope('all')} />Tất cả cửa hàng <span className="text-mute">({eligible.length} cửa hàng có Target kỳ trước)</span></label>
          <label className={radio}><input type="radio" className="size-5 accent-[#C72128]" checked={scope === 'some'} onChange={() => setScope('some')} />Cửa hàng được chọn {scope === 'some' && <span className="text-mute">({chosen.size} đã chọn)</span>}</label>
          {scope === 'some' && (
            <div className="mt-2 rounded-lg border border-line">
              <div className="p-2.5 border-b border-line flex flex-wrap gap-2 items-center">
                <SearchBox value={q} onChange={setQ} placeholder="Tìm cửa hàng..." className="flex-1 min-w-[180px]" />
                <Btn onClick={() => setChosen(new Set(list.map((s) => s.id)))}>Chọn tất cả</Btn>
                <Btn onClick={() => setChosen(new Set())}>Bỏ chọn</Btn>
              </div>
              <ul className="max-h-48 overflow-y-auto divide-y divide-line">
                {list.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 min-h-11 px-3.5 cursor-pointer hover:bg-sand">
                      <input type="checkbox" className="size-5 accent-[#C72128]" checked={chosen.has(s.id)} onChange={() => setChosen((c) => { const n = new Set(c); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })} />
                      <span className="font-medium">{s.name}</span><span className="text-sm text-mute">{s.code} · {s.area}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-semibold mb-1">Điều chỉnh Target</legend>
          <div className="flex flex-wrap items-center gap-x-6">
            <label className={radio}><input type="radio" className="size-5 accent-[#C72128]" checked={mode === 'keep'} onChange={() => setMode('keep')} />Giữ nguyên</label>
            <label className={radio}><input type="radio" className="size-5 accent-[#C72128]" checked={mode === 'up'} onChange={() => setMode('up')} />Tăng theo %</label>
            <label className={radio}><input type="radio" className="size-5 accent-[#C72128]" checked={mode === 'down'} onChange={() => setMode('down')} />Giảm theo %</label>
          </div>
          {mode !== 'keep' && (
            <div className="mt-1 max-w-[200px]">
              <div className="relative">
                <input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} aria-label="Phần trăm điều chỉnh" className={cx(textInput(pctErr), 'pr-9')} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute">%</span>
              </div>
              {pctErr && <p className="mt-1 text-[13px] text-[#c22d20]">{mode === 'down' ? 'Nhập số lớn hơn 0 và nhỏ hơn 100.' : 'Nhập số lớn hơn 0.'}</p>}
            </div>
          )}
          <label className="mt-2 flex items-center gap-3 min-h-11"><input type="checkbox" className="size-5 accent-[#C72128]" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />Ghi đè Target đã có trong kỳ này</label>
        </fieldset>

        <section aria-label="Xem trước" className="rounded-xl border border-line overflow-hidden">
          <div className="px-4 py-3 bg-sand border-b border-line text-[15px] font-semibold">Xem trước</div>
          <div className="grid grid-cols-3 gap-px bg-line">
            {[['Cửa hàng', String(plan.length)], ['Sản phẩm được tạo Target', String(totalProducts)], ['Target thêm vào', fmtVal(KPI, Math.max(0, totalAfter - totalBefore))]].map(([l, v]) => (
              <div key={l} className="bg-white px-4 py-3"><p className="text-[13px] text-mute font-medium">{l}</p><p className="text-[19px] font-semibold">{v}</p></div>
            ))}
          </div>
          {plan.length === 0 ? (
            <p className="px-4 py-5 text-center text-mute border-t border-line">{targets.length === 0 ? 'Chọn ít nhất một cửa hàng.' : 'Không có sản phẩm nào cần tạo Target mới.'}</p>
          ) : (
            <ul className="border-t border-line divide-y divide-line">
              {plan.slice(0, 5).map((p) => (
                <li key={p.storeId} className="flex items-center gap-3 px-4 min-h-12 text-[15px]">
                  <span className="font-medium flex-1">{STORES[p.storeId].name}</span>
                  <span className="text-mute">{p.added} sản phẩm</span>
                  <span className="font-semibold w-28 text-right">{fmtVal(KPI, p.after)}</span>
                </li>
              ))}
              {plan.length > 5 && <li className="px-4 min-h-11 flex items-center text-sm text-mute">và {plan.length - 5} cửa hàng khác</li>}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  )
}

type Row = { n: number; store: string; product: string; raw: string; sid?: number; pid?: number; v?: number; err?: string; blank?: boolean }
const cellText = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') { const o = v as { result?: unknown; text?: unknown }; return cellText(o.result ?? o.text) }
  return String(v).trim()
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ImportModal({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const { period, cfgOf, saveCfg } = useAdmin()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileErr, setFileErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [errOnly, setErrOnly] = useState(false)
  const inp = useRef<HTMLInputElement>(null)

  const template = async () => {
    setBusy(true)
    const ExcelJS = (await import('exceljs')).default
    const prev = prevPeriods(period)[0]?.[0]
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Target')
    ws.columns = [{ header: 'Mã cửa hàng', width: 14 }, { header: 'Tên cửa hàng', width: 22 }, { header: 'Mã sản phẩm', width: 16 }, { header: 'Tên sản phẩm', width: 30 }, { header: 'Target (SP)', width: 14 }, { header: 'Target kỳ trước (tham khảo)', width: 26 }]
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC72128' } }
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    for (const s of STORES) for (const id of s.scope) {
      const p = PROD_BY_ID.get(id)!
      ws.addRow([s.code, s.name, skuOf(p), p.name, null, prev ? cfgOf(prev, KPI, s.id).products[id] ?? null : null])
    }
    const g = wb.addWorksheet('Hướng dẫn')
    g.columns = [{ width: 90 }]
    ;['Chỉ nhập Target vào cột E (Target (SP)) của sheet "Target".', 'Target là số nguyên không âm. Để trống nếu chưa cấu hình sản phẩm đó.', 'Không thay đổi Mã cửa hàng và Mã sản phẩm. Mỗi cặp cửa hàng - sản phẩm chỉ xuất hiện một lần.'].forEach((t) => g.addRow([t]))
    saveBlob(new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Template_Target_${period}.xlsx`)
    setBusy(false)
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setFileErr('')
    if (!/\.xlsx$/i.test(f.name)) { setFileErr('Chỉ hỗ trợ file .xlsx. Vui lòng tải template và dùng đúng định dạng.'); return }
    setBusy(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(await f.arrayBuffer())
      const ws = wb.getWorksheet('Target') ?? wb.worksheets[0]
      if (!ws || cellText(ws.getRow(1).getCell(1).value) !== 'Mã cửa hàng' || cellText(ws.getRow(1).getCell(3).value) !== 'Mã sản phẩm') { setFileErr('File không đúng template. Vui lòng tải template và nhập lại.'); setBusy(false); return }
      const seen = new Set<string>()
      const out: Row[] = []
      ws.eachRow((r, n) => {
        if (n === 1) return
        const store = cellText(r.getCell(1).value), product = cellText(r.getCell(3).value), raw = cellText(r.getCell(5).value)
        if (!store && !product && !raw) return
        const row: Row = { n, store, product, raw }
        const s = STORE_BY_CODE.get(store), p = PROD_BY_CODE.get(product)
        if (!s) row.err = 'Mã cửa hàng không tồn tại'
        else if (!p) row.err = 'Mã sản phẩm không tồn tại'
        else if (!s.scope.includes(p.id)) row.err = 'Sản phẩm không thuộc phạm vi cửa hàng'
        else if (seen.has(`${s.id}|${p.id}`)) row.err = 'Dòng trùng cửa hàng và sản phẩm'
        else {
          seen.add(`${s.id}|${p.id}`)
          row.sid = s.id; row.pid = p.id
          if (raw === '') row.blank = true
          else if (!/^-?\d+(\.\d+)?$/.test(raw.replace(/,/g, ''))) row.err = 'Target không phải số'
          else {
            const v = +raw.replace(/,/g, '')
            if (v < 0) row.err = 'Target không được âm'
            else if (!Number.isInteger(v)) row.err = 'Target phải là số nguyên'
            else row.v = v
          }
        }
        out.push(row)
      })
      if (out.length === 0) { setFileErr('File không có dữ liệu.'); setBusy(false); return }
      setRows(out); setFileName(f.name); setErrOnly(out.some((r) => r.err))
    } catch {
      setFileErr('Không thể đọc file. Vui lòng kiểm tra lại định dạng .xlsx.')
    }
    setBusy(false)
  }

  const sum = useMemo(() => {
    const r = rows ?? []
    return { total: r.length, ok: r.filter((x) => x.v !== undefined).length, err: r.filter((x) => x.err).length, blank: r.filter((x) => x.blank).length }
  }, [rows])

  const apply = () => {
    const by = new Map<number, Record<number, number>>()
    for (const r of rows ?? []) if (r.v !== undefined) by.set(r.sid!, { ...(by.get(r.sid!) ?? cfgOf(period, KPI, r.sid!).products), [r.pid!]: r.v })
    by.forEach((products, sid) => saveCfg(period, KPI, sid, { storeTarget: null, products }))
    onApplied()
  }

  const shown = rows ? (errOnly ? rows.filter((r) => r.err) : rows).slice(0, 100) : []

  return (
    <Modal
      wide
      title="Import Excel"
      sub={`${periodLabel(period)} · KPI ${kpiName(KPI)}`}
      onClose={onClose}
      footer={rows ? (
        <>
          <Btn onClick={() => { setRows(null); setFileName('') }}>Thay file</Btn>
          {sum.err > 0 && <Btn onClick={() => setErrOnly(!errOnly)}>{errOnly ? 'Xem tất cả dòng' : 'Chỉ xem dòng lỗi'}</Btn>}
          <Btn kind="primary" disabled={sum.err > 0 || sum.ok === 0} onClick={apply}>Xác nhận Import</Btn>
        </>
      ) : <Btn onClick={onClose}>Đóng</Btn>}
    >
      {!rows ? (
        <div className="grid gap-4 md:grid-cols-2 pt-1">
          <section className="rounded-xl border border-line p-5">
            <p className="text-[13px] font-semibold text-brand">Bước 1</p>
            <h3 className="mt-0.5 text-[17px] font-semibold">Tải template</h3>
            <p className="mt-1 text-[15px] text-mute">Template gồm toàn bộ cửa hàng và sản phẩm trong phạm vi. Chỉ cần điền cột Target.</p>
            <Btn className="mt-4" onClick={template} disabled={busy}><Download className="size-4" />Tải template (.xlsx)</Btn>
          </section>
          <section className="rounded-xl border border-line p-5">
            <p className="text-[13px] font-semibold text-brand">Bước 2</p>
            <h3 className="mt-0.5 text-[17px] font-semibold">Tải file lên</h3>
            <p className="mt-1 text-[15px] text-mute">Hệ thống sẽ kiểm tra dữ liệu trước khi import.</p>
            <input ref={inp} type="file" accept=".xlsx" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            <Btn kind="primary" className="mt-4" onClick={() => inp.current?.click()} disabled={busy}><Upload className="size-4" />{busy ? 'Đang đọc file...' : 'Chọn file .xlsx'}</Btn>
          </section>
          {fileErr && <p role="alert" className="md:col-span-2 flex items-start gap-2 rounded-lg bg-risk-bg px-4 py-3 text-[15px] text-[#c22d20]"><AlertTriangle className="size-5 shrink-0 mt-0.5" />{fileErr}</p>}
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <p className="flex items-center gap-2 text-[15px] text-mute"><FileSpreadsheet className="size-5 text-brand" /><span className="font-medium text-ink">{fileName}</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-xl overflow-hidden border border-line">
            {[['Tổng dòng', sum.total, ''], ['Hợp lệ', sum.ok, 'text-[#1e7f5c]'], ['Dòng lỗi', sum.err, sum.err ? 'text-[#c22d20]' : ''], ['Bỏ trống', sum.blank, '']].map(([l, v, c]) => (
              <div key={l as string} className="bg-white px-4 py-3"><p className="text-[13px] text-mute font-medium">{l}</p><p className={cx('text-[24px] leading-tight font-semibold', c as string)}>{v}</p></div>
            ))}
          </div>
          {sum.err > 0
            ? <p className="flex items-start gap-2 rounded-lg bg-risk-bg px-4 py-3 text-[15px] text-[#c22d20]"><AlertTriangle className="size-5 shrink-0 mt-0.5" />Có {sum.err} dòng lỗi. Vui lòng sửa trong file Excel rồi bấm Thay file.</p>
            : <p className="flex items-center gap-2 rounded-lg bg-[#1e7f5c]/10 px-4 py-3 text-[15px] text-[#1e7f5c] font-medium"><CheckCircle2 className="size-5" />Dữ liệu hợp lệ. {sum.ok} sản phẩm sẽ được tạo Target.</p>}
          <div className="rounded-xl border border-line overflow-x-auto">
            <table className="w-full text-[15px] min-w-[640px]">
              <thead className="bg-sand text-left text-[13px] text-mute"><tr><th className="px-4 py-2.5 font-semibold w-16">Dòng</th><th className="px-4 py-2.5 font-semibold">Cửa hàng</th><th className="px-4 py-2.5 font-semibold">Sản phẩm</th><th className="px-4 py-2.5 font-semibold text-right">Target</th><th className="px-4 py-2.5 font-semibold">Kết quả</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.n} className={cx('border-t border-line', r.err && 'bg-risk-bg/60')}>
                    <td className="px-4 py-2.5 text-mute">{r.n}</td>
                    <td className="px-4 py-2.5">{r.store || '—'}</td>
                    <td className="px-4 py-2.5">{r.product || '—'}</td>
                    <td className="px-4 py-2.5 text-right">{r.raw || '—'}</td>
                    <td className={cx('px-4 py-2.5', r.err ? 'text-[#c22d20] font-medium' : r.blank ? 'text-mute' : 'text-[#1e7f5c]')}>{r.err ?? (r.blank ? 'Bỏ trống' : 'Hợp lệ')}</td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-mute">Không có dòng nào.</td></tr>}
              </tbody>
            </table>
          </div>
          {(errOnly ? sum.err : sum.total) > 100 && <p className="text-sm text-mute">Hiển thị 100 dòng đầu.</p>}
        </div>
      )}
    </Modal>
  )
}
