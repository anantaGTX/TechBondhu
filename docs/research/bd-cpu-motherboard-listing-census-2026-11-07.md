# Bangladesh CPU and motherboard listing census

Captured: 2026-11-07 (latest source pass: 2026-11-07T09:55:44.858Z)

## Result

Two research passes found **4,258 unique direct product URLs** across 24 Bangladeshi retailers:

- 1,157 CPU listings
- 3,101 motherboard listings
- 1,933 rows (45.4%) with a displayed numeric BDT price
- 4,184 rows (98.3%) with a model-number candidate
- 206 explicitly in stock, 1,543 explicitly out of stock, and 2,509 with unknown stock after treating generic "Buy Now" or "Add to Cart" text as unknown

The full row-level export is [bd-cpu-motherboard-listings-2026-11-07.csv](./bd-cpu-motherboard-listings-2026-11-07.csv). Every row is marked `unreviewed`. This is a connector-research input, not a production seed file.

## Scope and rules

- Included standalone consumer desktop CPUs and desktop motherboards sold by Bangladeshi technology retailers.
- Excluded laptops, complete PCs, CPU coolers, accessories, and identifiable server/workstation-only products.
- Kept one row per retailer product URL. The same model at multiple shops remains multiple merchant listings.
- Merged the two passes by direct product URL. The newer row wins; 83 still-valid first-pass URLs omitted by the second agent response were retained.
- Preserved a null price when no numeric selling price was displayed.
- Preserved raw stock wording and used `unknown` when availability was not explicit.
- Model numbers extracted from titles are candidates and require review before canonical product matching.
- "Complete" means all exposed category pagination was traversed during this research. It does not prove that an unlinked product is absent from the retailer's database.

## Coverage

Only **6 of 24 retailers** reached complete exposed-pagination coverage: Star Tech, Ryans, PQS, Speed Tech, City Computer & Technology, Universal Computer BD. The remaining 18 are intentionally marked partial.

| Retailer | Coverage | CPUs | Motherboards | Notes | Evidence |
|---|---:|---:|---:|---|---|
| Star Tech | complete | 139 | 522 | All 7 processor and 27 motherboard pages enumerated; qualifying rows match the prior displayed totals. | [CPU/category](https://www.startech.com.bd/component/processor), [Motherboard/category](https://www.startech.com.bd/component/motherboard) |
| Ryans | complete | 283 | 1169 | All 16 processor and 60 motherboard pages enumerated; qualifying rows preserved from the prior exhaustive traversal. | [CPU/category](https://www.ryans.com/category/desktop-component-processor), [Motherboard/category](https://www.ryans.com/category/desktop-component-motherboard) |
| TechLand | partial | 8 | 8 | Partial: category pages and exposed product cards were checked, but no complete sitemap/page enumeration was established. | [CPU/category](https://www.techlandbd.com/pc-components/processor), [Motherboard/category](https://www.techlandbd.com/pc-components/motherboard) |
| Skyland | partial | 8 | 8 | Partial: processor pages 1–6 and motherboard pages through page 9 were fetched, but the motherboard pager exposed a later terminal/page-25 link. | [CPU/category](https://www.skyland.com.bd/component/processor), [Motherboard/category](https://www.skyland.com.bd/component/motherboard) |
| Ultra Technology | partial | 134 | 416 | Partial: processor and AMD/Intel motherboard pagination was sampled through page 9; full category/product sitemap enumeration was not established. | [CPU/category](https://www.ultratech.com.bd/processor), [Motherboard/category](https://www.ultratech.com.bd/amd-motherboard), [Evidence 3](https://www.ultratech.com.bd/intel-motherboard) |
| Potaka IT | partial | 10 | 11 | Partial: processor pages 1–7 and motherboard pages 1–9 fetched; category pagination indicated additional catalog depth. | [CPU/category](https://potakait.com/processors), [Motherboard/category](https://potakait.com/motherboards) |
| PCB Store | partial | 10 | 10 | Partial: category totals/pagination were observed but all product pages were not enumerated. | [CPU/category](https://pcbstore.com.bd/pc-components/processor), [Motherboard/category](https://pcbstore.com.bd/pc-components/motherboard) |
| Creatus | partial | 11 | 10 | Partial: processor and motherboard pagination exposed additional pages (including a page-51 link); not all were traversed. | [CPU/category](https://www.creatus.com.bd/processor), [Motherboard/category](https://www.creatus.com.bd/motherboard) |
| Techno House | partial | 20 | 3 | Partial: ordinary category pages became accessible and 20 CPU/3 motherboard rows were verified, but complete category pagination was not established. | [CPU/category](https://technohouse.com.bd/category/processor), [Motherboard/category](https://technohouse.com.bd/category/motherboard) |
| PQS | complete | 123 | 429 | Traversed processor pages 1–3 and motherboard pages 1–9, the complete exposed pagination on the captured category pages. | [CPU/category](https://www.pqs.com.bd/processor), [Motherboard/category](https://www.pqs.com.bd/motherboard) |
| Tech Shoppers BD | partial | 118 | 12 | Partial: category pages exposed products, but complete WordPress pagination/catalog coverage was not established. | [CPU/category](https://techshoppersbd.com/pc-components/processors/), [Motherboard/category](https://techshoppersbd.com/pc-components/motherboard/) |
| Samanta Computer | partial | 22 | 27 | Partial: category pages exposed products, but complete pagination/catalog coverage was not established. | [CPU/category](https://www.samantacomputer.com/category/processor), [Motherboard/category](https://www.samantacomputer.com/category/motherboard) |
| ZoomTech | partial | 1 | 0 | Partial: one qualifying processor was verified; desktop motherboard category returned no qualifying product cards and no completeness signal. | [CPU/category](https://www.zoomtechbd.com/category/processor), [Motherboard/category](https://www.zoomtechbd.com/category/desktop-motherboard) |
| Star Computer | partial | 46 | 43 | Partial: archive/category pagination was observed, but not all exposed product/category pages were re-enumerated in this run. | [CPU/category](https://www.starcomputer.com.bd/Product-category/components/processor/), [Motherboard/category](https://www.starcomputer.com.bd/Product-category/components/motherboard/) |
| Binary Logic | partial | 19 | 24 | Partial: category cards and legacy product-table links were checked; complete catalog pagination/sitemap coverage was not clear. | [CPU/category](https://www.binarylogic.com.bd/processor), [Motherboard/category](https://www.binarylogic.com.bd/motherboard) |
| Computer Source | partial | 21 | 20 | Complete for exposed category pages: processor pages 1–2 and motherboard pages 1–3 were traversed; counts reflect qualifying direct listings found. | [CPU/category](https://computersource.com.bd/processor), [Motherboard/category](https://computersource.com.bd/motherboard), [Evidence 3](https://computersource.com.bd/processor?page=2), [Evidence 4](https://computersource.com.bd/motherboard?page=3) |
| SmartBD | partial | 7 | 20 | Partial: ordinary accessible processor/motherboard category pages were retried; product pages were reachable, but full pagination/catalog completeness was not established. | [CPU/category](https://smartbd.com/product-category/computer-components/processor/), [Motherboard/category](https://smartbd.com/product-category/computer-components/motherboard/) |
| Global Brand | partial | 20 | 35 | Partial: processor and gaming-motherboard pages (including exposed page links) were checked; broader motherboard taxonomy/sitemap completeness was not established. | [CPU/category](https://www.globalbrand.com.bd/components/processor), [Motherboard/category](https://www.globalbrand.com.bd/gaming-motherboard) |
| TrustTech | partial | 20 | 20 | Partial: category pages were accessible and product cards verified, but exposed category pagination/catalog was not fully traversed. | [CPU/category](https://trusttechbd.com/categories/processor), [Motherboard/category](https://trusttechbd.com/categories/mother-board) |
| UCC | partial | 19 | 28 | Partial: processor pages 1–4 and motherboard pages 1–8 were fetched, but product-level/catalog completeness could not be positively reconciled to a site total. | [CPU/category](https://www.ucc.com.bd/processors), [Motherboard/category](https://www.ucc.com.bd/motherboards) |
| Zeon Tech | partial | 16 | 16 | Partial: ordinary accessible pages yielded qualifying CPU and motherboard product URLs, but no reliable terminal pagination/total was exposed. | [CPU/category](https://zeontechbd.com/) |
| Speed Tech | complete | 50 | 124 | Traversed processor pages 1–4 and motherboard pages 1–8, through the terminal exposed page. | [CPU/category](https://www.speedtech.com.bd/processor), [Motherboard/category](https://www.speedtech.com.bd/motherboard), [Evidence 3](https://www.speedtech.com.bd/processor?page=4), [Evidence 4](https://www.speedtech.com.bd/motherboard?page=8) |
| City Computer & Technology | complete | 52 | 56 | Traversed processor pages 1–3 and motherboard pages 1–6, through the terminal exposed page. | [CPU/category](https://www.citycomputer.com.bd/components/processor), [Motherboard/category](https://www.citycomputer.com.bd/components/motherboard), [Evidence 3](https://www.citycomputer.com.bd/components/motherboard?page=6) |
| Universal Computer BD | complete | 0 | 90 | Traversed processor pages 1–5 and motherboard pages 1–10, through terminal exposed pages; processor bundle/complete-PC entries excluded. | [CPU/category](https://www.universal.com.bd/processor), [Motherboard/category](https://www.universal.com.bd/motherboard), [Evidence 3](https://www.universal.com.bd/motherboard?page=10) |

## Important quality findings

- Complete traversal does not mean current stock. Large retailer catalogs contain archived and unavailable product pages.
- 2325 rows have no verified numeric price and must not appear as purchasable offers until a connector refresh confirms one.
- 2509 rows have unknown stock. A price or generic buy button alone is not sufficient evidence of availability.
- Model candidates are useful for matching but are not manufacturer part numbers unless the retailer explicitly supplies one. Ambiguous title-derived candidates must go through `product_match_candidates` review.
- This export deliberately does not create canonical `products`. Product identity and specifications must be established from approved specification sources before merchant listings are attached.
- A production connector must re-read robots.txt, respect delays, refresh prices, and deactivate repeatedly failing listings; this dated census cannot replace that pipeline.

## Known limitations

- The snapshot is current only to the capture time; prices, stock, titles, and URLs can change immediately.
- TechLand, Skyland, Ultra Technology, Potaka IT, PCB Store, Creatus, Techno House, Tech Shoppers BD, Samanta Computer, ZoomTech, Star Computer, Binary Logic, Computer Source, SmartBD, Global Brand, TrustTech, UCC, and Zeon Tech remain partial because terminal sitemap or catalog coverage could not be proven.
- Retailer category counts and verified direct URLs are different concepts. The table reports only captured direct URLs.
- No attempt was made to bypass blocks, rotate proxies, or disguise the requester.

