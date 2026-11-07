"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiBookmark,
  FiBox,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiGrid,
  FiHardDrive,
  FiHeart,
  FiLayers,
  FiMaximize2,
  FiMenu,
  FiMonitor,
  FiRotateCw,
  FiSave,
  FiSearch,
  FiSliders,
  FiUser,
  FiWind,
  FiX,
  FiZap,
  FiZoomIn,
} from "react-icons/fi";

import { apiRequest } from "@/lib/api/client";

import styles from "./pc-builder-workbench.module.css";

type Step = {
  name: string;
  helper: string;
  icon: IconType;
};

export type ProcessorCatalogItem = {
  id: string;
  name: string;
  slug: string;
  family: "AMD" | "Intel";
  image: string;
  price: number | null;
  currency: string;
  offerCount: number;
  offers: Array<{
    id: string;
    merchant_name: string;
    product_url: string;
    price: number;
    currency: string;
    stock: string;
  }>;
  socket: string;
  power: string;
  cores: number | null;
  threads: number | null;
  baseClock: number | null;
  boostClock: number | null;
  cache: number | null;
};

type SortMode = "default" | "price-asc" | "price-desc";

type SpecFilters = {
  sockets: string[];
  cores: number[];
  threads: number[];
  minClock: number;
  minCache: number;
  priceMin: string;
  priceMax: string;
  sort: SortMode;
};

const PAGE_SIZE = 10;

const emptyFilters: SpecFilters = {
  sockets: [],
  cores: [],
  threads: [],
  minClock: 0,
  minCache: 0,
  priceMin: "",
  priceMax: "",
  sort: "default",
};

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function distinctSorted(values: Array<number | null>): number[] {
  return [...new Set(values.filter((value): value is number => value !== null))].sort((a, b) => a - b);
}

function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

type ProcessorDetail = {
  id: string;
  name: string;
  image_url: string | null;
  socket: string | null;
  tdp_w: number | null;
  max_power_w: number | null;
  ram_types: string[];
  specification_source_url: string | null;
  offers: Array<{
    id: string;
    merchant_name: string;
    product_url: string;
    price: number;
    currency: string;
    stock: string;
    last_checked_at: string | null;
    price_history: Array<{
      price: number;
      currency: string;
      captured_at: string;
    }>;
  }>;
};

const steps: Step[] = [
  { name: "Processor", helper: "Choose your CPU", icon: FiCpu },
  { name: "Motherboard", helper: "Choose a compatible board", icon: FiGrid },
  { name: "RAM", helper: "Add memory modules", icon: FiLayers },
  { name: "Graphics Card", helper: "Choose a GPU", icon: FiMonitor },
  { name: "Storage", helper: "Add SSD or HDD", icon: FiHardDrive },
  { name: "Power Supply", helper: "Choose a PSU", icon: FiZap },
  { name: "Case", helper: "Choose your case", icon: FiBox },
  { name: "Cooling", helper: "Add CPU cooling", icon: FiWind },
];

const money = new Intl.NumberFormat("en-BD");

export function PcBuilderWorkbench({
  processors,
}: {
  processors: ProcessorCatalogItem[];
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedId, setSelectedId] = useState(processors[0]?.id ?? "");
  const [installed, setInstalled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<"All" | "AMD" | "Intel">("All");
  const [mobileSteps, setMobileSteps] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<ProcessorDetail | null>(null);
  const [detailsError, setDetailsError] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SpecFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = processors.find((processor) => processor.id === selectedId) ?? processors[0];

  const options = useMemo(() => {
    const clocks = processors.map((processor) => processor.boostClock ?? processor.baseClock);
    return {
      sockets: [...new Set(processors.map((processor) => processor.socket))].sort(),
      cores: distinctSorted(processors.map((processor) => processor.cores)),
      threads: distinctSorted(processors.map((processor) => processor.threads)),
      maxClock: Math.ceil(Math.max(0, ...clocks.filter((value): value is number => value !== null))),
      maxCache: Math.ceil(Math.max(0, ...processors.map((processor) => processor.cache ?? 0))),
    };
  }, [processors]);

  const visibleProcessors = useMemo(() => {
    const term = search.trim().toLowerCase();
    const priceMin = filters.priceMin === "" ? null : Number(filters.priceMin);
    const priceMax = filters.priceMax === "" ? null : Number(filters.priceMax);
    const matched = processors.filter((processor) => {
      if (family !== "All" && processor.family !== family) return false;
      if (term && !processor.name.toLowerCase().includes(term)) return false;
      if (filters.sockets.length && !filters.sockets.includes(processor.socket)) return false;
      if (filters.cores.length && (processor.cores === null || !filters.cores.includes(processor.cores))) return false;
      if (filters.threads.length && (processor.threads === null || !filters.threads.includes(processor.threads))) return false;
      if (filters.minClock > 0) {
        const clock = processor.boostClock ?? processor.baseClock;
        if (clock === null || clock < filters.minClock) return false;
      }
      if (filters.minCache > 0 && (processor.cache === null || processor.cache < filters.minCache)) return false;
      if (priceMin !== null && !Number.isNaN(priceMin) && (processor.price === null || processor.price < priceMin)) return false;
      if (priceMax !== null && !Number.isNaN(priceMax) && (processor.price === null || processor.price > priceMax)) return false;
      return true;
    });
    if (filters.sort === "default") return matched;
    const direction = filters.sort === "price-asc" ? 1 : -1;
    return [...matched].sort((a, b) => {
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return (a.price - b.price) * direction;
    });
  }, [family, filters, processors, search]);

  const totalPages = Math.max(1, Math.ceil(visibleProcessors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedProcessors = visibleProcessors.slice(pageStart, pageStart + PAGE_SIZE);
  const activeFilterCount =
    filters.sockets.length +
    filters.cores.length +
    filters.threads.length +
    (filters.minClock > 0 ? 1 : 0) +
    (filters.minCache > 0 ? 1 : 0) +
    (filters.priceMin !== "" || filters.priceMax !== "" ? 1 : 0) +
    (filters.sort !== "default" ? 1 : 0);

  function updateFilters(patch: Partial<SpecFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
    listRef.current?.scrollTo({ top: 0 });
  }

  const buildTotal = installed && selected ? (selected.price ?? 0) : 0;
  const progress = installed ? 1 : 0;
  const modalOffers = details?.offers ?? selected?.offers.map((offer) => ({
    ...offer,
    last_checked_at: null,
    price_history: [],
  })) ?? [];
  const bestOffer = modalOffers[0];
  const historyPoints = details?.offers
    .flatMap((offer) => offer.price_history.map((point) => ({
      ...point,
      merchant: offer.merchant_name,
    })))
    .sort((a, b) => a.captured_at.localeCompare(b.captured_at)) ?? [];

  useEffect(() => {
    if (!detailsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDetailsOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [detailsOpen]);

  function chooseStep(index: number) {
    setActiveStep(index);
    setMobileSteps(false);
  }

  function installProcessor() {
    if (!selected) return;
    setInstalled(true);
  }

  async function showProcessorDetails(processor: ProcessorCatalogItem) {
    setSelectedId(processor.id);
    setInstalled(false);
    setDetailsOpen(true);
    setDetails(null);
    setDetailsError(false);
    setFavorite(false);
    setDetailsLoading(true);
    try {
      setDetails(await apiRequest<ProcessorDetail>(`/products/${processor.slug}`));
    } catch {
      setDetailsError(true);
    } finally {
      setDetailsLoading(false);
    }
  }

  function moveNext() {
    if (!installed) return;
    setActiveStep(1);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">TECHBONDHU</Link>
        <span className={styles.slash}>/</span>
        <strong className={styles.productName}>PC BUILDER</strong>
        <button className={styles.mobileMenu} type="button" onClick={() => setMobileSteps((open) => !open)} aria-expanded={mobileSteps} aria-controls="build-sequence">
          {mobileSteps ? <FiX /> : <FiMenu />} <span>Parts</span>
        </button>
        <div className={styles.headerActions}>
          <Link href="/"><FiArrowLeft /> Back to shop</Link>
          <button type="button" onClick={() => setSaved((value) => !value)} aria-pressed={saved}><FiBookmark /> {saved ? "Saved" : "Save build"}</button>
          <Link href="/sign-in"><FiUser /> My account</Link>
        </div>
      </header>

      <div className={styles.workbench}>
        <aside id="build-sequence" className={`${styles.sequence} ${mobileSteps ? styles.sequenceOpen : ""}`}>
          <div className={styles.sequenceHead}><h1>Build sequence</h1><span>{progress}/8</span></div>
          <nav aria-label="PC component sequence">
            {steps.map(({ name, helper, icon: Icon }, index) => (
              <button key={name} className={`${styles.step} ${activeStep === index ? styles.activeStep : ""} ${index === 0 && installed ? styles.completeStep : ""}`} type="button" onClick={() => chooseStep(index)}>
                <span className={styles.stepNumber}>{index === 0 && installed ? <FiCheck /> : String(index + 1).padStart(2, "0")}</span>
                <Icon className={styles.stepIcon} aria-hidden="true" />
                <span className={styles.stepCopy}><strong>{name}</strong><small>{index === 0 && installed && selected ? selected.name : helper}</small></span>
                <FiArrowRight className={styles.stepArrow} aria-hidden="true" />
              </button>
            ))}
          </nav>
          <div className={styles.totalBox}><span>Build total</span><strong>৳ {money.format(buildTotal)}</strong></div>
          <button className={styles.saveButton} type="button" onClick={() => setSaved((value) => !value)}><FiSave /> {saved ? "Build saved" : "Save build"}</button>
        </aside>

        <section className={styles.stage} aria-label="PC assembly preview">
          <div className={styles.diagnostics}>
            <div><FiCpu /><span>CPU socket<small>{installed && selected ? selected.socket : "Not selected"}</small></span></div>
            <div><FiGrid /><span>Motherboard form factor<small>Not selected</small></span></div>
            <div><FiMaximize2 /><span>GPU clearance<small>Checking…</small></span></div>
            <div><FiZap /><span>Power draw<small>{installed && selected ? selected.power : "0W estimated"}</small></span></div>
          </div>

          <div className={`${styles.caseViewport} ${zoomed ? styles.zoomed : ""} ${exploded ? styles.exploded : ""}`}>
            <video autoPlay loop muted playsInline preload="metadata" aria-label="Rotating white PC case">
              <source src="/pc-builder/pc.webm" type="video/webm" />
            </video>
            <div className={styles.measurementX} aria-hidden="true">450 mm</div>
            <div className={styles.measurementY} aria-hidden="true">465 mm</div>
            <div className={`${styles.cpuTarget} ${installed ? styles.cpuInstalled : ""}`} aria-hidden="true">
              <FiCpu /> <span>{installed ? "CPU INSTALLED" : "CPU SLOT"}</span>
            </div>
          </div>

          <div className={styles.stageControls}>
            <button type="button" className={exploded ? styles.controlActive : ""} onClick={() => setExploded((value) => !value)} aria-pressed={exploded}><FiLayers /> Exploded view</button>
            <button type="button" onClick={() => setZoomed(false)}><FiRotateCw /> Rotate</button>
            <button type="button" className={zoomed ? styles.controlActive : ""} onClick={() => setZoomed((value) => !value)} aria-pressed={zoomed}><FiZoomIn /> Zoom</button>
          </div>
        </section>

        <aside className={styles.catalog}>
          {activeStep === 0 ? (
            <>
              <div className={styles.catalogTitle}><h2>Select processor</h2><span>1/8</span></div>
              <label className={styles.searchBox}><FiSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search processors" aria-label="Search processors" /></label>
              <div className={styles.filters} aria-label="Processor family">
                {(["All", "Intel", "AMD"] as const).map((item) => <button type="button" key={item} className={family === item ? styles.filterActive : ""} onClick={() => { setFamily(item); setPage(1); }}>{item}</button>)}
                <button type="button" className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleOpen : ""}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="cpu-filter-panel">
                  <FiSliders /> Filters{activeFilterCount > 0 && <b>{activeFilterCount}</b>} <FiChevronDown className={styles.filterChevron} />
                </button>
              </div>

              {filtersOpen && (
                <div id="cpu-filter-panel" className={styles.filterPanel}>
                  <div className={styles.filterGroup}>
                    <h3>Sort by price</h3>
                    <div className={styles.chipRow}>
                      {sortOptions.map((option) => <button type="button" key={option.value} className={filters.sort === option.value ? styles.chipActive : ""} onClick={() => updateFilters({ sort: option.value })}>{option.label}</button>)}
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <h3>Price range <small>৳</small></h3>
                    <div className={styles.rangeInputs}>
                      <input type="number" inputMode="numeric" min={0} value={filters.priceMin} onChange={(event) => updateFilters({ priceMin: event.target.value })} placeholder="Min" aria-label="Minimum price" />
                      <span aria-hidden="true">—</span>
                      <input type="number" inputMode="numeric" min={0} value={filters.priceMax} onChange={(event) => updateFilters({ priceMax: event.target.value })} placeholder="Max" aria-label="Maximum price" />
                    </div>
                  </div>

                  {options.sockets.length > 1 && (
                    <div className={styles.filterGroup}>
                      <h3>Socket</h3>
                      <div className={styles.chipRow}>
                        {options.sockets.map((socket) => <button type="button" key={socket} className={filters.sockets.includes(socket) ? styles.chipActive : ""} onClick={() => updateFilters({ sockets: toggleValue(filters.sockets, socket) })}>{socket}</button>)}
                      </div>
                    </div>
                  )}

                  {options.cores.length > 0 && (
                    <div className={styles.filterGroup}>
                      <h3>Cores</h3>
                      <div className={styles.chipRow}>
                        {options.cores.map((value) => <button type="button" key={value} className={filters.cores.includes(value) ? styles.chipActive : ""} onClick={() => updateFilters({ cores: toggleValue(filters.cores, value) })}>{value}</button>)}
                      </div>
                    </div>
                  )}

                  {options.threads.length > 0 && (
                    <div className={styles.filterGroup}>
                      <h3>Threads</h3>
                      <div className={styles.chipRow}>
                        {options.threads.map((value) => <button type="button" key={value} className={filters.threads.includes(value) ? styles.chipActive : ""} onClick={() => updateFilters({ threads: toggleValue(filters.threads, value) })}>{value}</button>)}
                      </div>
                    </div>
                  )}

                  {options.maxClock > 0 && (
                    <div className={styles.filterGroup}>
                      <h3>Clock speed <small>min boost</small><output>{filters.minClock > 0 ? `${filters.minClock.toFixed(1)} GHz+` : "Any"}</output></h3>
                      <input className={styles.slider} type="range" min={0} max={options.maxClock} step={0.1} value={filters.minClock} onChange={(event) => updateFilters({ minClock: Number(event.target.value) })} aria-label="Minimum clock speed in GHz" />
                    </div>
                  )}

                  {options.maxCache > 0 && (
                    <div className={styles.filterGroup}>
                      <h3>L3 cache <small>min</small><output>{filters.minCache > 0 ? `${filters.minCache} MB+` : "Any"}</output></h3>
                      <input className={styles.slider} type="range" min={0} max={options.maxCache} step={1} value={filters.minCache} onChange={(event) => updateFilters({ minCache: Number(event.target.value) })} aria-label="Minimum L3 cache in MB" />
                    </div>
                  )}

                  <button type="button" className={styles.resetFilters} onClick={() => { setFilters(emptyFilters); setPage(1); }} disabled={activeFilterCount === 0}><FiRotateCw /> Reset filters</button>
                </div>
              )}

              <div className={styles.productList} ref={listRef}>
                {pagedProcessors.map((processor) => (
                  <button key={processor.id} type="button" className={`${styles.productCard} ${selectedId === processor.id ? styles.selectedCard : ""}`} onClick={() => void showProcessorDetails(processor)}>
                    <img src={processor.image} alt={`${processor.name} product`} />
                    <span className={styles.productDetails}>
                      <strong>{processor.name}</strong>
                      <small>{processor.offerCount} verified shop {processor.offerCount === 1 ? "offer" : "offers"}</small>
                      <span className={styles.specLine}>{processor.socket} · {processor.power}</span>
                      {(processor.cores !== null || processor.boostClock !== null) && (
                        <span className={styles.specLine}>
                          {[
                            processor.cores !== null && processor.threads !== null ? `${processor.cores}C/${processor.threads}T` : null,
                            processor.boostClock !== null ? `${processor.boostClock} GHz` : null,
                            processor.cache !== null ? `${processor.cache} MB L3` : null,
                          ].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span className={styles.compatible}><FiCheckCircle /> Compatible</span>
                    </span>
                    <span className={styles.price}>{processor.price === null ? "No price" : `৳ ${money.format(processor.price)}`}</span>
                    <span className={styles.radio} aria-hidden="true" />
                  </button>
                ))}
                {visibleProcessors.length === 0 && <div className={styles.empty}>{processors.length === 0 ? "Start the API to load processor listings." : "No processors match those filters."}</div>}
              </div>

              {visibleProcessors.length > 0 && (
                <nav className={styles.pagination} aria-label="Processor pages">
                  <span className={styles.pageCount}>{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visibleProcessors.length)} of {visibleProcessors.length}</span>
                  <div>
                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><FiChevronLeft /></button>
                    {pageWindow(currentPage, totalPages).map((item, index) => item === "gap"
                      ? <span key={`gap-${index}`} className={styles.pageGap}>…</span>
                      : <button type="button" key={item} className={item === currentPage ? styles.pageActive : ""} onClick={() => goToPage(item)} aria-current={item === currentPage ? "page" : undefined}>{item}</button>)}
                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"><FiChevronRight /></button>
                  </div>
                </nav>
              )}

              <div className={styles.selectionSummary}>
                <div><FiCheckCircle /><span><strong>Compatibility: passed</strong><small>Ready for a matching motherboard</small></span></div>
                <div><FiZap /><span><strong>{selected?.power ?? "Unknown"}</strong><small>CPU power draw</small></span></div>
              </div>
              <button className={styles.installButton} type="button" onClick={installProcessor} disabled={installed || !selected}><FiCpu /> {installed ? "Component installed" : "Install component"}</button>
            </>
          ) : (
            <div className={styles.nextPanel}>
              {(() => { const Icon = steps[activeStep].icon; return <Icon aria-hidden="true" />; })()}
              <p>Step {String(activeStep + 1).padStart(2, "0")}</p>
              <h2>Select {steps[activeStep].name}</h2>
              <span>Your processor choice is locked in. The complete {steps[activeStep].name.toLowerCase()} catalog and visual installation sequence are ready for the next build phase.</span>
              <button type="button" onClick={() => setActiveStep(0)}><FiArrowLeft /> Review processor</button>
            </div>
          )}
        </aside>
      </div>

      {detailsOpen && selected && (
        <div
          className={styles.detailBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
          }}
        >
          <section
            className={styles.detailModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="part-detail-title"
          >
            <header className={styles.detailHeader}>
              <strong>Part details</strong>
              <button type="button" onClick={() => setDetailsOpen(false)} aria-label="Close part details"><FiX /></button>
            </header>

            <div className={styles.detailLayout}>
              <aside className={styles.detailMedia}>
                <div className={styles.detailImageFrame}>
                  <img src={details?.image_url ?? selected.image} alt={`${selected.name} product`} />
                </div>
                <div className={styles.detailThumbs} aria-label="Product media">
                  <button type="button" className={styles.activeThumb}><img src={details?.image_url ?? selected.image} alt="Product front" /></button>
                  <span>Official product media</span>
                </div>
                {details?.specification_source_url && (
                  <a className={styles.officialSource} href={details.specification_source_url} target="_blank" rel="noreferrer">Official specifications <FiArrowRight /></a>
                )}
              </aside>

              <div className={styles.detailContent}>
                <div className={styles.detailBadges}><span>Processor</span><b>{selected.family}</b></div>
                <h2 id="part-detail-title">{selected.name}</h2>

                <div className={styles.detailSpecs}>
                  <div><span>Socket</span><strong>{details?.socket ?? selected.socket}</strong></div>
                  <div><span>Default TDP</span><strong>{details?.tdp_w != null ? `${details.tdp_w} W` : selected.power}</strong></div>
                  <div><span>Memory</span><strong>{details?.ram_types.map((item) => item.toUpperCase()).join(" / ") || "Unknown"}</strong></div>
                </div>

                <div className={styles.bestPriceRow}>
                  <div><span>Best price</span><strong>{bestOffer ? `৳ ${money.format(bestOffer.price)}` : "Unavailable"}</strong><small>{bestOffer ? ` via ${bestOffer.merchant_name}` : "No priced shop offer"}</small></div>
                  <button type="button" onClick={() => setFavorite((value) => !value)} aria-pressed={favorite}><FiHeart /> {favorite ? "Favorited" : "Favorite"}</button>
                  {bestOffer && <a href={bestOffer.product_url} target="_blank" rel="noreferrer">Buy now <FiArrowRight /></a>}
                </div>

                <div className={styles.offerTable}>
                  <div className={styles.offerHead}><span>Merchant</span><span>Availability</span><span>Total</span><span /></div>
                  {modalOffers.map((offer) => (
                    <div className={styles.offerRow} key={offer.id}>
                      <strong>{offer.merchant_name}</strong>
                      <span className={offer.stock === "in_stock" ? styles.inStock : styles.unknownStock}>{offer.stock.replaceAll("_", " ")}</span>
                      <b>৳ {money.format(offer.price)}</b>
                      <a href={offer.product_url} target="_blank" rel="noreferrer">Buy</a>
                    </div>
                  ))}
                  {!detailsLoading && modalOffers.length === 0 && <div className={styles.offerEmpty}>No verified merchant offers yet.</div>}
                  {detailsLoading && <div className={styles.offerEmpty}>Loading current offers…</div>}
                  {detailsError && <div className={styles.offerNotice}>Live details could not refresh; showing the latest catalog snapshot.</div>}
                </div>

                <section className={styles.historyPanel} aria-label="Price history">
                  <div><h3>Price history</h3><span>Recorded shop checks</span></div>
                  {historyPoints.length > 1 ? (
                    <ol>
                      {historyPoints.slice(-8).map((point, index) => (
                        <li key={`${point.merchant}-${point.captured_at}-${index}`}><span>{new Date(point.captured_at).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}</span><strong>৳ {money.format(point.price)}</strong><small>{point.merchant}</small></li>
                      ))}
                    </ol>
                  ) : (
                    <p>Price tracking has started. The chart will grow as automatic shop refreshes record changes.</p>
                  )}
                </section>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className={styles.buildFooter}>
        <div className={styles.buildIdentity}><img src="/auth/pc/build-stage-5-complete.png" alt="White PC build thumbnail" /><span><strong>TechBondhu PC Build</strong><small>{saved ? "Saved build" : "Custom build · Not saved"}</small></span></div>
        <div className={styles.progressDots} aria-label={`${progress} of 8 components installed`}>
          {steps.map((step, index) => <span key={step.name} className={index === 0 && installed ? styles.doneDot : activeStep === index ? styles.currentDot : ""}>{String(index + 1).padStart(2, "0")}</span>)}
        </div>
        <button className={styles.nextButton} type="button" disabled={!installed || activeStep !== 0} onClick={moveNext}>Next: motherboard <FiArrowRight /></button>
      </footer>
    </main>
  );
}
