"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOut, useSession } from "@/lib/auth-client";
import { VideoScroll } from "./video-scroll";

import styles from "./featured-showcase.module.css";

const products = [
  {
    id: "switch",
    name: "Nintendo Switch OLED",
    price: "From ৳38,500",
    image: "/products/nintendo-switch.png",
    alt: "Nintendo Switch OLED with white Joy-Cons and dock",
  },
  {
    id: "ps5",
    name: "PlayStation 5",
    price: "From ৳69,900",
    image: "/products/ps5.png",
    alt: "PlayStation 5 console with DualSense controller",
  },
  {
    id: "pc",
    name: "Custom Gaming PC",
    price: "Build from ৳120,000",
    image: "/products/pc.png",
    alt: "Custom white gaming PC with RGB lighting",
  },
  {
    id: "headphones",
    name: "Gaming Headphones",
    price: "From ৳8,900",
    image: "/products/headphones.png",
    alt: "White and black wireless gaming headphones",
  },
  {
    id: "xbox",
    name: "Xbox Series S",
    price: "From ৳44,500",
    image: "/products/xbox.png",
    alt: "Xbox Series S console with wireless controller",
  },
] as const;

const productGroups = [
  {
    icon: "/menu-icons/components.png",
    title: "PC Components",
    items: ["Processors", "Graphics Cards", "Motherboards", "Memory", "Storage", "Cases & Cooling", "Power Supplies"],
  },
  {
    icon: "/menu-icons/gaming-gear.png",
    title: "Gaming Gear",
    items: ["Keyboards", "Gaming Mice", "Headsets", "Microphones", "Controllers", "Mousepads", "Accessories"],
  },
  {
    icon: "/menu-icons/computers.png",
    title: "Computers",
    items: ["Gaming PCs", "Laptops", "Desktop PCs", "Mini PCs", "Monitors", "All Computers"],
  },
  {
    icon: "/menu-icons/furniture.png",
    title: "Setup & Furniture",
    items: ["Gaming Chairs", "Desks", "Monitor Arms", "Lighting", "Cable Management"],
  },
  {
    icon: "/menu-icons/ps5-controller.png",
    title: "Games",
    items: ["PC Games", "PlayStation Games", "Xbox Games", "Nintendo Games", "Rent Games", "Game Deals"],
  },
  {
    icon: "/menu-icons/shop.png",
    title: "TechBondhu",
    items: ["Compare Products", "Latest Offers", "Nearby Stores", "Buying Guides", "Reviews", "New Arrivals"],
  },
] as const;

// True continuous circular conveyor calculation
function getVirtualSlots(currentPosition: number) {
  const count = products.length;
  // We display 5 visible slots: -2, -1, 0 (active), +1, +2
  // plus buffer slots -3 and +3 so items slide completely off-screen and into view cleanly
  const slots: Array<{
    productIndex: number;
    offset: number;
    isActive: boolean;
    style: React.CSSProperties;
    key: string;
  }> = [];

  for (let offset = -3; offset <= 3; offset++) {
    const virtualIndex = currentPosition + offset;
    const productIndex = ((virtualIndex % count) + count) % count;
    const isActive = offset === 0;
    const isOffscreen = Math.abs(offset) >= 3;

    slots.push({
      productIndex,
      offset,
      isActive,
      key: `slot-${virtualIndex}`,
      style: {
        transform: `translateX(calc(-50% + (var(--card-pitch) * ${offset}))) scale(${isActive ? 1.28 : 0.76})`,
        zIndex: isActive ? 25 : Math.max(1, 15 - Math.abs(offset) * 5),
        opacity: isOffscreen ? 0 : isActive ? 1 : 0.72,
        pointerEvents: isOffscreen ? ("none" as const) : undefined,
      },
    });
  }

  return slots;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 19 8 12 15 5" : "9 5 16 12 9 19";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.7-3.5 3-5.3 6.5-5.3s5.8 1.8 6.5 5.3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="m15 15 4 4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function PcBuildIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="3" width="11" height="18" rx="2" />
      <circle cx="12" cy="9" r="2.4" />
      <circle cx="12" cy="15.5" r="3" />
      <path d="M15 5.7h.01" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

export function FeaturedShowcase() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [currentPosition, setCurrentPosition] = useState(2);
  const [signingOut, setSigningOut] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const move = (direction: -1 | 1) => {
    setCurrentPosition((pos) => pos + direction);
  };

  const activeIndex = ((currentPosition % products.length) + products.length) % products.length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeProduct = products[activeIndex];
  const accountName = session?.user.name?.trim().split(/\s+/)[0] || "Account";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.navbar}>
        <nav className={styles.navPill} aria-label="Primary navigation">
          <Link className={styles.brand} href="/" aria-label="TechBondhu home">
            TECHBONDHU
          </Link>

          <div className={styles.publicNav} aria-label="Explore TechBondhu">
            <div className={styles.productsMenu}>
              <button className={styles.productsTrigger} type="button">
                Products <ChevronIcon />
              </button>
              <div className={styles.megaMenu}>
                <span className={styles.megaAccent} aria-hidden="true" />
                <div className={styles.megaMenuGrid}>
                  {productGroups.map((group) => (
                    <section key={group.title}>
                      <img className={styles.categoryIcon} src={group.icon} alt="" />
                      <h2>{group.title}</h2>
                      <ul>
                        {group.items.map((item) => <li key={item}><button type="button">{item}</button></li>)}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            <button type="button">Compare</button>
            <button className={styles.dealsButton} type="button">
              <span aria-hidden="true" /> Offers
            </button>
            <button className={styles.storesNav} type="button">Stores</button>
            <button className={styles.gamingNav} type="button">Gaming</button>
          </div>

          <div className={styles.navActions}>
            <button className={styles.builderButton} type="button">
              <PcBuildIcon />
              <span>Build a PC</span>
              <span className={styles.builderArrow}><ForwardIcon /></span>
            </button>
            <button className={styles.utilityButton} type="button" aria-label="Search products">
              <SearchIcon />
            </button>
            <button className={styles.locationButton} type="button" aria-label="Choose location">
              <LocationIcon />
              <span>Dhaka</span>
            </button>
            {sessionPending ? (
              <span className={styles.authLoading} aria-label="Checking sign-in status" />
            ) : session?.user ? (
              <div className={styles.accountActions}>
                <span className={styles.accountIdentity} title={session.user.email}>
                  <AccountIcon />
                  <span>{accountName}</span>
                </span>
                <button
                  className={styles.signOutButton}
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            ) : (
              <Link className={styles.signInButton} href="/sign-in">
                <AccountIcon />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section className={styles.hero} id="featured" aria-labelledby="featured-heading">
        <div className={styles.heroHeader}>
          <p className={styles.eyebrow}>Compare · discover · decide</p>
          <h1 id="featured-heading">TECHBONDHU</h1>
          <p className={styles.subheading}>
            Explore standout gear, compare local prices, and choose with confidence.
          </p>

          <form
            className={styles.searchBarContainer}
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem("search") as HTMLInputElement)?.value;
              if (input?.trim()) {
                window.location.href = `/products?q=${encodeURIComponent(input.trim())}`;
              }
            }}
          >
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                className={styles.searchInput}
                type="search"
                name="search"
                placeholder="Search GPUs, processors, laptops, monitors..."
                aria-label="Search tech gear"
                autoComplete="off"
              />
              <button className={styles.searchSubmit} type="submit">
                Search
              </button>
            </div>
          </form>
        </div>

        <div
          className={styles.carousel}
          aria-roledescription="carousel"
          aria-label="Featured technology"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button, a")) return;
            pointerStart.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (pointerStart.current === null) return;
            const distance = event.clientX - pointerStart.current;
            pointerStart.current = null;
            if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
          }}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
        >
          <button
            className={`${styles.arrow} ${styles.arrowPrevious}`}
            type="button"
            aria-label="Previous product"
            onClick={() => move(-1)}
          >
            <ArrowIcon direction="left" />
          </button>

          <button
            className={`${styles.arrow} ${styles.arrowNext}`}
            type="button"
            aria-label="Next product"
            onClick={() => move(1)}
          >
            <ArrowIcon direction="right" />
          </button>

          <div className={styles.reticle} aria-hidden="true">
            <span className={styles.reticleTop}>+</span>
            <span className={styles.reticleBottom}>+</span>
            <span className={styles.reticleLeft}>+</span>
            <span className={styles.reticleRight}>+</span>
          </div>

          <div className={styles.stage}>
            {getVirtualSlots(currentPosition).map((slot) => {
              const product = products[slot.productIndex];

              return (
                <button
                  className={`${styles.productCard} ${slot.isActive ? styles.activeCard : ""}`}
                  data-product={product.id}
                  key={slot.key}
                  style={slot.style}
                  type="button"
                  aria-label={`${slot.isActive ? "Selected" : "View"} ${product.name}`}
                  aria-current={slot.isActive ? "true" : undefined}
                  onClick={() => {
                    if (slot.offset !== 0) {
                      setCurrentPosition((pos) => pos + slot.offset);
                    }
                  }}
                >
                  <span className={styles.productVisual}>
                    <span className={styles.imageWrap}>
                      <img src={product.image} alt={product.alt} draggable="false" />
                    </span>
                    <span className={styles.productShadow} aria-hidden="true" />
                  </span>
                  <span className={styles.productInfo}>
                    <strong>{product.name}</strong>
                    <span>{product.price}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.heroActions} aria-live="polite">
          <span className={styles.currentProduct}>{activeProduct.name}</span>
          <Link className={styles.primaryAction} href={session?.user ? "#featured" : "/sign-in"}>
            {session?.user ? "Save & compare" : "Sign in to save"}
          </Link>
          <a className={styles.secondaryAction} href="#why-techbondhu">
            How it works
          </a>
        </div>
      </section>

      <section className={styles.valueStrip} id="why-techbondhu" aria-label="Why TechBondhu">
        <div><span>01</span><strong>Compare prices</strong><p>See offers from multiple tech stores in one place.</p></div>
        <div><span>02</span><strong>Find nearby</strong><p>Check where products are available before visiting.</p></div>
        <div><span>03</span><strong>Build smarter</strong><p>Plan compatible PC builds with clear guidance.</p></div>
      </section>

      <VideoScroll />

      <section className={styles.techTelemetry} id="specs" aria-label="Tactical specifications">
        <div className={styles.telemetryHeader}>
          <div className={styles.hudBadge}>
            <span className={styles.hudDot} />
            <span className={styles.hudText}>SYS.TELEMETRY // VER 2.40</span>
          </div>
          <h2 className={styles.telemetryTitle}>TACTICAL COMPUTING DEPLOYMENT</h2>
          <p className={styles.telemetrySubtitle}>
            Engineered architecture designed for zero-latency benchmark indexing, real-time localized pricing, and hardware validation across regional vendors.
          </p>
        </div>

        <div className={styles.telemetryGrid}>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryIndex}>[01] NODE_INTEGRITY</span>
            <h3>Real-Time Pricing Matrix</h3>
            <p>Direct API webhooks monitoring regional merchant stock, flash tariffs, and inventory shifts with microsecond cadence.</p>
            <div className={styles.telemetryCode}>HEX: 0x4B92 · LATENCY: 1.2MS</div>
          </div>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryIndex}>[02] THERMAL_OVERHEAD</span>
            <h3>Hardware Compatibility Engine</h3>
            <p>Strict socket, PCIe bifurcation, and PSU rail tolerance checks guarding your rig against bottlenecks and mechanical collisions.</p>
            <div className={styles.telemetryCode}>TDP_MARGIN: +24% · BUS_GEN: 5.0</div>
          </div>
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryIndex}>[03] GRID_COORDINATES</span>
            <h3>Proximity Verified Stores</h3>
            <p>Geospatial store mapping with authenticated inventory confirmation before initiating physical transit.</p>
            <div className={styles.telemetryCode}>SECTOR: DHAKA_CENTRAL · RAD: 12KM</div>
          </div>
        </div>

        <div className={styles.footerBranding}>
          <div className={styles.footerBrand}>TECHBONDHU // ARCHITECTURE MATRIX</div>
          <div className={styles.footerStatus}>SYS.ONLINE · ALL CHANNELS NOMINAL</div>
        </div>
      </section>
    </main>
  );
}
