import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Segmented } from './ProductList'
import logo from './imports/image.png'

export type Role = 'manager' | 'staff' | 'admin'
const ACCOUNTS: Record<string, { pass: string; role: Role }> = {
  manager: { pass: 'demo123', role: 'manager' },
  staff: { pass: 'demo123', role: 'staff' },
  admin: { pass: 'demo123', role: 'admin' },
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l4-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l4 3.09C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  )
}

const inputCls = (err: boolean) =>
  `w-full min-h-12 rounded-lg bg-white border px-3.5 text-base placeholder:text-[#A8A2A3] focus:outline-none focus:ring-4 focus:ring-brand/10 transition-shadow ${err ? 'border-[#c22d20]' : 'border-[#E5E5E5] focus:border-brand'}`

export default function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errs, setErrs] = useState<{ user?: string; pass?: string }>({})
  const [alert, setAlert] = useState('')
  const [mode, setMode] = useState<Role>('manager')
  const [busy, setBusy] = useState<'form' | 'google' | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    const next = { user: user.trim() ? undefined : 'Vui lòng nhập tên đăng nhập.', pass: pass ? undefined : 'Vui lòng nhập mật khẩu.' }
    setErrs(next)
    setAlert('')
    if (next.user || next.pass) return
    setBusy('form')
    setTimeout(() => {
      const acc = ACCOUNTS[user.trim().toLowerCase()]
      if (acc && acc.pass === pass) onLogin(mode)
      else {
        setBusy(null)
        setAlert('Tên đăng nhập hoặc mật khẩu không đúng.')
      }
    }, 900)
  }

  const google = () => {
    if (busy) return
    setErrs({})
    setAlert('')
    setBusy('google')
    setTimeout(() => {
      if (navigator.onLine) onLogin(mode)
      else {
        setBusy(null)
        setAlert('Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc sử dụng tài khoản hệ thống.')
      }
    }, 900)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[45fr_55fr] text-[15px] bg-white">
      <aside className="relative overflow-hidden bg-brand text-white flex flex-col lg:rounded-r-[40px] lg:min-h-screen px-5 lg:p-12 max-lg:pt-[max(env(safe-area-inset-top),3.25rem)] max-lg:pb-3 items-center lg:items-stretch">
        <div aria-hidden className="hidden lg:block pointer-events-none absolute inset-0">
          <span className="absolute -right-44 -top-44 size-[560px] rounded-full border border-white/[0.05]" />
          <span className="absolute -left-60 bottom-[6%] size-[460px] rounded-full border border-white/[0.05]" />
          <span className="absolute -bottom-40 -right-24 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.07),transparent)]" />
          <svg className="absolute inset-x-0 bottom-0 w-full h-[30%]" viewBox="0 0 600 260" preserveAspectRatio="xMidYMax slice" fill="none">
            {[70, 130, 190].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
            <path d="M-10 236 C 70 226, 110 214, 170 196 S 270 170, 330 140 S 440 92, 500 66 S 570 34, 610 22" stroke="white" strokeOpacity="0.13" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d="M-10 236 C 70 226, 110 214, 170 196 S 270 170, 330 140 S 440 92, 500 66 S 570 34, 610 22 V 260 H -10 Z" fill="white" fillOpacity="0.02" />
          </svg>
          <svg className="absolute inset-x-0 bottom-0 w-full h-[30%]" viewBox="0 0 600 260" preserveAspectRatio="xMidYMax slice" fill="none">
            {[[110, 212], [230, 164], [330, 140], [450, 86], [560, 40]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="3" fill="#C72128" stroke="white" strokeOpacity="0.16" strokeWidth="1.5" />
            ))}
          </svg>
        </div>
        <img src={logo} alt="Hồng Vân Pharmacy" className="relative h-9 lg:h-[60px] w-auto self-start" />

        <div className="hidden lg:block absolute inset-x-12 top-[52%] -translate-y-1/2">
          <h2 className="text-[40px] xl:text-[44px] leading-[1.12] font-[650] tracking-[-0.02em]">Quản lý KPI cửa hàng<br />trực quan và hiệu quả</h2>
          <p className="mt-4 text-[17px] text-white/85 leading-relaxed max-w-md">Theo dõi hiệu suất, nhận biết vấn đề<br />và cải thiện kết quả kinh doanh mỗi ngày.</p>
        </div>

      </aside>

      <main className="flex flex-col items-center justify-center px-5 sm:px-8 py-10 lg:py-10 min-h-[calc(100vh-7rem)] lg:min-h-screen">
        <div className="w-full max-w-[420px] my-auto">
          <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-brand">Hệ thống quản lý KPI</p>
          <h1 className="mt-2 text-[28px] sm:text-[30px] leading-tight font-[650] tracking-[-0.01em]">Chào mừng trở lại</h1>
          <p className="mt-2 text-sm text-mute">Đăng nhập để tiếp tục quản lý hiệu suất cửa hàng.</p>

          {alert && (
            <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-lg bg-risk-bg px-3.5 py-3 text-[15px] text-[#9d241a]">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />{alert}
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-8 grid gap-5">
            <div>
              <label htmlFor="u" className="block text-[15px] font-semibold mb-1.5">Tên đăng nhập</label>
              <input id="u" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" placeholder="Nhập tên đăng nhập" aria-invalid={!!errs.user} className={inputCls(!!errs.user)} />
              {errs.user && <p className="mt-1.5 text-sm text-[#c22d20]">{errs.user}</p>}
            </div>
            <div>
              <label htmlFor="p" className="block text-[15px] font-semibold mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input id="p" type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={!!errs.pass} className={`${inputCls(!!errs.pass)} pr-12`} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-1 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full text-[#9A9395] hover:text-ink transition-colors">
                  {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {errs.pass && <p className="mt-1.5 text-sm text-[#c22d20]">{errs.pass}</p>}
            </div>

            <div className="flex items-center justify-between gap-4 -mt-1">
              <label className="inline-flex items-center gap-2.5 min-h-11 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-5 rounded accent-[#C72128]" />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="min-h-11 text-[15px] text-mute underline underline-offset-4 hover:text-ink transition-colors">Quên mật khẩu?</button>
            </div>

            <button type="submit" disabled={!!busy} className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-brand text-white text-base font-semibold transition-colors duration-200 hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70">
              {busy === 'form' && <LoaderCircle className="size-5 animate-spin" />}
              {busy === 'form' ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-mute">
            <span className="flex-1 h-px bg-line" />hoặc<span className="flex-1 h-px bg-line" />
          </div>

          <button type="button" onClick={google} disabled={!!busy} className="w-full min-h-12 inline-flex items-center justify-center gap-3 rounded-lg bg-white border border-[#E5E5E5] text-[15px] font-medium transition-colors hover:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60">
            {busy === 'google' ? <LoaderCircle className="size-5 animate-spin" /> : <GoogleIcon />}
            {busy === 'google' ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}
          </button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="text-[13px] text-[#9A9395]">Demo mode</span>
          <Segmented small value={mode} onChange={setMode} options={[['manager', 'Trưởng quầy'], ['staff', 'Nhân viên'], ['admin', 'Admin']]} />
        </div>
        <p className="mt-1 text-[12px] text-[#9A9395] text-center">Tài khoản mẫu: manager, staff hoặc admin · Mật khẩu: demo123</p>
        <p className="mt-1 text-[12px] text-[#9A9395] text-center">Chỉ dùng cho prototype</p>
        <p className="mt-5 text-[13px] text-[#9A9395] text-center">© 2026 Hồng Vân Pharmacy · Hệ thống Quản lý KPI</p>
      </main>
    </div>
  )
}
