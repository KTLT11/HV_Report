export type ExportData = {
  store: string
  period: string
  range: string
  exportedAt: string
  kpi: { sold: number; target: number; pct: number; status: string; remaining: number }
  compare: { label: string; sold: number; target: number; pct: number; status: string }
  compareHead: string
  dSold: number
  dPct: number
  trend: string
  products: { name: string; sold: number; target: number; pct: number; status: string }[]
}

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
export const fileBase = (store: string, periodKey: string) => {
  const name = strip(store.replace(/^Chi nhánh\s+/i, '')).replace(/[^A-Za-z0-9]+/g, '')
  const [y, m] = periodKey.split('-')
  return `BaoCao_KPI_${name}_${m}-${y}`
}

const sign = (n: number) => (n > 0 ? '+' : '')
const num = (n: number, d = 0) => n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportXlsx(d: ExportData, base: string) {
  const { Workbook } = await import('exceljs')
  const wb = new Workbook()
  const ws = wb.addWorksheet('Báo cáo KPI', { views: [{ showGridLines: false }] })
  ws.columns = [{ width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }]
  const head = (t: string) => {
    const r = ws.addRow([t])
    r.font = { bold: true, size: 13, color: { argb: 'FFC72128' } }
    r.height = 24
  }
  const th = (cells: string[]) => {
    const r = ws.addRow(cells)
    r.font = { bold: true }
    r.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F4F2' } }
      c.border = { bottom: { style: 'thin', color: { argb: 'FFE9E4E1' } } }
    })
  }
  const gap = () => ws.addRow([])

  const t = ws.addRow(['BÁO CÁO KPI BÁN HÀNG'])
  t.font = { bold: true, size: 16 }
  gap()
  head('Thông tin báo cáo')
  ws.addRow(['Cửa hàng', d.store])
  ws.addRow(['Kỳ báo cáo', `${d.period} (${d.range})`])
  ws.addRow(['Thời gian xuất', d.exportedAt])
  gap()
  head('Kết quả KPI')
  ws.addRow(['Số lượng đã bán (SP)', d.kpi.sold]).getCell(2).numFmt = '#,##0'
  ws.addRow(['KPI được giao (SP)', d.kpi.target]).getCell(2).numFmt = '#,##0'
  ws.addRow(['% hoàn thành KPI', d.kpi.pct / 100]).getCell(2).numFmt = '0.0%'
  ws.addRow(['Trạng thái KPI', d.kpi.status])
  ws.addRow(['Còn thiếu (SP)', d.kpi.remaining]).getCell(2).numFmt = '#,##0'
  gap()
  head(`So sánh với ${d.compare.label}`)
  th(['Chỉ số', d.compareHead, d.period, 'Thay đổi'])
  const r1 = ws.addRow(['Số lượng bán (SP)', d.compare.sold, d.kpi.sold, d.dSold])
  const r2 = ws.addRow(['KPI được giao (SP)', d.compare.target, d.kpi.target, null])
  const r3 = ws.addRow(['% hoàn thành', d.compare.pct / 100, d.kpi.pct / 100, d.dPct / 100])
  ws.addRow(['Trạng thái', d.compare.status, d.kpi.status, d.kpi.status === d.compare.status ? 'Không đổi' : ''])
  for (const r of [r1, r2]) for (const i of [2, 3, 4]) r.getCell(i).numFmt = '#,##0;-#,##0'
  for (const i of [2, 3, 4]) r3.getCell(i).numFmt = '0.0%'
  r1.getCell(4).numFmt = '+#,##0;-#,##0;0'
  r3.getCell(4).numFmt = '+0.0" điểm %";-0.0" điểm %"'
  r3.getCell(4).value = d.dPct
  r3.getCell(4).numFmt = '+0.0" điểm %";-0.0" điểm %";0" điểm %"'
  gap()
  head('Chi tiết sản phẩm')
  th(['Sản phẩm', 'Đã bán (SP)', 'KPI được giao (SP)', '% hoàn thành', 'Trạng thái KPI'])
  d.products.forEach((p) => {
    const r = ws.addRow([p.name, p.sold, p.target, p.pct / 100, p.status])
    r.getCell(2).numFmt = '#,##0'
    r.getCell(3).numFmt = '#,##0'
    r.getCell(4).numFmt = '0%'
  })
  ws.addRow([])
  ws.addRow(['Xu hướng theo tuần: ' + d.trend]).font = { color: { argb: 'FF6B6465' } }
  ws.eachRow((r) => r.eachCell((c) => { if (typeof c.value === 'number') c.alignment = { horizontal: 'right' } }))

  const buf = await wb.xlsx.writeBuffer()
  save(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${base}.xlsx`)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Prints a dedicated HTML document, so Vietnamese diacritics render correctly and the user saves it as PDF.
export function exportPdf(d: ExportData, base: string) {
  return new Promise<void>((resolve, reject) => {
    const delta = `${sign(d.dPct)}${num(d.dPct, 1)} điểm %`
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${base}</title><style>
@page{size:A4;margin:16mm}
body{font-family:Manrope,"Segoe UI",Arial,sans-serif;color:#231f20;font-size:12px;margin:0}
h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;margin:22px 0 8px;color:#c72128;text-transform:uppercase;letter-spacing:.04em}
.meta{color:#6b6465;line-height:1.6}
table{width:100%;border-collapse:collapse}th,td{padding:7px 8px;border-bottom:1px solid #e9e4e1;text-align:left}
th{background:#f5f4f2;font-weight:600}td.n,th.n{text-align:right}
.kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.kpi div{background:#f5f4f2;border-radius:6px;padding:10px}
.kpi b{display:block;font-size:16px;margin-top:3px}.kpi span{color:#6b6465;font-size:11px}
tr{break-inside:avoid}thead{display:table-header-group}
</style></head><body>
<h1>Báo cáo KPI bán hàng</h1>
<div class="meta">Cửa hàng: <b>${esc(d.store)}</b><br>Kỳ báo cáo: <b>${esc(d.period)}</b> (${esc(d.range)})<br>Thời gian xuất: ${esc(d.exportedAt)}</div>
<h2>Kết quả KPI</h2>
<div class="kpi">
<div><span>Đã bán</span><b>${num(d.kpi.sold)} SP</b></div>
<div><span>KPI được giao</span><b>${num(d.kpi.target)} SP</b></div>
<div><span>Hoàn thành</span><b>${num(d.kpi.pct, 1)}%</b></div>
<div><span>Trạng thái</span><b>${esc(d.kpi.status)}</b></div>
<div><span>Còn thiếu</span><b>${num(d.kpi.remaining)} SP</b></div></div>
<h2>So sánh với ${esc(d.compare.label)}</h2>
<table><thead><tr><th>Chỉ số</th><th class="n">${esc(d.compareHead)}</th><th class="n">${esc(d.period)}</th><th class="n">Thay đổi</th></tr></thead><tbody>
<tr><td>Số lượng bán</td><td class="n">${num(d.compare.sold)} SP</td><td class="n">${num(d.kpi.sold)} SP</td><td class="n">${sign(d.dSold)}${num(d.dSold)} SP</td></tr>
<tr><td>KPI được giao</td><td class="n">${num(d.compare.target)} SP</td><td class="n">${num(d.kpi.target)} SP</td><td class="n">—</td></tr>
<tr><td>Hoàn thành</td><td class="n">${num(d.compare.pct, 1)}%</td><td class="n">${num(d.kpi.pct, 1)}%</td><td class="n">${delta}</td></tr>
<tr><td>Trạng thái</td><td class="n">${esc(d.compare.status)}</td><td class="n">${esc(d.kpi.status)}</td><td class="n">${d.kpi.status === d.compare.status ? 'Không đổi' : ''}</td></tr>
</tbody></table>
<h2>Chi tiết sản phẩm</h2>
<table><thead><tr><th>Sản phẩm</th><th class="n">Đã bán</th><th class="n">KPI được giao</th><th class="n">% hoàn thành</th><th>Trạng thái KPI</th></tr></thead><tbody>
${d.products.map((p) => `<tr><td>${esc(p.name)}</td><td class="n">${num(p.sold)}</td><td class="n">${num(p.target)}</td><td class="n">${p.pct}%</td><td>${esc(p.status)}</td></tr>`).join('')}
</tbody></table></body></html>`

    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'
    const cleanup = () => setTimeout(() => frame.remove(), 1000)
    frame.onload = () => {
      const w = frame.contentWindow
      if (!w) { cleanup(); reject(new Error('no window')); return }
      try {
        w.focus()
        w.print()
        resolve()
      } catch (e) {
        reject(e)
      }
      cleanup()
    }
    frame.srcdoc = html
    document.body.appendChild(frame)
  })
}
