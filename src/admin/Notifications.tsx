import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bell, FileSpreadsheet, Info, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { cx } from './ui'

export type NotiAction = 'target-incomplete' | 'import-review' | 'threshold'

type Noti = { id: string; action: NotiAction; tone: 'warn' | 'info'; icon: LucideIcon; title: string; body: string; time: string; read: boolean }

const SEED: Noti[] = [
  { id: 'n1', action: 'target-incomplete', tone: 'warn', icon: AlertTriangle, title: 'Target chưa hoàn tất', body: '3 cửa hàng chưa hoàn tất Target tháng 10/2026.', time: '10 phút trước', read: false },
  { id: 'n2', action: 'import-review', tone: 'warn', icon: FileSpreadsheet, title: 'Import Excel cần xử lý', body: 'File Target có 8 cảnh báo cần kiểm tra.', time: '1 giờ trước', read: false },
  { id: 'n3', action: 'threshold', tone: 'info', icon: SlidersHorizontal, title: 'Ngưỡng KPI chưa phát hành', body: 'Có thay đổi ngưỡng đánh giá đang ở bản nháp.', time: 'Hôm qua', read: false },
]

const TONE = {
  warn: 'bg-[#FDF3E3] text-[#9a6a12]',
  info: 'bg-[#EEF4FA] text-[#3F6480]',
}

export default function Notifications({ onOpen }: { onOpen: (a: NotiAction) => void }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(SEED)
  const box = useRef<HTMLDivElement>(null)
  const list = items.slice(0, 5)
  const unread = list.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [open])

  const click = (n: Noti) => {
    setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setOpen(false)
    onOpen(n.action)
  }

  return (
    <div ref={box} className="relative">
      <button aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className={cx('relative size-10 grid place-items-center rounded-full hover:bg-white/10', open && 'bg-white/10')}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[#8f1519] ring-2 ring-white text-[11px] font-semibold leading-none">{unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Thông báo" className="fixed left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top)+8px)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] rounded-xl bg-white text-ink border border-line shadow-[0_8px_24px_rgba(35,31,32,0.14)] overflow-hidden adm-pop z-50">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-line">
            <h2 className="text-[15px] font-semibold">Thông báo</h2>
            {unread > 0 && <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-brand text-white text-[12px] font-semibold">{unread}</span>}
            <button type="button" disabled={unread === 0} onClick={() => setItems((l) => l.map((x) => ({ ...x, read: true })))} className="ml-auto text-[13px] font-semibold text-brand rounded-md px-2 h-8 hover:bg-sand disabled:text-mute disabled:hover:bg-transparent disabled:cursor-default">Đánh dấu tất cả đã đọc</button>
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-10 text-center text-[14px] text-mute">Không có thông báo mới</p>
          ) : (
            <ul className="max-h-[min(70vh,420px)] overflow-y-auto divide-y divide-line">
              {list.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => click(n)} className={cx('w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-sand transition-colors', !n.read && 'bg-[#FBFAF9]')}>
                    <span className={cx('mt-0.5 size-8 rounded-lg grid place-items-center shrink-0', TONE[n.tone])}><n.icon className="size-4" strokeWidth={1.9} /></span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-[14px] leading-snug', n.read ? 'font-medium text-mute' : 'font-semibold')}>{n.title}</span>
                      <span className="block mt-0.5 text-[13px] leading-snug text-mute">{n.body}</span>
                      <span className="block mt-1 text-[12px] text-mute">{n.time}</span>
                    </span>
                    {!n.read ? <span aria-label="Chưa đọc" className="mt-2 size-2 rounded-full bg-brand shrink-0" /> : <span className="sr-only">Đã đọc</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
