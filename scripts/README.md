# Scripts

Place repeatable maintenance commands here, such as OpenAPI client generation, catalog imports, and test-data preparation. One-off business logic should not live in this directory.

## Listing candidate import

Validate the researched Bangladesh CPU and motherboard listing CSV without
writing to the database:

```powershell
python scripts/import_listing_candidates.py
```

After applying `202611070002_listing_match_pipeline.sql`, review the merchant
list and then stage the rows with the backend service-role environment:

```powershell
python scripts/import_listing_candidates.py --apply --create-merchants
```

Dry-run is the default. Applying the import writes only to the private
`merchant_listing_candidates` and `product_match_candidates` staging tables.
It never promotes a row to the public `merchant_listings` table and never
auto-approves a match derived from the research CSV.

## Canonical product import

Validate the official-source CPU and motherboard manifest:

```powershell
python scripts/import_canonical_products.py
```

Import its deterministic brands, products, sockets, and specifications:

```powershell
python scripts/import_canonical_products.py --apply
```

The manifest accepts only configured manufacturer domains for specification
sources. Shop pages remain price/listing evidence only. Re-running the import
updates the same deterministic product and specification records.

## Product-match review

List pending private proposals:

```powershell
python scripts/review_product_matches.py list
```

After manually comparing the canonical model and retailer URL, record a
decision with an auditable reviewer ID:

```powershell
python scripts/review_product_matches.py approve <match-uuid> --reviewed-by <user-id> --yes
python scripts/review_product_matches.py reject <match-uuid> --reviewed-by <user-id> --yes
```

Approval atomically creates or updates `merchant_listings`, writes
`price_history` only for a new or changed price, marks competing proposals as
rejected, and links the staged candidate to the promoted listing. Unpriced
candidates cannot be approved.

## Automatic deterministic promotion

Preview or apply automatic promotion for priced, exact normalized-model
matches at 95% confidence or higher:

```powershell
python scripts/auto_promote_matches.py
python scripts/auto_promote_matches.py --apply
```

This is the normal listing path. Manual review remains only as a fallback for
ambiguous title-only matches. The browser reads promoted offers from FastAPI;
it does not scrape retailer sites directly.
