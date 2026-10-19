import { useState } from 'react'
import { ArrowUp, ArrowDown, MoreHorizontal, Plus } from 'lucide-react'
import { Badge, Btn, Confirm, Field, Modal, PageHead, SearchBox, Select, cx, textInput, useAdmin } from './ui'

type Dir = 'high' | 'low'
type Kpi = { id: number; name: string; desc: string; unit: string; dir: Dir; active: boolean; used: boolean }

const UNITS = ['Sản phẩm (SP)', 'Việt Nam Đồng (VNĐ)', 'Phần trăm (%)', 'Đơn hàng', 'Khách hàng', 'Điểm']
const OTHER = '__other'
const UNIT_OPTS: [string, string][] = [...UNITS.map((u): [string, string] => [u, u]), [OTHER, 'Đơn vị khác...']]
const FILTERS: [string, string][] = [['all', 'Tất cả'], ['on', 'Đang sử dụng'], ['off', 'Ngưng sử dụng']]
const UNIT_EG: Record<string, string> = { 'Sản phẩm (SP)': 'Target: 100 SP · Đã bán: 78 SP', 'Phần trăm (%)': 'Target: 95% · Thực tế: 92%', 'Việt Nam Đồng (VNĐ)': 'Target: 100.000.000 VNĐ', 'Đơn hàng': 'Target: 100 đơn hàng', 'Khách hàng': 'Target: 100 khách hàng', 'Điểm': 'Target: 100 điểm' }

let KPIS: Kpi[] = [{ id: 1, name: 'Số lượng bán', desc: 'Tổng số lượng sản phẩm bán ra trong kỳ', unit: 'Sản phẩm (SP)', dir: 'high', active: true, used: true }]

function DirLabel({ d }: { d: Dir }) {
  const I = d === 'high' ? ArrowUp : ArrowDown
  return <span className="inline-flex items-center gap-1.5"><I className="size-4 text-mute" />{d === 'high' ? 'Càng cao càng tốt' : 'Càng thấp càng tốt'}</span>
}

function Form({ init, list, onClose, onSave }: { init?: Kpi; list: Kpi[]; onClose: () => void; onSave: (k: Omit<Kpi, 'id' | 'used'>) => void }) {
  const known = init ? UNITS.includes(init.unit) : true
  const [name, setName] = useState(init?.name ?? '')
  const [desc, setDesc] = useState(init?.desc ?? '')
  const [unit, setUnit] = useState(init ? (known ? init.unit : OTHER) : UNITS[0])
  const [uName, setUName] = useState(init && !known ? init.unit.replace(/\s*\(.*\)$/, '') : '')
  const [uSym, setUSym] = useState(init && !known ? (init.unit.match(/\((.*)\)$/)?.[1] ?? '') : '')
  const [dir, setDir] = useState<Dir>(init?.dir ?? 'high')
  const [active, setActive] = useState(init?.active ?? true)
  const [tried, setTried] = useState(false)
  const lock = !!init?.used
  const dup = list.some((k) => k.id !== init?.id && k.name.trim().toLowerCase() === name.trim().toLowerCase())
  const errName = !name.trim() ? 'Vui lòng nhập tên KPI.' : dup ? 'Tên KPI đã tồn tại.' : ''
  const errUnit = unit === OTHER && (!uName.trim() || !uSym.trim())
  const submit = () => {
    setTried(true)
    if (errName || errUnit) return
    onSave({ name: name.trim(), desc: desc.trim(), unit: unit === OTHER ? `${uName.trim()} (${uSym.trim()})` : unit, dir, active })
  }
  const radio = (v: Dir, l: string) => (
    <label className={cx('flex items-center gap-3 min-h-11', lock ? 'opacity-60' : 'cursor-pointer')}>
      <input type="radio" name="dir" disabled={lock} checked={dir === v} onChange={() => setDir(v)} className="size-5 accent-[#C72128]" />
      <span className="text-[15px]">{l}</span>
    </label>
  )
  return (
    <Modal title={init ? 'Chỉnh sửa KPI' : 'Thêm KPI'} onClose={onClose} footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" onClick={submit}>{init ? 'Lưu thay đổi' : 'Tạo KPI'}</Btn></>}>
      <div className="space-y-4">
        <Field label="Tên KPI *">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Số lượng bán" className={textInput(tried && !!errName)} />
          {tried && errName && <span className="block mt-1 text-[13px] text-[#c22d20]">{errName}</span>}
        </Field>
        <Field label="Mô tả">
          <textarea value={desc} rows={2} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả ngắn mục đích của KPI" className="w-full px-3.5 py-2.5 rounded-lg bg-white text-[15px] ring-1 ring-inset ring-[#d8d2cf] focus:outline-2 focus:outline-brand resize-y" />
        </Field>
        <div>
          <p className="text-[13px] font-medium text-mute mb-1.5">Đơn vị đo *</p>
          <fieldset disabled={lock} className={lock ? "opacity-60" : ""}><Select label="Đơn vị đo" value={unit} onChange={setUnit} options={UNIT_OPTS} /></fieldset>
          {lock && <p className="mt-1.5 text-[13px] text-[#8a5a00]">Không thể thay đổi đơn vị của KPI đã phát sinh dữ liệu.</p>}
          {unit === OTHER && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Tên đơn vị *"><input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Lượt giao dịch" className={textInput(tried && !uName.trim())} /></Field>
              <Field label="Ký hiệu *"><input value={uSym} onChange={(e) => setUSym(e.target.value)} placeholder="Lượt" className={textInput(tried && !uSym.trim())} /></Field>
            </div>
          )}
          <p className="mt-1.5 text-[13px] text-mute">Đơn vị được sử dụng khi nhập Target và hiển thị kết quả KPI.{UNIT_EG[unit] ? ` Ví dụ: ${UNIT_EG[unit]}.` : ''}</p>
        </div>
        <fieldset disabled={lock}>
          <legend className="text-[13px] font-medium text-mute mb-0.5">Chiều đánh giá *</legend>
          {radio('high', 'Càng cao càng tốt')}
          {radio('low', 'Càng thấp càng tốt')}
          <p className="mt-0.5 text-[13px] text-mute">Chiều đánh giá xác định kết quả KPI tốt hơn khi giá trị tăng hay giảm.</p>
        </fieldset>
        <label className="flex items-center gap-3 min-h-11 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-[#C72128]" />
          <span className="text-[15px]">{init ? 'Đang sử dụng' : 'Kích hoạt KPI sau khi tạo'}</span>
        </label>
      </div>
    </Modal>
  )
}

export default function KpiManage() {
  const { toast } = useAdmin()
  const [list, setList] = useState(KPIS)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [menu, setMenu] = useState<number | null>(null)
  const [form, setForm] = useState<null | 'new' | Kpi>(null)
  const [stop, setStop] = useState<Kpi | null>(null)
  const commit = (n: Kpi[]) => { KPIS = n; setList(n) }

  const view = list.filter((k) => (status === 'all' || (status === 'on') === k.active) && (!q || k.name.toLowerCase().includes(q.toLowerCase())))
  const save = (v: Omit<Kpi, 'id' | 'used'>) => {
    if (form === 'new') { commit([...list, { ...v, id: Math.max(0, ...list.map((k) => k.id)) + 1, used: false }]); toast('Đã tạo KPI.') }
    else if (form) { const id = form.id; commit(list.map((k) => (k.id === id ? { ...k, ...v } : k))); toast('Đã lưu thay đổi.') }
    setForm(null)
  }
  const setActive = (k: Kpi, active: boolean) => commit(list.map((x) => (x.id === k.id ? { ...x, active } : x)))

  return (
    <div className="pb-14 space-y-5">
      <PageHead title="Quản lý KPI" sub="Quản lý các chỉ số KPI được sử dụng để đánh giá hiệu suất cửa hàng.">
        <Btn kind="primary" onClick={() => setForm('new')}><Plus className="size-4" />Thêm KPI</Btn>
      </PageHead>

      <div className="flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm KPI..." className="w-full sm:w-[280px]" />
        <Select label="Trạng thái" value={status} onChange={setStatus} options={FILTERS} className="w-full sm:w-[190px]" />
      </div>

      {view.length === 0 ? (
        <p className="py-12 text-center text-mute border-y border-line">Không có KPI phù hợp.</p>
      ) : (
        <div className="rounded-xl border border-line bg-white overflow-x-auto">
          <table className="w-full text-[15px] min-w-[720px]">
            <thead>
              <tr className="text-left text-[13px] text-mute font-medium shadow-[inset_0_-1px_0_#e9e4e1]">
                <th className="py-3 px-5 font-medium">KPI</th>
                <th className="py-3 px-4 font-medium">Đơn vị</th>
                <th className="py-3 px-4 font-medium">Chiều đánh giá</th>
                <th className="py-3 px-4 font-medium">Trạng thái</th>
                <th className="py-3 px-5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {view.map((k) => (
                <tr key={k.id} className="border-b border-line last:border-b-0">
                  <td className="py-3.5 px-5"><p className="font-semibold">{k.name}</p>{k.desc && <p className="text-[13px] text-mute">{k.desc}</p>}</td>
                  <td className="py-3.5 px-4">{k.unit}</td>
                  <td className="py-3.5 px-4"><DirLabel d={k.dir} /></td>
                  <td className="py-3.5 px-4"><Badge tone={k.active ? 'green' : 'gray'}>{k.active ? 'Đang sử dụng' : 'Ngưng sử dụng'}</Badge></td>
                  <td className="py-3.5 px-5 text-right relative">
                    <button aria-label={`Thao tác ${k.name}`} aria-haspopup="menu" onClick={() => setMenu(menu === k.id ? null : k.id)} className="size-10 inline-grid place-items-center rounded-lg hover:bg-sand"><MoreHorizontal className="size-5" /></button>
                    {menu === k.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                        <div role="menu" className="absolute right-5 top-full -mt-1 z-40 w-48 rounded-xl bg-white py-1.5 text-left shadow-[0_8px_24px_rgba(35,31,32,0.14)] ring-1 ring-line">
                          <button role="menuitem" onClick={() => { setMenu(null); setForm(k) }} className="w-full text-left min-h-11 px-4 hover:bg-sand">Chỉnh sửa</button>
                          {k.active
                            ? <button role="menuitem" onClick={() => { setMenu(null); setStop(k) }} className="w-full text-left min-h-11 px-4 hover:bg-sand">Ngưng sử dụng</button>
                            : <button role="menuitem" onClick={() => { setMenu(null); setActive(k, true); toast('Đã kích hoạt lại KPI.') }} className="w-full text-left min-h-11 px-4 hover:bg-sand">Kích hoạt lại</button>}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && <Form init={form === 'new' ? undefined : form} list={list} onClose={() => setForm(null)} onSave={save} />}
      {stop && (
        <Confirm title="Ngưng sử dụng KPI?" cancel="Hủy" ok="Ngưng sử dụng" onCancel={() => setStop(null)} onOk={() => { setActive(stop, false); setStop(null); toast('Đã ngưng sử dụng KPI.') }}>
          <p>KPI “{stop.name}” sẽ không thể được chọn cho các kỳ cấu hình mới. Dữ liệu và báo cáo lịch sử vẫn được giữ nguyên.</p>
        </Confirm>
      )}
    </div>
  )
}
