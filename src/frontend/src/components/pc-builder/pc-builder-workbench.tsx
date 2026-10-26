"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  FiCpu,
  FiGrid,
  FiHardDrive,
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

import styles from "./pc-builder-workbench.module.css";

type Step = {
  name: string;
  helper: string;
  icon: IconType;
};

type Processor = {
  id: string;
  name: string;
  family: "AMD" | "Intel";
  image: string;
  price: number;
  cores: string;
  boost: string;
  socket: string;
  power: string;
  recommended?: boolean;
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

const processors: Processor[] = [
  { id: "r9", name: "AMD Ryzen 9 9950X", family: "AMD", image: "/pc-builder/cpu-orange.webp", price: 53900, cores: "16 cores / 32 threads", boost: "5.7 GHz", socket: "AM5", power: "170W", recommended: true },
  { id: "i7", name: "Intel Core i7-14700K", family: "Intel", image: "/pc-builder/cpu-blue.webp", price: 42500, cores: "20 cores / 28 threads", boost: "5.6 GHz", socket: "LGA1700", power: "125W" },
  { id: "r7", name: "AMD Ryzen 7 7800X3D", family: "AMD", image: "/pc-builder/cpu-red.webp", price: 36900, cores: "8 cores / 16 threads", boost: "5.0 GHz", socket: "AM5", power: "120W" },
];

const money = new Intl.NumberFormat("en-BD");

export function PcBuilderWorkbench() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedId, setSelectedId] = useState("r9");
  const [installed, setInstalled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<"All" | "AMD" | "Intel">("All");
  const [mobileSteps, setMobileSteps] = useState(false);

  const selected = processors.find((processor) => processor.id === selectedId) ?? processors[0];
  const visibleProcessors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return processors.filter((processor) =>
      (family === "All" || processor.family === family) &&
      (!term || processor.name.toLowerCase().includes(term)),
    );
  }, [family, search]);

  const buildTotal = installed ? selected.price : 0;
  const progress = installed ? 1 : 0;

  function chooseStep(index: number) {
    setActiveStep(index);
    setMobileSteps(false);
  }

  function installProcessor() {
    setInstalled(true);
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
                <span className={styles.stepCopy}><strong>{name}</strong><small>{index === 0 && installed ? selected.name : helper}</small></span>
                <FiArrowRight className={styles.stepArrow} aria-hidden="true" />
              </button>
            ))}
          </nav>
          <div className={styles.totalBox}><span>Build total</span><strong>৳ {money.format(buildTotal)}</strong></div>
          <button className={styles.saveButton} type="button" onClick={() => setSaved((value) => !value)}><FiSave /> {saved ? "Build saved" : "Save build"}</button>
        </aside>

        <section className={styles.stage} aria-label="PC assembly preview">
          <div className={styles.diagnostics}>
            <div><FiCpu /><span>CPU socket<small>{installed ? selected.socket : "Not selected"}</small></span></div>
            <div><FiGrid /><span>Motherboard form factor<small>Not selected</small></span></div>
            <div><FiMaximize2 /><span>GPU clearance<small>Checking…</small></span></div>
            <div><FiZap /><span>Power draw<small>{installed ? selected.power : "0W estimated"}</small></span></div>
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
              <label className={styles.searchBox}><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search processors" aria-label="Search processors" /><FiSliders /></label>
              <div className={styles.filters} aria-label="Processor family">
                {(["All", "Intel", "AMD"] as const).map((item) => <button type="button" key={item} className={family === item ? styles.filterActive : ""} onClick={() => setFamily(item)}>{item}</button>)}
                <button type="button">Price <FiChevronDown /></button>
              </div>

              <div className={styles.productList}>
                {visibleProcessors.map((processor) => (
                  <button key={processor.id} type="button" className={`${styles.productCard} ${selectedId === processor.id ? styles.selectedCard : ""}`} onClick={() => { setSelectedId(processor.id); setInstalled(false); }}>
                    {processor.recommended && <span className={styles.recommended}>Recommended</span>}
                    <img src={processor.image} alt="Brand-neutral processor retail package" />
                    <span className={styles.productDetails}>
                      <strong>{processor.name}</strong>
                      <small>{processor.cores}</small>
                      <span className={styles.specLine}>{processor.socket} · {processor.boost} · {processor.power}</span>
                      <span className={styles.compatible}><FiCheckCircle /> Compatible</span>
                    </span>
                    <span className={styles.price}>৳ {money.format(processor.price)}</span>
                    <span className={styles.radio} aria-hidden="true" />
                  </button>
                ))}
                {visibleProcessors.length === 0 && <div className={styles.empty}>No processors match that search.</div>}
              </div>

              <div className={styles.selectionSummary}>
                <div><FiCheckCircle /><span><strong>Compatibility: passed</strong><small>Ready for a matching motherboard</small></span></div>
                <div><FiZap /><span><strong>{selected.power}</strong><small>CPU power draw</small></span></div>
              </div>
              <button className={styles.installButton} type="button" onClick={installProcessor} disabled={installed}><FiCpu /> {installed ? "Component installed" : "Install component"}</button>
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
