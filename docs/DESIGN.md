# TechBondhu design references

## Products mega menu

- Reference: [CORSAIR homepage](https://www.corsair.com/us/en)
- Inspected: 2026-10-21, desktop homepage and supplied Products-menu screenshot.
- Scope: Products hover navigation only. TechBondhu does not copy CORSAIR branding, logo, typography, or page structure.

### Observed reference pattern

The CORSAIR Products menu uses a nearly black full-width panel, six evenly spaced category columns, large isolated white product-category illustrations, condensed uppercase headings, compact link lists, and a thin yellow active indicator. The icons are visually dominant while individual links stay quiet.

### TechBondhu adaptation

- Keep the existing light capsule navigation and technical grid landing page.
- Open a warm-white floating mega panel beneath `Products` on desktop hover or keyboard focus so it remains consistent with the TechBondhu landing page.
- Use six category columns with locally stored reference icons. The categories cover PC components, gaming gear, computers, setup and furniture, games, and TechBondhu's core discovery tools.
- Use the transparent PS5 controller artwork from the prototype assets for the Games category without applying the solid-black icon filter.
- Render the white reference icons in black and use a restrained black active rule.
- Hide the desktop mega panel on narrow screens and retain the direct horizontal category navigation.
- Category buttons are placeholders until catalog routes exist.

### Reference assets

The following official CORSAIR navigation assets are stored locally under `src/frontend/public/menu-icons/` for private prototype/reference use:

- `components.png` — `nav_components_icon.png`
- `gaming-gear.png` — `nav_peripherals_icon.png`
- `computers.png` — `nav_pc-monitors_icon.png`
- `furniture.png` — `nav_gamingdesk_icon.png`
- `workstation.svg` — `nav_aiworkstation_icon.svg`
- `shop.png` — `nav_shoppingcart_icon.png`

These assets are owned by CORSAIR and should be replaced with licensed or original TechBondhu illustrations before public commercial release.
