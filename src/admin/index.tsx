import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Gauge, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Target, X } from 'lucide-react'
import logo from '../imports/image.png'
import type { Route } from '../common'
import { TARGET_PERIOD, cfgKey, genCfg, type KpiId, type Page, type StoreCfg } from './data'
import { Btn, Ctx, Modal, cx, type AdminCtx } from './ui'
import Overview from './Overview'
import TargetList from './TargetList'
import StoreDetail from './StoreDetail'
import Threshold from './Threshold'
import KpiManage from './KpiManage'
import Notifications, { type NotiAction } from './Notifications'

const NAV: { group: string; items: { page: Page; label: string; icon: typeof Target }[] }[] = [
  { group: 'Tổng quan', items: [{ page: { name: 'overview' }, label: 'Tổng quan', icon: LayoutDashboard }] },
  { group: 'KPI', items: [{ page: { name: 'kpis' }, label: 'Quản lý KPI', icon: Gauge }] },
  { group: 'Target', items: [{ page: { name: 'target' }, label: 'Cấu hình Target', icon: Target }] },
  { group: 'Đánh giá', items: [{ page: { name: 'threshold' }, label: 'Cấu hình đánh giá', icon: SlidersHorizontal }] },
]

function Soon({ title }: { title: string }) {
  return <div className="pb-14"><h1 className="text-[28px] leading-tight font-[650] tracking-[-0.01em]">{title}</h1><p className="mt-6 py-14 text-center text-mute border-y border-line">Chưa có trong bản prototype này.</p></div>
}

function SideNav({ page, go, collapsed, onToggle, onSwitch, onLogout }: { page: Page; go: (p: Page) => void; collapsed: boolean; onToggle?: () => void; onSwitch: () => void; onLogout: () => void }) {
  const cur = page.name === 'store' ? 'target' : page.name
  const tip = 'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-[13px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/i:opacity-100 group-focus-visible/i:opacity-100'
  return (
    <div className="flex flex-col h-full">
      <nav aria-label="Điều hướng Admin" className="px-3 pt-7 pb-4 flex flex-col gap-2 flex-1">
        {NAV.map((g) => (
          <div key={g.group} className="space-y-2">
            {g.items.map((i) => {
              const on = cur === i.page.name
              return (
                <button key={i.label} onClick={() => go(i.page)} aria-label={i.label} aria-current={on ? 'page' : undefined} className={cx('group/i relative w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] text-left whitespace-nowrap transition-colors', on ? 'bg-brand text-white font-semibold' : 'hover:bg-sand')}>
                  <i.icon className="size-5 shrink-0" strokeWidth={1.75} />
                  <span className={cx('overflow-hidden transition-opacity duration-200', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>{i.label}</span>
                  {collapsed && <span role="tooltip" className={tip}>{i.label}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-3 pb-5 pt-5 border-t border-line">
        {!collapsed && (
          <div className="px-3 pb-3 leading-tight">
            <p className="text-[13px] font-semibold">Admin Demo</p>
            <p className="text-[12px] text-mute">Target Configuration</p>
          </div>
        )}
        <button onClick={onLogout} aria-label="Đăng xuất" className="group/i relative w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] text-left whitespace-nowrap hover:bg-sand transition-colors">
          <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
          <span className={cx('overflow-hidden transition-opacity duration-200', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>Đăng xuất</span>
          {collapsed && <span role="tooltip" className={tip}>Đăng xuất</span>}
        </button>
        {onToggle && (
          <button onClick={onToggle} aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} aria-expanded={!collapsed} className="group/i relative mt-2 w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] text-mute hover:bg-sand transition-colors">
            {collapsed ? <PanelLeftOpen className="size-5 shrink-0" strokeWidth={1.75} /> : <PanelLeftClose className="size-5 shrink-0" strokeWidth={1.75} />}
            <span className={cx('overflow-hidden whitespace-nowrap transition-opacity duration-200', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>Thu gọn</span>
            {collapsed && <span role="tooltip" className={tip}>Mở rộng</span>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Admin({ exit }: { exit: (r: Route) => void }) {
  const [page, setPage] = useState<Page>({ name: 'overview' })
  const [period, setPeriod] = useState(TARGET_PERIOD)
  const [kpi, setKpi] = useState<KpiId>('qty')
  const [over, setOver] = useState<Record<string, StoreCfg>>({})
  const [listUi, setListUi] = useState({ q: '', status: 'all' })
  const [autoImport, setAutoImport] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [pending, setPending] = useState<null | (() => void)>(null)
  const [toastM, setToastM] = useState<{ m: string; action?: { label: string; onClick: () => void } } | null>(null)
  const dirty = useRef(false)
  const timer = useRef(0)

  const guard = useCallback((fn: () => void) => (dirty.current ? setPending(() => fn) : fn()), [])
  const go = useCallback((p: Page) => guard(() => { setPage(p); setDrawer(false); window.scrollTo({ top: 0 }) }), [guard])
  const toast = useCallback<AdminCtx['toast']>((m, o) => {
    setToastM({ m, action: o?.action })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastM(null), o?.action ? 7000 : 3600)
  }, [])
  const cfgOf = useCallback<AdminCtx['cfgOf']>((p, k, id) => over[cfgKey(p, k, id)] ?? genCfg(p, k, id), [over])
  const saveCfg = useCallback<AdminCtx['saveCfg']>((p, k, id, cfg) => setOver((o) => ({ ...o, [cfgKey(p, k, id)]: cfg })), [])
  const setDirty = useCallback((b: boolean) => { dirty.current = b }, [])

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => { window.removeEventListener('beforeunload', h); window.clearTimeout(timer.current) }
  }, [])

  const openNoti = (a: NotiAction) => guard(() => {
    if (a === 'threshold') setPage({ name: 'threshold' })
    else {
      if (a === 'target-incomplete') setListUi({ q: '', status: 'partial' })
      setAutoImport(a === 'import-review')
      setPage({ name: 'target' })
    }
    setDrawer(false); window.scrollTo({ top: 0 })
  })

  const switchRole = () => guard(() => exit({ page: 'overview' }))
  const logout = () => guard(() => exit({ page: 'login' }))

  const ctx: AdminCtx = { period, kpi, setPeriod, setKpi, go, cfgOf, saveCfg, toast, setDirty, listUi, setListUi }

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-screen text-[15px]">
        <header className="sticky top-0 z-30 bg-brand text-white pt-[env(safe-area-inset-top)]">
          <div className="px-4 sm:px-6 h-14 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button aria-label="Mở menu" onClick={() => setDrawer(true)} className="lg:hidden size-11 -ml-2 grid place-items-center rounded-full hover:bg-white/10"><Menu className="size-5" /></button>
              <img src={logo} alt="Hồng Vân Pharmacy" className="h-8 w-auto" />
            </div>
            <p className="flex-1 min-w-0 text-[14px] font-semibold truncate hidden sm:block">Hệ thống quản lý hiệu suất KPI</p>
            <span className="flex-1 sm:hidden" />
            <Notifications onOpen={openNoti} />
            <div className="flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-white/20 grid place-items-center text-sm font-semibold">QT</span>
              <span className="hidden sm:block leading-tight"><span className="block text-sm font-semibold">Trần Minh Quân</span><span className="block text-[12px] text-white/80">Quản trị viên</span></span>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside className={cx('hidden lg:block shrink-0 border-r border-line sticky top-14 self-start h-[calc(100vh-3.5rem)] transition-[width] duration-200 ease-out bg-white z-20', collapsed ? 'w-[76px]' : 'w-60')}>
            <SideNav page={page} go={go} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onSwitch={switchRole} onLogout={logout} />
          </aside>
          <main className="flex-1 min-w-0 px-4 sm:px-8 pt-7 bg-[#FBFAF9]">
            <div className="max-w-[1360px]">
              {page.name === 'overview' && <Overview />}
              {page.name === 'target' && <TargetList autoImport={autoImport} onAutoImported={() => setAutoImport(false)} />}
              {page.name === 'threshold' && <Threshold />}
              {page.name === 'kpis' && <KpiManage />}
              {page.name === 'store' && <StoreDetail key={`${page.id}|${period}|${kpi}`} id={page.id} />}
            </div>
          </main>
        </div>

        {drawer && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-ink/40 qv-fade" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 w-72 bg-white overflow-y-auto adm-pop">
              <div className="flex items-center justify-between px-4 h-14 bg-brand text-white">
                <img src={logo} alt="Hồng Vân Pharmacy" className="h-9 w-auto" />
                <button aria-label="Đóng menu" onClick={() => setDrawer(false)} className="size-11 grid place-items-center rounded-full hover:bg-white/10"><X className="size-5" /></button>
              </div>
              <div className="h-[calc(100%-3.5rem)]"><SideNav page={page} go={go} collapsed={false} onSwitch={switchRole} onLogout={logout} /></div>
            </div>
          </div>
        )}

        {pending && (
          <Modal z={80} title="Bạn có thay đổi chưa được lưu." sub="Rời trang sẽ mất các Target đã nhập nhưng chưa lưu." onClose={() => setPending(null)} footer={<><Btn onClick={() => setPending(null)}>Ở lại</Btn><Btn kind="primary" onClick={() => { const f = pending; setPending(null); dirty.current = false; f() }}>Rời trang</Btn></>}>
            <span />
          </Modal>
        )}

        {toastM && (
          <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 rounded-lg bg-ink text-white pl-4 pr-2 py-2.5 text-[15px] shadow-[0_8px_24px_rgba(35,31,32,0.25)] max-w-[calc(100vw-2rem)]">
            <Check className="size-5 text-[#8dc8a0] shrink-0" />
            <span>{toastM.m}</span>
            {toastM.action && <button onClick={() => { toastM.action!.onClick(); setToastM(null) }} className="min-h-10 px-3 rounded-md font-semibold text-white underline underline-offset-4 hover:bg-white/10">{toastM.action.label}</button>}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
