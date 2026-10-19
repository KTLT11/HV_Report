import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, Target, TrendingUp } from 'lucide-react'
import { MSG_VARS, levelStore, publishCfg, renderMsg, type LevelCfg } from '../levels'
import { Btn, Confirm, Select, cx, textInput, useAdmin } from './ui'

const PALETTE: [string, string][] = [['#e0392b', 'Đỏ'], ['#ee8a2b', 'Cam'], ['#e3b23c', 'Vàng'], ['#8dc8a0', 'Xanh nhạt'], ['#1e7f5c', 'Xanh đậm'], ['#3f6480', 'Xanh dương'], ['#c3ccc8', 'Xám xanh'], ['#6b6461', 'Xám đậm']]
const PRESETS = [40, 60, 78, 95, 110]
const STORE = 'Chi nhánh Nguyễn Trãi'
const TARGET = 2000
const KPI_NAME = 'Số lượng bán'
const SUGGEST = [
  '{tên cửa hàng} hiện mới đạt {tỷ lệ hoàn thành}% KPI. Hãy tập trung cải thiện kết quả trong thời gian còn lại.',
  '{tên cửa hàng} đang tiến gần mục tiêu. Cần duy trì nhịp bán để cải thiện kết quả.',
  '{tên cửa hàng} đang đạt tiến độ tốt. Hãy tiếp tục duy trì để hoàn thành mục tiêu.',
  '{tên cửa hàng} đã đạt mục tiêu. Hãy tiếp tục giữ vững kết quả.',
  '{tên cửa hàng} đang vượt mục tiêu. Kết quả hiện tại rất tích cực.',
]
const grp = (n: number) => n.toLocaleString('vi-VN')
const num = (t: string) => (/^\d+$/.test(t.trim()) ? +t.trim() : null)
const same = (a: LevelCfg, b: LevelCfg) => JSON.stringify(a) === JSON.stringify(b)
const tint = (h: string) => `color-mix(in srgb, ${h} 15%, white)`
const ink = (h: string) => `color-mix(in srgb, ${h} 62%, black)`

function Chip({ hex, label }: { hex: string; label: string }) {
  return (
    <span style={{ backgroundColor: tint(hex), color: ink(hex) }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-semibold whitespace-nowrap">
      <span style={{ backgroundColor: hex }} className="size-2 rounded-full" />{label || '—'}
    </span>
  )
}

export default function Threshold() {
  const { toast, setDirty } = useAdmin()
  const [base, setBase] = useState<LevelCfg>(() => levelStore.draft ?? levelStore.published)
  const [cfg, setCfg] = useState<LevelCfg>(base)
  const [editing, setEditing] = useState(true)
  const [confirm, setConfirm] = useState(false)
  const [pct, setPct] = useState(78)
  const [pctText, setPctText] = useState('78')
  const [active, setActive] = useState<number | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const areas = useRef<(HTMLTextAreaElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)

  const pub = levelStore.published
  const unsaved = !same(cfg, base)
  const differsPub = !same(cfg, pub)
  const isDraft = levelStore.draft !== null || differsPub
  const locked = !isDraft && !editing

  useEffect(() => { setDirty(unsaved) }, [unsaved, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  const b = cfg.bounds.map(num)
  const bErr = useMemo(() => cfg.bounds.map((t, i) => {
    const v = num(t)
    if (v === null) return 'Nhập số nguyên.'
    if (v > 300) return 'Ngưỡng tối đa là 300%.'
    const prev = i === 0 ? 0 : num(cfg.bounds[i - 1])
    const next = i === 3 ? null : num(cfg.bounds[i + 1])
    if ((prev !== null && v <= prev) || (next !== null && v >= next)) return 'Ngưỡng phải lớn hơn mức trước và nhỏ hơn mức tiếp theo.'
    return ''
  }), [cfg.bounds])
  const nameErr = cfg.names.map((n) => (n.trim() ? '' : 'Nhập tên mức.'))
  const msgErr = cfg.msgs.map((m) => {
    if (!m.trim()) return 'Nhập thông điệp.'
    const bad = [...m.matchAll(/\{([^{}]*)\}/g)].map((x) => x[1].trim()).find((k) => !MSG_VARS.includes(k))
    return bad !== undefined ? `Biến {${bad}} không hợp lệ.` : ''
  })
  const hasError = [...bErr, ...nameErr, ...msgErr].some(Boolean)
  const boundsOk = !bErr.some(Boolean)

  const axis = 100
  const edges = boundsOk ? [0, ...b.map((x) => Math.min(x as number, axis)), axis] : null
  const at = (v: number) => `${(Math.min(v, axis) / axis) * 100}%`

  const range = (i: number) => {
    if (!boundsOk) return '—'
    const x = b as number[]
    return i === 0 ? `0% – <${x[0]}%` : i === 4 ? `≥ ${x[3]}%` : `${x[i - 1]}% – <${x[i]}%`
  }
  const levelAt = (p: number) => (boundsOk ? [...(b as number[]), Infinity].findIndex((x) => p < x) : -1)

  const patch = (p: Partial<LevelCfg>) => setCfg((c) => ({ ...c, ...p }))
  const setIdx = (k: keyof LevelCfg, i: number, v: string) => setCfg((c) => ({ ...c, [k]: c[k].map((x, n) => (n === i ? v : x)) }))

  const moveHandle = (i: number, clientX: number) => {
    const r = barRef.current!.getBoundingClientRect()
    const raw = Math.round(((clientX - r.left) / r.width) * axis)
    const lo = (i === 0 ? 0 : b[i - 1] ?? 0) + 1
    const hi = (i === 3 ? axis : b[i + 1] ?? axis) - 1
    setIdx('bounds', i, String(Math.max(lo, Math.min(hi, raw))))
  }
  const nudge = (i: number, d: number) => {
    const v = b[i]
    if (v === null) return
    const lo = (i === 0 ? 0 : b[i - 1] ?? 0) + 1
    const hi = (i === 3 ? axis : b[i + 1] ?? axis) - 1
    setIdx('bounds', i, String(Math.max(lo, Math.min(hi, v + d))))
  }

  const insertVar = (v: string) => {
    if (active === null || locked) return
    const el = areas.current[active]
    const t = `{${v}}`
    const s = el?.selectionStart ?? cfg.msgs[active].length
    const e = el?.selectionEnd ?? s
    const cur = cfg.msgs[active]
    setIdx('msgs', active, (cur.slice(0, s) + t + cur.slice(e)).slice(0, 240))
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(s + t.length, s + t.length) })
  }

  const saveDraft = () => {
    levelStore.draft = same(cfg, pub) ? null : cfg
    setBase(cfg)
    toast('Đã lưu bản nháp cấu hình đánh giá.')
  }
  const tryPublish = () => (hasError ? toast('Vui lòng sửa các lỗi trước khi phát hành.') : setConfirm(true))
  const doPublish = () => {
    publishCfg(cfg)
    setBase(cfg); setConfirm(false)
    toast('Đã phát hành cấu hình đánh giá.')
  }

  const setSample = (v: number) => { const n = Math.max(0, Math.min(300, Math.round(v))); setPct(n); setPctText(String(n)) }
  const li = Math.max(0, levelAt(pct))
  const actual = Math.round((TARGET * pct) / 100)
  const hex = cfg.hex[li]
  const message = renderMsg(cfg.msgs[li] || '', { store: STORE, kpi: KPI_NAME, pct, target: TARGET, actual })

  const thresholdsChanged = !same({ ...cfg, names: [], hex: [], msgs: [] }, { ...pub, names: [], hex: [], msgs: [] })
  let stagger = false

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-[650] tracking-[-0.01em]">Cấu hình đánh giá</h1>
          <p className="mt-1 text-[15px] text-mute">Thiết lập ngưỡng, màu sắc và thông điệp hiển thị theo mức độ hoàn thành KPI.</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-semibold"><span className={cx('size-2.5 rounded-full', isDraft ? 'bg-[#d9a441]' : 'bg-[#3d9a73]')} />{isDraft ? 'Bản nháp' : 'Đã phát hành'}</span>
            {locked ? <Btn kind="primary" onClick={() => setEditing(true)}>Chỉnh sửa</Btn> : (
              <>
                <Btn disabled={!unsaved} onClick={saveDraft}>Lưu nháp</Btn>
                <Btn kind="primary" disabled={!isDraft && !unsaved} onClick={tryPublish}>Phát hành</Btn>
              </>
            )}
          </div>
          <p className="text-[13px] text-mute">{isDraft ? 'Store Manager vẫn dùng cấu hình đã phát hành trước đó. ' : ''}Cập nhật lần cuối: {levelStore.meta.at} · Bởi: {levelStore.meta.by}</p>
        </div>
      </div>

      <section aria-label="KPI áp dụng" className="mt-6 rounded-xl border border-line bg-white px-5 py-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="w-full sm:w-[240px]">
          <span className="block text-[13px] font-medium text-mute mb-1.5">KPI áp dụng <span className="text-brand">*</span></span>
          <Select label="KPI áp dụng" value="qty" onChange={() => {}} options={[['qty', KPI_NAME]]} />
        </div>
        <div><p className="text-[13px] text-mute font-medium">Đơn vị</p><p className="mt-1 min-h-6 font-semibold">Sản phẩm (SP)</p></div>
        <div><p className="text-[13px] text-mute font-medium">Chiều đánh giá</p><p className="mt-1 min-h-6 font-semibold inline-flex items-center gap-1.5"><TrendingUp className="size-4 text-mute" />Càng cao càng tốt</p></div>
        <p className="basis-full text-[14px] text-mute -mt-1">Cấu hình này áp dụng cho tất cả cửa hàng sử dụng KPI Số lượng bán.</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)] items-start">
        <fieldset disabled={locked} className="contents">
          <div className="space-y-6 min-w-0">
            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />5 mức đánh giá</h2>
              <p className="mt-0.5 text-sm text-mute">Thiết lập khoảng tỷ lệ hoàn thành KPI tương ứng với từng mức hiệu suất. Kéo các điểm phân cách hoặc nhập số trực tiếp.</p>

              <div className="mt-8 px-3">
                <div ref={barRef} className="relative h-9 select-none">
                  {edges ? (
                    <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                      {edges.slice(0, 5).map((s, i) => (
                        <div key={i} style={{ width: `${((edges[i + 1] - s) / axis) * 100}%`, backgroundColor: cfg.hex[i] }} className="grid place-items-center text-[13px] font-semibold text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] overflow-hidden">{i + 1}</div>
                      ))}
                    </div>
                  ) : <div className="absolute inset-0 rounded-lg bg-sand ring-1 ring-inset ring-line grid place-items-center text-sm text-mute">Sửa ngưỡng không hợp lệ để xem thanh đánh giá</div>}
                  {edges && b.map((v, i) => {
                    const prev = i === 0 ? 0 : (b[i - 1] as number)
                    const high = !stagger && (v as number) - prev < axis * 0.09
                    stagger = high
                    return (
                      <div
                        key={i}
                        role="slider"
                        aria-label={`Ngưỡng ${i + 1}`}
                        aria-valuemin={0}
                        aria-valuemax={axis}
                        aria-valuenow={v as number}
                        tabIndex={locked ? -1 : 0}
                        onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(i, -1) } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(i, 1) } }}
                        onPointerDown={(e) => { if (locked) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag(i) }}
                        onPointerMove={(e) => { if (drag === i) moveHandle(i, e.clientX) }}
                        onPointerUp={() => setDrag(null)}
                        onPointerCancel={() => setDrag(null)}
                        className={cx('absolute top-0 h-full w-5 -ml-2.5 touch-none grid place-items-center group focus-visible:outline-none', locked ? 'cursor-not-allowed' : 'cursor-col-resize')}
                        style={{ left: at(v as number) }}
                      >
                        <span className={cx('block h-[calc(100%+8px)] rounded-full transition-[width,background-color] group-hover:w-[3px] group-focus-visible:w-[3px] group-focus-visible:bg-brand', drag === i ? 'w-[3px] bg-brand' : 'w-0.5 bg-ink/80')} />
                        <span className={cx('absolute left-1/2 -translate-x-1/2 px-1.5 h-6 grid place-items-center rounded-md bg-ink text-white text-[13px] font-semibold pointer-events-none', high ? 'bottom-[calc(100%+34px)]' : 'bottom-[calc(100%+10px)]')}>{v}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="relative mt-2 h-5 text-[12px] text-mute" aria-hidden>
                  <span className="absolute left-0">0%</span>
                  <span className="absolute right-0 translate-x-1/2">{axis}%</span>
                </div>
              </div>

              
              {thresholdsChanged && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#EEF4FA] px-4 py-3 text-[14px] text-[#3F6480]"><Info className="size-4 mt-0.5 shrink-0" />Thay đổi ngưỡng có thể làm thay đổi mức đánh giá của các cửa hàng khi cấu hình mới được phát hành.</p>
              )}
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Biến có thể sử dụng</h2>
              <p className="mt-0.5 text-sm text-mute">{active === null ? 'Chọn một ô thông điệp bên dưới, rồi nhấp vào biến để chèn tại vị trí con trỏ.' : `Nhấp để chèn vào thông điệp Mức ${active + 1}.`}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MSG_VARS.map((v) => (
                  <button key={v} type="button" disabled={active === null} onMouseDown={(e) => e.preventDefault()} onClick={() => insertVar(v)} className="min-h-9 px-3 rounded-full bg-sand ring-1 ring-inset ring-line text-[14px] font-mono hover:bg-tint hover:ring-brand/30 disabled:opacity-60 disabled:hover:bg-sand disabled:cursor-not-allowed">{`{${v}}`}</button>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-mute">{'{tỷ lệ hoàn thành}'}, {'{target}'}, {'{thực tế}'} và {'{phần còn thiếu}'} chỉ hiển thị số. Hãy tự thêm “%” hoặc “SP” sau biến. Nếu đã vượt Target, {'{phần còn thiếu}'} là 0.</p>
            </section>

            <div className="space-y-3">
              {cfg.names.map((_, i) => (
                <section key={i} aria-label={`Mức ${i + 1}`} className="rounded-xl border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span style={{ backgroundColor: cfg.hex[i] }} className="size-4 rounded-md ring-1 ring-black/10" />
                    <h3 className="text-[13px] font-semibold tracking-[0.06em] text-mute uppercase">Mức {i + 1}</h3>
                    <span className="ml-auto text-[14px] font-semibold">{range(i)}</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
                    <label className="block">
                      <span className="block text-[13px] font-medium text-mute mb-1.5">Tên hiển thị</span>
                      <input value={cfg.names[i]} maxLength={16} onChange={(e) => setIdx('names', i, e.target.value)} className={textInput(!!nameErr[i])} />
                      {nameErr[i] && <span className="block mt-1 text-[13px] text-[#c22d20]">{nameErr[i]}</span>}
                    </label>
                    <div>
                      <span className="block text-[13px] font-medium text-mute mb-1.5">Khoảng</span>
                      <div className="flex flex-wrap items-center gap-2 min-h-11 text-[15px]">
                        {i < 4 ? (
                          <>
                            <span className="text-mute">{i === 0 ? '0%' : `${cfg.bounds[i - 1]}%`} → &lt;</span>
                            <div className="relative w-24"><input aria-label={`Đến dưới ${i + 1}`} inputMode="numeric" value={cfg.bounds[i]} onChange={(e) => setIdx('bounds', i, e.target.value)} className={cx(textInput(!!bErr[i]), 'pr-7 text-right')} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">%</span></div>
                          </>
                        ) : (
                          <>
                            <span className="text-mute">Từ</span>
                            <div className="relative w-24"><input aria-label="Từ mức 5" inputMode="numeric" value={cfg.bounds[3]} onChange={(e) => setIdx('bounds', 3, e.target.value)} className={cx(textInput(!!bErr[3]), 'pr-7 text-right')} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">%</span></div>
                            <span className="text-mute">trở lên</span>
                          </>
                        )}
                      </div>
                      {i < 4 && bErr[i] && <span className="block mt-1 text-[13px] text-[#c22d20]">{bErr[i]}</span>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="block text-[13px] font-medium text-mute mb-1.5">Màu hiển thị</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {PALETTE.map(([h, n]) => (
                        <button key={h} type="button" title={n} aria-label={n} aria-pressed={cfg.hex[i] === h} onClick={() => setIdx('hex', i, h)} style={{ backgroundColor: h }} className={cx('size-8 rounded-full ring-1 ring-black/10 grid place-items-center', cfg.hex[i] === h && 'outline-2 outline-offset-2 outline-ink')}>
                          {cfg.hex[i] === h && <span className="size-2 rounded-full bg-white" />}
                        </button>
                      ))}
                      <label className="ml-1 inline-flex items-center gap-2 min-h-10 px-2.5 rounded-lg ring-1 ring-inset ring-[#d8d2cf] text-[14px] cursor-pointer hover:bg-sand">
                        <input type="color" value={cfg.hex[i]} onChange={(e) => setIdx('hex', i, e.target.value)} aria-label={`Chọn màu tùy chỉnh mức ${i + 1}`} className="size-6 p-0 border-0 bg-transparent cursor-pointer" />
                        <span className="font-mono uppercase text-mute">{cfg.hex[i]}</span>
                      </label>
                    </div>
                  </div>
                  <label className="block mt-4">
                    <span className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-mute">Thông điệp</span>
                      <button type="button" onClick={() => setIdx('msgs', i, SUGGEST[i])} className="h-7 px-2.5 rounded-md bg-sand ring-1 ring-inset ring-line text-[13px] font-medium hover:bg-tint hover:ring-brand/30">Gợi ý tự động</button>
                    </span>
                    <textarea
                      ref={(el) => { areas.current[i] = el }}
                      value={cfg.msgs[i]}
                      rows={2}
                      maxLength={240}
                      onFocus={() => setActive(i)}
                      onChange={(e) => setIdx('msgs', i, e.target.value)}
                      className={cx('w-full px-3.5 py-2.5 rounded-lg bg-white text-[15px] ring-1 ring-inset focus:outline-2 focus:outline-brand resize-y', msgErr[i] ? 'ring-[#e0392b] bg-risk-bg' : 'ring-[#d8d2cf]')}
                    />
                    <span className="flex justify-between mt-1 text-[13px]"><span className="text-[#c22d20]">{msgErr[i]}</span><span className="text-mute">{cfg.msgs[i].length}/240</span></span>
                  </label>
                </section>
              ))}
            </div>
          </div>
        </fieldset>

        <aside aria-label="Xem trước" className="lg:sticky lg:top-20 rounded-xl border border-line bg-white p-5 min-w-0">
          <h2 className="flex items-center gap-2.5 text-[19px] font-semibold"><span aria-hidden className="w-1 h-5 rounded-full bg-brand" />Xem trước</h2>
          <p className="mt-0.5 text-sm text-mute">Kiểm tra cách cấu hình sẽ hiển thị trên Dashboard cửa hàng.</p>

          <div className="mt-4">
            <span className="block text-[13px] font-medium text-mute mb-1.5">Tỷ lệ hoàn thành mẫu</span>
            <div className="flex items-center gap-3">
              <div className="relative w-28">
                <input inputMode="numeric" aria-label="Tỷ lệ hoàn thành mẫu" value={pctText} onChange={(e) => { setPctText(e.target.value); const n = num(e.target.value); if (n !== null && n <= 300) setPct(n) }} onBlur={() => setPctText(String(pct))} className={cx(textInput(), 'pr-7 text-right')} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">%</span>
              </div>
              <input type="range" min={0} max={120} value={Math.min(pct, 120)} onChange={(e) => setSample(+e.target.value)} aria-label="Kéo chọn tỷ lệ mẫu" className="flex-1 accent-[#C72128]" />
            </div>
            <div className="mt-1 flex justify-between text-[12px] text-mute px-0.5"><span>0%</span><span>120%</span></div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setSample(p)} className={cx('min-h-9 px-3.5 rounded-full text-[14px] font-semibold ring-1 ring-inset', pct === p ? 'bg-ink text-white ring-ink' : 'bg-white ring-[#d8d2cf] hover:bg-sand')}>{p}%</button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line overflow-hidden">
            <div className="p-5">
              <p className="text-[15px] font-semibold uppercase">{STORE}</p>
              <p className="text-[12px] tracking-[0.08em] text-mute font-semibold uppercase mt-0.5">KPI tháng 10/2026</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-[56px] leading-none font-[650] tracking-[-0.03em]">{pct}<span className="text-[30px]">%</span></p>
                {boundsOk ? <Chip hex={hex} label={cfg.names[li]} /> : <span className="text-[13px] text-mute">Chưa xác định</span>}
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-ink/10 overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: boundsOk ? hex : '#c3ccc8' }} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div><dt className="text-[13px] text-mute font-medium">Đã bán</dt><dd className="font-semibold">{grp(actual)} / {grp(TARGET)} SP</dd></div>
                <div className="text-right"><dt className="text-[13px] text-mute font-medium">{actual >= TARGET ? 'Vượt' : 'Còn'}</dt><dd className="font-semibold">{grp(Math.abs(TARGET - actual))} SP</dd></div>
              </dl>
            </div>
            <div style={{ backgroundColor: boundsOk ? tint(hex) : undefined, borderColor: boundsOk ? `color-mix(in srgb, ${hex} 30%, white)` : undefined }} className="border-t px-5 py-3.5 text-[15px] flex items-start gap-3 bg-sand">
              <Target className="size-5 mt-0.5 shrink-0 text-mute" aria-hidden />
              <p>{boundsOk ? message || 'Chưa có thông điệp.' : 'Cần sửa ngưỡng để xem thông điệp.'}</p>
            </div>
          </div>
          {li >= 0 && boundsOk && <p className="mt-3 text-[13px] text-mute">{pct}% thuộc <b className="text-ink">Mức {li + 1} · {cfg.names[li]}</b> ({range(li)}).</p>}
        </aside>
      </div>

      {unsaved && (
        <>
          <div className="h-6" />
          <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-8 bg-white border-t border-line shadow-[0_-6px_20px_rgba(35,31,32,0.08)] px-4 sm:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="mr-auto text-[15px] font-semibold">Có thay đổi chưa lưu</p>
            <Btn onClick={() => setCfg(base)}>Hủy thay đổi</Btn>
            <Btn onClick={saveDraft}>Lưu nháp</Btn>
            <Btn kind="primary" onClick={tryPublish}>Phát hành</Btn>
          </div>
        </>
      )}

      {confirm && (
        <Confirm title="Phát hành cấu hình đánh giá?" cancel="Quay lại" ok="Phát hành" onCancel={() => setConfirm(false)} onOk={doPublish}>
          <p>Cấu hình mới sẽ được áp dụng cho KPI “Số lượng bán” tại tất cả cửa hàng.</p>
          <p className="text-mute">Kết quả KPI trên Dashboard và Báo cáo sẽ sử dụng các ngưỡng, màu sắc và thông điệp mới.</p>
        </Confirm>
      )}
    </div>
  )
}

