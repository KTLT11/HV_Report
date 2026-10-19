import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import {
  LevelBadge,
  ProductThumb,
  Sheet,
  TopNav,
  type Route,
} from "./common"
import { CAT_NAMES, levelOf, pctOf, type Prod } from "./data"
import { DEMO_STORE, USER_PERIODS, productsFor, type PeriodKey } from "./userData"
import { DEFAULT_LEVELS, levelFor } from "./levels"

const PAGE_SIZE = 10

const SORT_OPTIONS: [string, string][] = [
  ["low", "KPI thấp nhất"],
  ["high", "KPI cao nhất"],
  ["name", "Tên A–Z"],
]

const PERCENT_TONE: Record<string, string> = {
  risk: "text-lv1",
  watch: "text-[#c46a0f]",
  ok: "text-[#65736e]",
  good: "text-[#357f55]",
  great: "text-lv5",
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  small = false,
}: {
  value: T
  onChange: (value: T) => void
  options: [T, string][]
  small?: boolean
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-full bg-sand p-1 font-medium ${
        small ? "text-sm" : "text-[15px]"
      }`}
    >
      {options.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`${
            small ? "min-h-9 px-3.5" : "min-h-11 px-5"
          } rounded-full transition-colors whitespace-nowrap ${
            value === key
              ? "bg-brand text-white font-semibold"
              : "text-mute hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
  className?: string
}) {
  const current = options.find((option) => option[0] === value)?.[1]

  return (
    <label
      className={`relative inline-flex items-center min-h-11 rounded-lg bg-sand pl-3.5 pr-9 text-[15px] cursor-pointer hover:bg-[#edeae7] focus-within:outline-2 focus-within:outline-brand ${className}`}
    >
      <span className="text-mute mr-1.5 whitespace-nowrap">{label}</span>
      <span className="font-semibold whitespace-nowrap">{current}</span>
      <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      >
        {options.map(([key, optionLabel]) => (
          <option key={key} value={key}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function Progress({
  product,
  large = false,
}: {
  product: Prod
  large?: boolean
}) {
  const pct = pctOf(product)
  const level = levelOf(pct)
  const levelMeta = levelFor(pct)
  const remaining = Math.max(0, product.target - product.actual)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`${
            large ? "text-[30px]" : "text-[24px]"
          } leading-none font-semibold`}
          style={{ color: levelMeta.hex }}
        >
          {pct}%
        </span>
        <LevelBadge level={level} label={levelMeta.label} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: levelMeta.hex }}
        />
      </div>
      <p className="mt-2 text-[13px] text-mute">
        {remaining > 0
          ? `Còn ${remaining} SP để hoàn thành KPI`
          : "Đã hoàn thành KPI"}
      </p>
    </div>
  )
}

function ProductRow({ product, onOpen }: { product: Prod; onOpen: () => void }) {
  return (
    <li className="border-b border-line">
      <button
        onClick={onOpen}
        className="group w-full grid grid-cols-[56px_minmax(0,1fr)_24px] md:grid-cols-[56px_minmax(13rem,1.3fr)_minmax(8rem,0.65fr)_minmax(17rem,1.25fr)_24px] gap-x-4 md:gap-x-6 gap-y-3.5 items-center py-4 px-2 -mx-2 text-left hover:bg-sand/70 transition-colors rounded-md"
      >
        <span className="col-start-1 row-start-1">
          <ProductThumb i={product.thumb} size={56} />
        </span>

        <span className="col-start-2 row-start-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-semibold leading-snug">
              {product.name}
            </span>
          </span>
          <span className="md:hidden block mt-1.5 text-sm text-mute">
            Đã bán {product.actual} / KPI {product.target} SP
          </span>
        </span>

        <span className="hidden md:block">
          <span className="block text-[17px] font-semibold">
            {product.actual} / {product.target} SP
          </span>
          <span className="block mt-1 text-[13px] text-mute">Đã bán / KPI</span>
        </span>

        <span className="col-span-3 md:col-span-1 md:col-start-4 md:row-start-1">
          <Progress product={product} />
        </span>

        <span className="col-start-3 row-start-1 md:col-start-5 text-mute group-hover:text-ink">
          <ChevronRight className="size-6 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </button>
    </li>
  )
}

function ProductQuick({
  product,
  onClose,
  go,
}: {
  product: Prod
  onClose: () => void
  go: (route: Route) => void
}) {
  const remaining = Math.max(0, product.target - product.actual)

  return (
    <Sheet
      onClose={onClose}
      eyebrow="KPI sản phẩm"
      title={product.name}
      lead={<ProductThumb i={product.thumb} />}
      cta="Xem chi tiết sản phẩm"
      onCta={() => go({ page: "detail", id: product.id })}
    >
      <div className="rounded-xl bg-sand p-4">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-[13px] text-mute">Đã bán</p>
            <p className="mt-1 text-[24px] leading-tight font-semibold">
              {product.actual} SP
            </p>
          </div>
          <div>
            <p className="text-[13px] text-mute">KPI được giao</p>
            <p className="mt-1 text-[24px] leading-tight font-semibold">
              {product.target} SP
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[13px] text-mute font-medium">
          Mức độ hoàn thành KPI
        </p>
        <Progress product={product} large />
      </div>

      <div className="mt-6 pt-5 border-t border-line">
        <p className="text-[13px] text-mute font-medium">Kết quả cần đạt</p>
        <p className="mt-1.5 text-[17px] font-semibold">
          {remaining > 0
            ? `Bán thêm ${remaining} sản phẩm để hoàn thành KPI`
            : "Sản phẩm đã hoàn thành KPI được giao"}
        </p>
      </div>
    </Sheet>
  )
}

export default function ProductList({
  route,
  go,
  period,
  setPeriod,
}: {
  route: Extract<Route, { page: "products" }>
  go: (route: Route) => void
  period: PeriodKey
  setPeriod: (p: PeriodKey) => void
}) {
  const allProducts = useMemo(() => productsFor(period), [period])
  const [category, setCategory] = useState(route.cat ?? "all")
  const [status, setStatus] = useState(route.level ?? "all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("low")
  const [page, setPage] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [quickId, setQuickId] = useState<number | null>(null)

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      DEFAULT_LEVELS.map((level) => [level.key, 0]),
    )
    allProducts.forEach((product) => {
      counts[levelOf(pctOf(product))] += 1
    })
    return counts
  }, [allProducts])

  const products = useMemo(() => {
    const normalizedQuery = normalize(query.trim())
    const filtered = allProducts.filter((product) => {
      if (category !== "all" && product.cat !== category) return false
      if (status !== "all" && levelOf(pctOf(product)) !== status) return false
      if (normalizedQuery && !normalize(product.name).includes(normalizedQuery))
        return false
      return true
    })

    return filtered.sort((a, b) => {
      if (sort === "high") return pctOf(b) - pctOf(a)
      if (sort === "name") return a.name.localeCompare(b.name, "vi")
      return pctOf(a) - pctOf(b)
    })
  }, [allProducts, category, query, sort, status])

  const total = products.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const from = total ? currentPage * PAGE_SIZE + 1 : 0
  const to = Math.min(total, (currentPage + 1) * PAGE_SIZE)
  const visibleProducts = products.slice(currentPage * PAGE_SIZE, to)
  const quickProduct =
    quickId === null ? null : allProducts.find((product) => product.id === quickId)
  const filtered =
    category !== "all" || status !== "all" || query !== ""

  const resetFilters = () => {
    setCategory("all")
    setStatus("all")
    setQuery("")
    setPage(0)
  }

  return (
    <div className="min-h-screen text-[15px]">
      <TopNav active={1} go={go} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-7 pb-14">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[30px] leading-tight font-[650] tracking-[-0.01em]">
              Sản phẩm
            </h1>
            <p className="mt-1.5 text-base text-mute">
              Theo dõi mức độ hoàn thành KPI bán hàng của từng sản phẩm
            </p>
          </div>
          <select aria-label="Kỳ" value={period} onChange={e => { setPeriod(e.target.value as PeriodKey); setPage(0) }} className="min-h-12 rounded-full bg-sand px-5 font-semibold">{USER_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
        </header>

        <section className="mt-6 py-4 border-y border-line flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-[17px] font-semibold">
            {allProducts.length} sản phẩm · {DEMO_STORE.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {DEFAULT_LEVELS.map((level) => (
              <button
                key={level.key}
                onClick={() => {
                  setStatus(level.key)
                  setPage(0)
                }}
                className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors"
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: level.hex }} />
                <strong className="text-ink font-semibold">
                  {levelCounts[level.key]}
                </strong>
                {level.label}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <div
            className={`order-4 lg:order-none w-full lg:w-auto flex-wrap gap-2.5 ${
              filtersOpen ? "flex" : "hidden"
            } lg:contents`}
          >
            <Select
              label="Danh mục:"
              value={category}
              onChange={(value) => {
                setCategory(value)
                setPage(0)
              }}
              options={[
                ["all", "Tất cả danh mục"],
                ...CAT_NAMES.map((item) => [item, item] as [string, string]),
              ]}
            />
            <Select
              label="Trạng thái:"
              value={status}
              onChange={(value) => {
                setStatus(value)
                setPage(0)
              }}
              options={[
                ["all", "Tất cả"],
                ...DEFAULT_LEVELS.map(
                  (level) => [level.key, level.label] as [string, string],
                ),
              ]}
            />
          </div>

          <label className="order-1 lg:order-none flex-1 min-w-[200px] lg:max-w-[300px] relative">
            <Search className="size-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(0)
              }}
              placeholder="Tìm tên sản phẩm..."
              aria-label="Tìm tên sản phẩm"
              className="w-full min-h-11 pl-11 pr-3 rounded-lg bg-sand text-[15px] placeholder:text-mute focus:outline-2 focus:outline-brand"
            />
          </label>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            className="order-2 lg:hidden inline-flex items-center gap-2 min-h-11 px-4 rounded-lg bg-sand text-[15px] font-semibold"
          >
            <SlidersHorizontal className="size-4" />
            Bộ lọc
          </button>

          <Select
            className="order-3 lg:ml-auto"
            label="Sắp xếp:"
            value={sort}
            onChange={(value) => {
              setSort(value)
              setPage(0)
            }}
            options={SORT_OPTIONS}
          />
        </div>

        <div className="mt-6">
          <p className="text-sm text-mute">
            {from}–{to} / {total} sản phẩm
          </p>
        </div>

        {total === 0 ? (
          <div className="mt-3 border-t border-line py-14 text-center">
            <p className="text-[17px] font-semibold">
              Không có sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
            {filtered && (
              <button
                onClick={resetFilters}
                className="mt-4 min-h-11 px-5 rounded-lg bg-brand hover:bg-brand-deep text-white text-[15px] font-semibold"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-2 border-t border-line">
            {visibleProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onOpen={() => setQuickId(product.id)}
              />
            ))}
          </ul>
        )}

        {total > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">
              {from}–{to} / {total} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => {
                  setPage(currentPage - 1)
                  window.scrollTo({ top: 0 })
                }}
                className="inline-flex items-center gap-1 min-h-11 px-4 rounded-lg bg-sand text-[15px] font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Trước
              </button>
              <span className="text-[15px] px-2">
                Trang {currentPage + 1} / {pages}
              </span>
              <button
                disabled={currentPage >= pages - 1}
                onClick={() => {
                  setPage(currentPage + 1)
                  window.scrollTo({ top: 0 })
                }}
                className="inline-flex items-center gap-1 min-h-11 px-4 rounded-lg bg-sand text-[15px] font-semibold disabled:opacity-40"
              >
                Sau
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {quickProduct && (
        <ProductQuick
          product={quickProduct}
          onClose={() => setQuickId(null)}
          go={go}
        />
      )}
    </div>
  )
}
