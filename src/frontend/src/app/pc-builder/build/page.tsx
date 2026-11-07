import type { Metadata } from "next";

import {
  PcBuilderWorkbench,
  type ProcessorCatalogItem,
} from "@/components/pc-builder/pc-builder-workbench";
import { apiRequest } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Build Workbench",
  description: "Select compatible PC components in the TechBondhu build workbench.",
};

export const dynamic = "force-dynamic";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  brand_name: string | null;
  image_url: string | null;
  lowest_price: number | null;
  currency: string;
  offer_count: number;
  socket: string | null;
  tdp_w: number | null;
  core_count: number | null;
  thread_count: number | null;
  base_clock_ghz: number | null;
  boost_clock_ghz: number | null;
  l3_cache_mb: number | null;
  offers: Array<{
    id: string;
    merchant_name: string;
    product_url: string;
    price: number;
    currency: string;
    stock: string;
  }>;
};

type ProductPage = {
  items: ProductSummary[];
  total: number;
  page_size: number;
};

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

async function loadAllProducts(): Promise<ProductSummary[]> {
  const first = await apiRequest<ProductPage>(
    `/products?category=processors&page_size=${PAGE_SIZE}&page=1`,
  );
  const pageCount = Math.min(MAX_PAGES, Math.ceil(first.total / PAGE_SIZE));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      apiRequest<ProductPage>(
        `/products?category=processors&page_size=${PAGE_SIZE}&page=${index + 2}`,
      ),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

async function loadProcessors(): Promise<ProcessorCatalogItem[]> {
  try {
    const products = await loadAllProducts();
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      family: product.brand_name === "Intel" ? "Intel" : "AMD",
      image: product.image_url ?? (
        product.brand_name === "Intel"
          ? "/pc-builder/cpu-blue.webp"
          : "/pc-builder/cpu-orange.webp"
      ),
      price: product.lowest_price,
      currency: product.currency,
      offerCount: product.offer_count,
      offers: product.offers,
      socket: product.socket ?? "Socket unknown",
      power: product.tdp_w === null ? "TDP unknown" : `${product.tdp_w}W`,
      cores: product.core_count,
      threads: product.thread_count,
      baseClock: product.base_clock_ghz,
      boostClock: product.boost_clock_ghz,
      cache: product.l3_cache_mb,
    }));
  } catch {
    return [];
  }
}

export default async function PcBuilderWorkbenchPage() {
  const processors = await loadProcessors();
  return <PcBuilderWorkbench processors={processors} />;
}
