import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle, FiCpu, FiShield, FiZap } from "react-icons/fi";

import styles from "./pc-builder.module.css";

export const metadata: Metadata = {
  title: "PC Builder",
  description: "Plan a compatible custom PC with TechBondhu.",
};

const checks = [
  { icon: FiShield, label: "Compatibility checked" },
  { icon: FiZap, label: "Power estimated" },
  { icon: FiCheckCircle, label: "Prices compared" },
];

export default function PcBuilderIntroPage() {
  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="TechBondhu home">
          TECHBONDHU
        </Link>
        <div className={styles.routeLabel}>
          <span aria-hidden="true">/</span>
          PC BUILDER
        </div>
        <Link className={styles.shopLink} href="/">
          Back to shop
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><FiCpu aria-hidden="true" /> TechBondhu Build Lab</p>
          <h1>BUILD YOUR<br /><span>PERFECT PC.</span></h1>
          <p className={styles.lede}>
            Pick every component with confidence. We keep compatibility, power,
            performance, and local pricing visible while your machine comes together.
          </p>

          <Link className={styles.startButton} href="/pc-builder/build">
            Start building <FiArrowRight aria-hidden="true" />
          </Link>

          <div className={styles.checks} aria-label="Builder benefits">
            {checks.map(({ icon: Icon, label }) => (
              <span key={label}><Icon aria-hidden="true" /> {label}</span>
            ))}
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualFrame}>
            <video
              className={styles.pcVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="Rotating white custom PC preview"
            >
              <source src="/pc-builder/pc.webm" type="video/webm" />
            </video>
            <div className={styles.scanLabel} aria-hidden="true">
              <span>LIVE BUILD VIEW</span>
              <strong>360°</strong>
            </div>
            <span className={styles.cornerA} aria-hidden="true" />
            <span className={styles.cornerB} aria-hidden="true" />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>01 — Select components</span>
        <span>02 — Verify your build</span>
        <span>03 — Compare local prices</span>
      </footer>
    </main>
  );
}
