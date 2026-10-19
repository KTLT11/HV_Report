import { ArrowLeft, Star } from 'lucide-react'
import { LevelBadge, ProductThumb, TopNav, type Route } from './common'
import { pctOf } from './data'
import { DEFAULT_LEVELS } from './levels'
import { DEMO_STORE, productsFor, periodName, type PeriodKey } from './userData'

const levelFor = (pct: number) =>
  DEFAULT_LEVELS.find((l) => pct >= (l.min ?? 0) && (l.max === null || pct <= l.max)) ?? DEFAULT_LEVELS[0]

export default function ProductDetail({ id, go, period }: { id: number; go: (r: Route) => void; period: PeriodKey }) {
  const p = productsFor(period).find((x) => x.id === id)!
  const pct = pctOf(p)
  const level = levelFor(pct)
  const remaining = p.target - p.actual

  return (
    <div className="min-h-screen text-[15px]">
      <TopNav active={1} go={go} />
      <main className="max-w-[880px] mx-auto px-4 sm:px-6 pt-5 pb-14">
        <button onClick={() => go({ page: 'products', mode: 'all' })} className="inline-flex items-center gap-2 min-h-11 -ml-2 px-2 text-[15px] font-semibold text-brand hover:text-brand-deep"><ArrowLeft className="size-5" />Danh sách sản phẩm</button>

        <header className="mt-3 flex items-start gap-5">
          <ProductThumb i={p.thumb} size={88} />
          <div className="min-w-0">
            <p className="text-[13px] text-mute font-medium">Chi tiết sản phẩm · {p.cat} · {periodName(period)} · {DEMO_STORE.name}</p>
            <h1 className="text-[28px] sm:text-[30px] leading-tight font-[650] tracking-[-0.01em]">{p.name}</h1>
          </div>
        </header>

        <section className="mt-8 pt-7 border-t border-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold tracking-[0.06em] text-mute uppercase">Kết quả KPI {periodName(period)}</h2>
            <LevelBadge level={level.color} label={level.label} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-[64px] sm:text-[72px] leading-none font-[650] tracking-[-0.03em]">{pct}<span className="text-[36px] sm:text-[40px]">%</span></span>
            <span className="text-base text-mute font-medium">hoàn thành</span>
          </div>

          <div className="mt-5 h-3 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: level.hex }} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[13px] text-mute font-medium">Đã bán</dt>
              <dd className="mt-1 text-[22px] leading-tight font-semibold">{p.actual} <span className="text-base font-medium text-mute">sản phẩm</span></dd>
            </div>
            <div className="text-right">
              <dt className="text-[13px] text-mute font-medium">KPI được giao</dt>
              <dd className="mt-1 text-[22px] leading-tight font-semibold">{p.target} <span className="text-base font-medium text-mute">sản phẩm</span></dd>
            </div>
          </dl>

          <p className="mt-5 text-base text-mute">
            {remaining > 0 ? <>Còn <b className="font-semibold text-ink">{remaining} sản phẩm</b> để hoàn thành KPI</> : <>Đã hoàn thành KPI, vượt <b className="font-semibold text-ink">{-remaining} sản phẩm</b></>}
          </p>
        </section>

      </main>
    </div>
  )
}
