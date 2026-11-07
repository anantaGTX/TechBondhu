# PC Builder: build plan

Status: draft, written 2026-11-07 on `feature/pc-builder`.
Read this with `architecture.md` and `authentication.md`.

## 1. Goal

A PC builder where the user picks parts step by step, sees
compatibility problems immediately, and sees the best Bangladeshi
shop price for each part. TechBondhu does not sell parts. Every
purchase finishes on the shop's own website.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Business model | Aggregator. Links out to shops. No checkout. |
| Specs source | Manufacturer pages, entered by hand first. Not shops. |
| Price source | Shop product pages, fetched without asking permission (owner decision, 2026-11-07). A feed is used if a shop offers one. |
| Reviews | Collected from the internet, shown with source name and link (section 16). TechBondhu users can also write reviews. |
| Cart | "Build cart" on our site, grouped by shop, links out. |
| Compatibility rules | FastAPI `domain/`, never in React. |
| Spec storage | Typed table per component, not one JSONB column. |
| Prices on builds | Never stored. Computed from live listings. |

## 3. What the research found

- PCPartPicker: compatibility checker, many retailers, list UI.
- BuildCores: 3D preview, price comparison on part pages, running
  total on the build page. I could not confirm a combined cart.
- pcbuilder.net: each pick filters later steps, shareable build
  links, no account needed. Does not check GPU length, cooler
  height, or PSU connectors.
- Star Tech, Ryans, TechLand, Skyland: robots.txt allows general
  crawling and blocks cart, search, sort and filter URLs. TechLand
  blocks every URL containing `?`, so pagination must come from
  `sitemap.xml`.
- Full robots.txt and terms were checked for 21 shops. See
  section 15. Ryans, PQS and UCC ban bots in their terms.
- No competitor found targets Bangladeshi shops or taka prices.
  That is the main point of difference.

## 4. Corrections to earlier notes

- Auth is Better Auth, not Supabase Auth (`authentication.md`).
  Ignore the earlier idea of Supabase anonymous sign-ins.
- `builds.owner_id` stores the Better Auth user id as text. There
  is no foreign key, because Better Auth tables live in the
  separate `better_auth` schema.
- Persisted builds always have an owner. `builds.owner_id` is not
  nullable. Anonymous drafts exist only in browser localStorage;
  signing in creates a new owned build from the draft.
- Supabase RLS cannot use `auth.uid()` for these users. FastAPI
  verifies the JWT and enforces ownership in code.
- Anonymous drafts live in browser localStorage and are saved to
  the account after sign-in.
- "Add to cart" means our own build cart. It does not fill any
  shop's checkout.

## 5. V1 product and source decisions

Decided 2026-11-07:

1. **First price source:** Star Tech is the pilot connector.
2. **Feed or fetching:** prefer an official feed or API whenever one
   exists. No public Star Tech feed or API was found in the check on
   2026-11-07. Its current `robots.txt` points to a public
   [`sitemap.xml`](https://www.startech.com.bd/sitemap.xml), so the
   pilot discovers product URLs from that sitemap and fetches only
   permitted product pages. Recheck for a feed before implementation.
3. **Preview:** layered 2D images for v1. Do not add Three.js until
   enough reusable 3D models exist to cover the supported catalog.
4. **Specification sources:** Intel and AMD are not approved for
   commercial copying or automated collection. Intel's current
   [Terms of Use](https://www.intel.com/content/www/us/en/legal/terms-of-use.html)
   limit documents to personal, informational, non-commercial use and
   prohibit scraping, data mining and systematic collection without
   written permission. AMD's current
   [Terms of Use / Copyright](https://www.amd.com/en/legal/copyright.html)
   prohibit copying site materials for commercial or public purposes
   without prior written permission. Do not bulk copy or automate from
   either source unless written permission is obtained. This is a
   conservative product decision, not legal advice.
5. **Real seed-data gate:** schema, rules and UI development may use
   clearly fake fixtures. Real product specs are not added until each
   source has compatible terms or written permission. Check other
   manufacturers separately; approval for one does not cover another.
6. **Currency and delivery:** v1 uses BDT and shows product price only.
   Every item and total is labelled "excluding delivery".

## 6. Build order

### Phase 0: preparation (no feature code)

- [ ] Read `node_modules/next/dist/docs/`. `src/frontend/AGENTS.md`
      says this Next.js version has breaking changes.
- [x] Check the first shop's public feed/API discovery, sitemap and
      robots policy. Star Tech has a public sitemap; no public feed or
      API was found on 2026-11-07.
- [x] Answer the v1 product decisions in section 5.
- [ ] Find and approve a specification source for each category by
      checking its current terms or obtaining written permission.
- [x] Collect an initial official-page pilot of 10 to 15 CPUs and
      motherboards per category, each with its source URL. The local
      development manifest currently has 12 CPUs and 11 motherboards.
      Production reuse still depends on the source-approval item above.

The source-approval and real-data tasks do not block Phases 1 through
5 when those phases use clearly fake fixtures. They block real seed
data and production launch.

### Phase 1: database migration

New file: `supabase/migrations/<timestamp>_pc_builder.sql`.

- [x] Enums: `ram_type` (ddr4, ddr5),
      `motherboard_form_factor` (atx, micro_atx, mini_itx, e_atx),
      `psu_form_factor` (atx, sfx, sfx_l), `storage_kind`, and
      `cooler_kind`. Motherboards and PSUs use separate enums
      because their form-factor names and fit rules are different.
- [x] `cpu_sockets` reference table (AM4, AM5, LGA1700, LGA1851).
- [x] `cpu_specs`, `motherboard_specs`, `ram_specs`, `gpu_specs`,
      `storage_specs`, `psu_specs`, `case_specs`, `cooler_specs`.
      Each uses `product_id` as primary key and foreign key.
- [x] `cooler_supported_sockets` junction table.
- [x] Put the unit in every column name (`_mm`, `_w`, `_mhz`).
      Leave unknown specs nullable.
- [x] Add `source_url` and `checked_at` to every spec table
      (see section 13).

Key columns per spec table:

| Table | Columns used by compatibility rules |
|---|---|
| `cpu_specs` | `socket_id`, `tdp_w`, `max_power_w`, `ram_types` |
| `motherboard_specs` | `socket_id`, `chipset`, `form_factor motherboard_form_factor`, `ram_type`, `ram_slots`, `m2_slots`, `cpu_power_8pin_count` |
| `ram_specs` | `ram_type`, `capacity_gb`, `module_count`, `height_mm` |
| `gpu_specs` | `length_mm`, `slot_width`, `tdp_w`, `power_8pin_count`, `uses_12vhpwr` |
| `storage_specs` | `kind`, `form`, `capacity_gb` |
| `psu_specs` | `wattage_w`, `form_factor psu_form_factor`, `pcie_8pin_count`, `has_12vhpwr`, `cpu_8pin_count` |
| `case_specs` | `board_form_factors motherboard_form_factor[]`, `max_gpu_length_mm`, `max_cooler_height_mm`, `radiator_sizes_mm[]`, `width_mm`, `height_mm`, `depth_mm` |
| `cooler_specs` | `kind`, `height_mm`, `radiator_mm`, `tdp_rating_w` |

Build tables, same migration:

```text
builds
  id uuid pk, owner_id text not null, name, goal, budget_bdt,
  share_slug text unique, is_public bool, created_at, updated_at

build_items
  build_id -> builds (on delete cascade)
  product_id -> products
  quantity smallint default 1
  chosen_listing_id -> merchant_listings (nullable)
  unique (build_id, product_id)
```

`chosen_listing_id` must refer to a listing for the same
`product_id`. Enforce this in PostgreSQL, not only in FastAPI:

```text
merchant_listings
  unique (id, product_id)

build_items
  foreign key (chosen_listing_id, product_id)
    -> merchant_listings (id, product_id)
```

PostgreSQL permits the nullable `chosen_listing_id`; the composite
foreign key is checked whenever a listing is selected.

- [x] No price column on either table.
- [x] Reuse `public.set_updated_at()` triggers.
- [x] RLS: spec tables are public read. `builds` and `build_items`
      get no public policy. FastAPI uses the service role and
      checks ownership. Shared builds are read by `share_slug`.
- [x] Reset a local database and confirm the migrations and `seed.sql` run.

The migration and existing `seed.sql` were also validated on
2026-11-07 in an isolated PostgreSQL 18 database and then applied to
the local Supabase stack.

### Phase 2: seed data

- [x] Add deterministic canonical brand, product, socket, and spec import.
      `scripts/import_canonical_products.py` reads the reviewed JSON manifest
      separately from the lightweight local fixture seed.
- [x] Validate category/spec shape and require an official manufacturer
      source domain before a canonical row can be imported.
- [x] Do not add fake public listings. The staged Bangladesh shop observations
      remain private until a canonical match is reviewed.

### Phase 3: compatibility rules (backend `domain/`)

Each rule is a pure function. It returns `pass`, `warn`, `fail`,
or `unknown`, plus a plain-language reason and a suggested fix.
Missing data returns `unknown`. It never returns `pass`.

| Rule | Compares |
|---|---|
| Socket | CPU socket and board socket |
| RAM type | RAM type and board RAM type |
| RAM slots | RAM module count and board slots |
| Board fit | Board form factor and case supported list |
| GPU length | GPU length and case maximum |
| Cooler height | Cooler height and case maximum |
| Radiator | AIO radiator size and case supported list |
| Cooler socket | Cooler supported sockets and CPU socket |
| PSU wattage | Estimated draw and PSU wattage |
| PSU connectors | GPU and board needs and PSU connectors |
| M.2 slots | Storage M.2 count and board slots |

- [ ] One test file per rule with pass, fail, and missing-data cases.
- [ ] Power estimate: CPU + GPU power + 100 W headroom. Show the
      formula in the UI.
- [ ] Later: `chipset_cpu_support` table for boards that need a
      BIOS update for newer CPUs.

### Phase 4: API (routers, services, repositories)

All paths start with `/api/v1`. List endpoints are paginated.

- [ ] `GET /parts?category=&socket=&...`: filtered parts. When a
      build is supplied, mark incompatible parts and give the
      reason instead of hiding them silently.
- [ ] `GET /parts/{id}`: one part with specs and listings.
- [ ] `POST /builds/check`: build in, rule results and power
      estimate out.
- [ ] `POST /builds`, `GET /builds/{id}`, `PATCH`, `DELETE`:
      authenticated with the Better Auth JWT, as in `/auth/me`.
- [ ] `GET /shared-builds/{share_slug}`: public read.
- [ ] `GET /builds/{id}/cart`: items grouped by shop with subtotals.
- [ ] `GET /listings/{id}/go`: records the click and redirects to
      the stored shop URL. Redirect only to URLs from
      `merchant_listings`, never to a URL from the request.

### Phase 5: frontend (`src/frontend`)

Current state: only the CPU step works, the list is a hard-coded
array, compatibility text is static, and the preview is a fixed
video. See `components/pc-builder/pc-builder-workbench.tsx`.

- [ ] Typed API client for the Phase 4 endpoints.
- [ ] Build the step list from `categories`, with a map from slug
      to display label ("memory" shows as "RAM").
- [ ] One generic part-list component for all 8 steps, with
      search, brand filter, price sort, and spec badges.
- [ ] A BuildCores-inspired part-details drawer: manufacturer-sourced
      product image, key compatibility specs, best current BDT price,
      and every matched Bangladeshi shop listing. The listing table
      shows shop, stock, last checked time, price, and a "Buy" link.
- [ ] The right rail has two modes: "Choose parts" for the active
      category and "My build" for all eight categories. Each installed
      row shows category, thumbnail, product name, chosen shop, chosen
      price, switch-shop action, and remove action. Empty rows show
      "Add" and return to that category.
- [ ] On mobile, the part-details drawer and build rail become bottom
      sheets or full-screen panels; do not squeeze the desktop table
      into a narrow column.
- [ ] Incompatible parts stay visible, greyed out, with the reason
      available on hover and focus.
- [ ] Diagnostics strip driven by `POST /builds/check`. Remove the
      static "Checking..." text.
- [ ] One reducer for build state, saved to localStorage.
- [ ] Footer count and progress come from installed parts.
- [ ] Split the 224-line workbench into smaller components.
- [ ] Check mobile layout, keyboard use, and `prefers-reduced-motion`
      for the preview video.

### Phase 6: prices from shops

Connector contract: each shop returns title, price, stock, URL,
and any manufacturer model number it shows.

`merchants` remains the canonical shop table. Do not create a
second `shops` table. Add a one-to-one operational table in the
Phase 6 migration:

```text
merchant_source_policies
  merchant_id uuid pk -> merchants
  terms_url text null
  terms_checked_at timestamptz null
  robots_checked_at timestamptz null
  terms_status text
  permission_status text
  connector_status text
  feed_url text null
  minimum_request_interval_seconds int default 20
  notes text null
  updated_at timestamptz
```

Constrain `terms_status` to `unchecked`, `no_restriction_found`,
`restricted`, or `prohibits_automation`. Constrain
`permission_status` to `not_requested`, `requested`, `approved`,
or `denied`. Constrain `connector_status` to `planned`, `active`,
`paused`, or `disabled`. Keeping these separate records the source's
terms honestly even when the owner's connector decision differs.
Connector URL-discovery patterns remain in connector code because
they are implementation details, not merchant identity data.

- [ ] Find product URLs through `sitemap.xml` first. When a sitemap is
      missing or incomplete, traverse only canonical component-category
      pagination permitted by the current robots policy. Never crawl
      search, sort, faceted-filter, cart, account, or checkout URLs.
- [ ] Honest user agent, rate limit, backoff on errors.
- [ ] Re-read robots.txt on every run.
- [ ] Match by manufacturer model number first, normalized model/title second,
      and fuzzy title last. Exact and normalized model/title proposals exist;
      fuzzy matching is not implemented yet.
- [x] Private staging tables `merchant_listing_candidates` and
      `product_match_candidates` store raw observations and proposed
      canonical matches. Match status is `auto`, `needs_review`,
      `approved`, or `rejected`. See
      `202611070002_listing_match_pipeline.sql`.
- [x] Research-derived matches wait in the `needs_review` queue. The
      CSV importer never auto-approves or promotes them.
- [x] `scripts/import_listing_candidates.py` validates and deduplicates
      the market-census CSV in dry-run mode by default, and can stage it
      in batches with an explicit `--apply` flag.
- [x] Initial canonical import produced 23 official-source products and
      195 private `needs_review` listing-match proposals locally.
- [x] Automatically promote priced, deterministic normalized-model matches at
      95% confidence or higher. Manual review is only a fallback for ambiguous
      rows. Promotion is one atomic database operation that creates the public
      listing, rejects competing proposals, and records the system/reviewer.
- [x] Public product APIs return canonical products, lowest prices, and sorted
      merchant offers. The PC Builder reads these at request time instead of
      using hardcoded CPU cards or scraping shops from the browser.
- [x] Write `price_history` only when a new or changed price is promoted.
- [ ] Deactivate a listing after repeated failed checks.
- [ ] Parser tests use saved sample HTML, so they run offline.
- [ ] Run as background workers, never inside a user request.

### Phase 7: build cart, sharing, preview

- [ ] Build cart page: items grouped by shop, subtotal per shop,
      combined total, "Go to <shop>" button per group.
- [ ] Per-part shop switch (sets `chosen_listing_id`).
- [ ] Clicking a part's shop or price in the right-side build list
      opens its merchant comparison and lets the user switch listings
      without replacing the canonical part.
- [ ] Optional: "cheapest single shop that has every part".
- [ ] Copyable parts list for WhatsApp and Facebook.
- [ ] Share link from `share_slug`, readable without an account.
- [ ] Preview: layered 2D images per installed part first. Move to
      Three.js only if models exist for enough parts.
- [ ] Replace the hard-coded "450 mm / 465 mm" labels with
      `case_specs` dimensions.
- [ ] Reviews: internet sources (section 16) plus reviews written
      by TechBondhu users.

## 7. Build cart behaviour

- Follow BuildCores' useful interaction pattern, not its branding or
  assets: one canonical part with a product image and specifications,
  plus multiple merchant offers. The live BuildCores page checked on
  2026-11-07 confirms that price comparison and compact selected-part
  summaries are central to its builder.
- Product images come from an approved manufacturer or press source,
  never from a shop connector. A shop connector provides only title,
  price, stock, product URL, model number when present, and check time.
- The part-details price table lists Star Tech, Ryans, TechLand,
  Skyland and other matched Bangladeshi shops independently. Do not
  merge their prices into one unsourced value.
- Default shop per part: cheapest active, in-stock listing.
- The right-side "My build" list displays that chosen listing. The user
  can open the comparison and select another shop; this updates
  `chosen_listing_id`, not `product_id`.
- Every line shows "price checked <time> ago". Listings not
  checked for several days are hidden or marked stale.
- Prices exclude delivery. Say so next to every total.
- Links use `rel="noopener noreferrer"` and go through
  `/listings/{id}/go`.
- A shop's cart cannot be filled from our site unless that shop
  offers an add-to-cart link or API.

## 8. Risks and limits

- Ryans, PQS and UCC terms ban bots (section 15). Fetching them is
  an accepted risk. Other shops may still object. Disable a
  connector at once if a shop asks.
- Wrong specs give wrong "compatible" results. Missing is safer
  than wrong, so use `unknown`.
- Hand-entered specs do not scale. Automate only from sources
  whose terms allow it.
- Product matching across shops is the hardest ingestion problem.
- Stale prices break trust. Show freshness everywhere.
- The terms check was a keyword search. Five shops had no usable
  terms page, so they are unchecked.

## 9. Definition of done

- A user can pick all 8 parts and see correct pass, warn, fail, or
  unknown results from the backend.
- Incompatible parts are greyed out with a reason.
- Each part shows at least one real shop price with a check time.
- A part-details view compares all matched Bangladeshi shop offers,
  and the right-side build list shows the selected shop and price for
  every installed component.
- The build cart groups parts by shop and links to the right pages.
- A build can be saved, shared by link, and reopened.
- Rule tests, parser tests, and the frontend lint and test
  scripts pass.

## 10. Shop registry (price sources)

Checked on 2026-11-07: each homepage returned HTTP 200 and linked
to component categories. This is a starting list, not a complete
list of every shop in Bangladesh. Nothing here confirms stock,
price quality, or that scraping is allowed.

A two-pass market census on 2026-11-07 captured 4,258 unique direct
CPU and motherboard listing URLs across 24 Bangladeshi retailers:
1,157 CPUs and 3,101 motherboards. Only six retailers reached complete
exposed-pagination coverage, so the result is broad but not claimed as
fully exhaustive. See the
[coverage report](research/bd-cpu-motherboard-listing-census-2026-11-07.md)
and [row-level CSV](research/bd-cpu-motherboard-listings-2026-11-07.csv).
All rows are unreviewed connector candidates, not production seed data.

| Shop | Website | Processor page found |
|---|---|---|
| Star Tech | startech.com.bd | /component/processor |
| Ryans | ryans.com (ryanscomputers.com redirects here) | /category/desktop-component-processor |
| TechLand | techlandbd.com | /pc-components/processor |
| Skyland | skyland.com.bd | /component/processor |
| Ultra Technology | ultratech.com.bd | /processor |
| Potaka IT | potakait.com | /processors |
| PCB Store | pcbstore.com.bd | /pc-components/processor |
| Creatus | creatus.com.bd | /processor |
| Techno House | technohouse.com.bd | /category/processor |
| PQS | pqs.com.bd | /processor |
| Tech Shoppers BD | techshoppersbd.com | /pc-components/processors/ |
| Samanta Computer | samantacomputer.com | /category/processor |
| ZoomTech | zoomtechbd.com | /category/processor |
| Star Computer | starcomputer.com.bd | /Product-category/components/processor/ |
| Binary Logic | binarylogic.com.bd | `processor` (relative link) |
| Computer Source | computersource.com.bd | /processor |
| SmartBD | smartbd.com | /product-category/computer-components/processor/ |
| Global Brand | globalbrand.com.bd | /components/processor |
| TrustTech | trusttechbd.com | CPU cooler page found; processor page not seen |
| UCC | ucc.com.bd | /processors (describes itself as a national distributor) |
| Zeon Tech | zeontechbd.com | Only a blog link found; category not confirmed |

Shop notes:

- Dolphin, Computer Village and Flora appear in a "top 10" article
  but I found no website for them. Vibe Gaming returned HTTP 403.
  None are in the table.
- Star Tech and Star Computer are different companies.
- UCC is a distributor. Check whether it shows public prices.
- Full robots.txt and terms results are in section 15. Ryans, PQS
  and UCC ban bots in their terms.
- Register each shop in the existing `merchants` table. Keep URL
  discovery patterns in connector code. Store terms and robots.txt
  check dates in `merchant_source_policies`.

## 11. Manufacturers per category (brands to support)

This list comes from general market knowledge, not from fetched
pages. Confirm each brand against what the shops actually stock
and add or remove brands from there. Seed them into `brands`.

| Category | Manufacturers |
|---|---|
| Processors | Intel, AMD |
| Motherboards | ASUS, MSI, Gigabyte, ASRock, Biostar |
| Graphics cards (chips) | NVIDIA, AMD, Intel |
| Graphics cards (boards) | ASUS, MSI, Gigabyte, Zotac, Palit, Gainward, PNY, Sapphire, PowerColor, XFX, ASRock, Inno3D, Colorful |
| Memory | Corsair, G.Skill, Kingston (HyperX), Crucial, TeamGroup, ADATA (XPG), Patriot, Lexar, Transcend |
| Storage | Samsung, WD, Seagate, Kingston, Crucial, ADATA, Lexar, TeamGroup, Transcend, Gigabyte |
| Power supplies | Corsair, Cooler Master, Seasonic, MSI, Gigabyte, Thermaltake, Deepcool, be quiet!, FSP, Antec, NZXT, Gamdias |
| Cases | Corsair, NZXT, Lian Li, Cooler Master, Thermaltake, Deepcool, Fractal Design, Phanteks, Antec, Gamdias, Montech |
| CPU coolers | Noctua, Deepcool, Cooler Master, Arctic, Thermalright, Corsair, NZXT, be quiet!, ID-Cooling, Thermaltake |

Rules for the brand list:

- A brand is added when at least one shop sells a product from it.
- `brands.slug` is lowercase and stable. Never rename a slug.
- The manufacturer part number is the join key between shop
  listings and specs, so every product needs `model_number`.
- Several GPU makers use the same NVIDIA or AMD chip. Store the
  chip (for example "RTX 5070") in a field so builds can compare
  boards that share a chip.

## 12. Spec sources (specs come from the internet, not shops)

Candidate sources per category. Except for Intel and AMD, their terms
of use are not checked. Check each source before copying data from it,
and record the URL on every spec row so a wrong value can be traced and
fixed.

| Category | Candidate sources |
|---|---|
| Processors | Intel ARK and AMD product pages are candidates but are not approved; their current terms require permission for this commercial reuse. Find a permitted source or obtain written permission. |
| Motherboards | ASUS, MSI, Gigabyte, ASRock product pages |
| Graphics cards | Board maker pages, plus NVIDIA and AMD pages for chip data |
| Memory | Corsair, G.Skill, Kingston, TeamGroup product pages |
| Storage | Samsung, WD, Seagate, Crucial product pages |
| Power supplies | Corsair, Seasonic, Cooler Master product pages |
| Cases | Case maker pages (clearance limits are the key fields) |
| CPU coolers | Cooler maker pages (height and supported sockets) |

Third-party spec databases may help for cross-checking. Use them
only if their terms allow it.

## 13. Spec collection workflow

1. Take a product from a shop listing, or pick a model from a
   manufacturer's lineup.
2. Find its page on an approved manufacturer or primary source site.
   The manufacturer part number identifies the product. Do not use a
   candidate source until its terms have been checked.
3. Enter the fields from section 6 (Phase 1) into the spec table.
   Unknown values stay null.
4. Store `source_url` and `checked_at` with the row.
5. When two approved sources disagree, prefer the approved primary
   manufacturer value and flag the row for review.
6. A product with no spec row can be listed and priced, but the
   builder shows "compatibility unknown" for it.

Decision: every spec table includes `source_url` and `checked_at` in
the Phase 1 migration.

## 14. What the shops provide

Only these fields are read from a shop:

- title, price, stock status, product URL, manufacturer model
  number if shown, and the time of the check.

Nothing else is read from a shop: no spec tables, no descriptions,
no images. Reviews come from separate sources (section 16).

## 15. Robots and terms check (2026-11-07)

Method: downloaded each shop's full `robots.txt`, found its terms
page from the homepage footer, removed the HTML, and searched the
text for scrape, crawl, automated, data mining, republish and
similar words. A keyword search can miss wording, and some pages
were short or may load their text with JavaScript. A missing ban is
not permission. This is not legal advice.

### Terms that ban bots or data collection

| Shop | What the terms say |
|---|---|
| Ryans | No systematic retrieval of data into a compiled database without written permission. No robots, scrapers or data-gathering tools. |
| PQS | Same wording as Ryans. |
| UCC | No access through bots or scripts. No compiling a database without written permission. |

Decision (owner, 2026-11-07): fetch prices from these three too,
without asking. This goes against their terms. Risks: IP block,
a takedown or legal letter, loss of the connector. Build these
connectors last, and disable them the same day if a shop asks.

### Terms that restrict reuse of content

| Shop | What the terms say |
|---|---|
| PCB Store | No copying or republishing content for commercial use. No re-uploading product images. |
| TechShoppersBD | Text, logos and images are copyrighted and need consent. |

Prices only (no text or images) may be less affected.

### No scraping clause found

Star Computer, SmartBD, TrustTech, Binary Logic, TechLand, Ultra
Technology, Potaka IT, Creatus, ZoomTech, Computer Source, Global
Brand. Several of these pages are short (600 to 1,500 words).

### Could not check

| Shop | Why |
|---|---|
| Star Tech | No terms page found. Only privacy, refund, delivery and about pages exist (about 1,100 to 1,300 words each, no scraping wording). |
| Skyland | Terms page text was too short to trust (283 words). |
| Techno House | Terms page had 9 words. |
| Samanta Computer | Only payment and warranty pages found. |
| Zeon Tech | No terms page found. |

### Robots.txt results

- No shop blocks the general `*` user agent from the whole site.
- TrustTech, Global Brand and Zeon Tech block 31 named bots
  (AI and SEO crawlers such as GPTBot and ClaudeBot) and send
  `Content-Signal: ai-train=no`. A price bot with its own name is
  not in those lists. The signal still shows they dislike data
  reuse for AI training, so do not use their data for that.
- Crawl-Delay is set to 20 seconds at Ultra Technology and
  TrustTech. Honor it everywhere, or use a longer gap.
- TechLand and Global Brand block any URL with `?`, which includes
  `?page=`. Star Tech blocks `?product_id=`, `?category_id=` and
  similar. Skyland blocks `?cat`, `?product_id` and `?page=1`.
  Use `sitemap.xml` for product URLs at these shops.
- Ryans blocks payment, print and admin paths.

### Policy for the connectors

1. Owner decision: connectors go live without asking shops for
   permission. If a shop offers a feed, use the feed instead.
2. Ryans, PQS and UCC terms ban bots. Fetching them goes against
   their terms and the owner accepted that risk.
3. If a shop sends a takedown request or blocks us, disable its
   connector the same day. Do not work around a block (no proxy
   rotation, no fake user agents).
4. Re-read `robots.txt` on each run and stop if it now blocks us.
5. Wait at least 20 seconds between requests to a shop.
6. Keep one `merchant_source_policies` record per merchant: terms
   URL, terms and robots check dates, terms, permission and connector
   statuses, request interval, and the feed URL if one exists.
7. Pilot with shops that have no ban and a crawlable sitemap:
   Star Tech, SmartBD, Computer Source or Binary Logic. Prove the
   pipeline there before building the shops that ban bots.

Files from this check were saved outside the repository.

## 16. Reviews and other internet content

Owner decision (2026-11-07): reviews and the remaining content come
from the internet. The sources below are not yet chosen or checked.

### Reviews: what to store

New table `product_reviews`, one row per review source per product:

```text
id, product_id -> products, source_name, source_url,
rating numeric, rating_scale smallint, review_count int,
excerpt text null (short, 300 characters at most),
fetched_at timestamptz
unique (product_id, source_url)
```

- Store the rating, the count and a link, not full review text.
  Full text of other people's reviews is the part most likely to
  cause a copyright complaint, and the link sends them traffic.
- Always show the source name, a link, and the fetch date next to
  a rating. Never show a rating without its source.
- Never invent, rewrite or merge reviews into a made-up score.
  If the sources disagree, show each one.
- Hide a source's rating when it has too few reviews to mean
  anything (set a minimum count, for example 5).
- Reviews written on TechBondhu go in a separate table and are
  labelled as TechBondhu reviews.

### Where reviews can come from (candidates, unchecked)

- Professional review sites for CPUs, GPUs and other parts.
- Retailer rating pages (shop ratings are per shop, not per part
  model, so label them by shop).
- Community discussions, linked rather than copied.

Pick sources by whether they cover the parts Bangladeshi shops
actually sell. Check each source's robots.txt before fetching.

### Other content ("the rest")

| Content | Source | Rule |
|---|---|---|
| Specs | Manufacturer pages (section 12) | Store `source_url` |
| Product images | Manufacturer press images | Do not use shop images |
| Descriptions | Write our own short text | Do not copy shop text |
| Benchmarks | Linked, not copied | Show source and date |

Open question: what else does "the rest" cover? Tell me and I will
add it here.

### Fetching rules (same for all internet sources)

- Honest user agent that names TechBondhu and a contact address.
- Obey robots.txt and any Crawl-Delay. Wait at least 20 seconds
  between requests to one site when no delay is given.
- Stop and disable the source if it blocks us or asks us to stop.



