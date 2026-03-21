# Feature: Product Management Module

Master product catalog for a made-to-measure drapeworks business — defines product templates with variant-based pricing, cost tracking, and margin visibility.

## User Story

As a drapeworks business owner, I want a centralized product catalog with pricing and variants, so that I can standardize my product offerings, track margins, and speed up deal creation by selecting from pre-defined products.

## Acceptance Criteria

1. [ ] User can view all products grouped by category (e.g., Curtains & Drapes, Blinds, Services)
2. [ ] User can create a product with name, description, category, base sell price, and cost price
3. [ ] User can add variants to a product (e.g., "Ivory, 240cm") with variant-specific sell price, cost price, and attributes (JSONB for fabric, size, color, etc.)
4. [ ] User can edit and delete products and variants
5. [ ] User can create, rename, reorder, and delete product categories
6. [ ] Margin % is calculated and displayed per product and per variant: `(sell - cost) / sell * 100`. Negative margins shown in red. Zero sell price shows "N/A".
7. [ ] KPI summary cards show: total products, total variants, average margin
8. [ ] User can search products by name (searches both product names and variant names)
9. [ ] User can filter products by category
10. [ ] Products page is accessible from a dedicated sidebar nav item ("Products") between "Clients" and "Settings" (before the future "Orders" item)
11. [ ] Product picker component works in two modes: (a) autocomplete dropdown when typing in deal line item name field — searches across product and variant names, (b) catalog browser modal via "Browse Catalog" button
12. [ ] When a product/variant is selected from the picker, name and price auto-fill into the deal line item; price remains editable for custom quotes
13. [ ] Deal line items that reference a catalog product store the `product_id` and optional `variant_id`
14. [ ] Per-line-item spec sheet form is available when adding a product to a deal. Width and Drop are required when the spec form is filled; all other spec fields are optional. The spec form itself is optional — user can skip it entirely.
15. [ ] Spec fields: width_cm, drop_cm, room_name, window_position, fixing_type, stack_direction, lining_type, motorization, notes
16. [ ] Dropdown fields use predefined options (see Spec Field Options below) but also accept custom free-text input
17. [ ] Existing free-text deal line items (no catalog product) continue to work unchanged
18. [ ] Category management is accessible inline on the Products page (add/rename via inline edit, reorder via drag or arrows, delete via menu)

## Spec Field Options

Default dropdown values — users can type custom values not in this list:

- **Fixing type:** Ceiling mount, Wall mount, Face fix, Inside recess, Outside recess
- **Stack direction:** Left, Right, Center, Split
- **Lining type:** Unlined, Privacy, Blockout, Thermal
- **Motorization:** Manual, Motorized, Smart home (Tuya/Zigbee)

## UI Behavior

- **Products page**: KPI cards at top (3 cards), search + category filter bar, products grouped by category in collapsible sections
- **Product row**: Shows product name, description, cost price range, sell price range, margin %, variant count; click to expand and show variants table
- **Expanded product**: Variants table with columns: variant name, size, fabric, cost, sell, margin; "Add Variant" and "Edit Product" buttons
- **Product picker (autocomplete)**: Typing in deal line item name field shows dropdown of matching products and variants with names and prices; "Add as custom item" option at bottom for non-catalog items
- **Product picker (modal)**: Full catalog browser with search, category filter, product list with select checkboxes; shows cost and margin (for owner reference); selected items added to deal
- **Spec form**: Appears below deal line item after product is selected; two-column grid of spec fields: width*, drop*, room name, window position, fixing type, stack direction, lining type, motorization; free-text notes textarea. Existing deal line item fields (qty, unit price) are shown alongside but are not part of the spec form. (* = required when form is open)
- **Responsive**: Products page stacks KPI cards in a row on mobile; product rows become full-width cards; spec form stacks to single column
- **Sidebar**: "Products" appears between "Clients" and "Settings" with a badge showing total product count

## Data

- **Reads:** `deals.products` JSONB (for product picker pre-fill), `product_categories`, `products`, `product_variants`
- **New tables:**
  - `product_categories` — id, user_id, name, sort_order, created_at
  - `products` — id, user_id, name, description, category_id (FK nullable, ON DELETE SET NULL), sell_price (numeric 12,2), cost_price (numeric 12,2), created_at, updated_at
  - `product_variants` — id, product_id (FK, ON DELETE CASCADE), user_id (denormalized for Supabase RLS), name, attributes (JSONB), sell_price (numeric 12,2), cost_price (numeric 12,2), created_at, updated_at
- **Writes:** `product_categories`, `products`, `product_variants`, `deals.products` JSONB (when product picker adds/edits line items), `activities` (via logActivity)
- **Modified schemas:**
  - `deals.products` JSONB — existing line items gain optional fields: product_id, variant_id, width_cm, drop_cm, room_name, window_position, fixing_type, stack_direction, lining_type, motorization, notes. This is a non-breaking additive change — no SQL migration needed. Existing `{ name, qty, price }` objects remain valid since all new fields are optional in the Zod schema.
- **Migration:** `packages/shared/migrations/011_product_catalog.ts`
- **Kysely types:** Add `ProductCategoriesTable`, `ProductsTable`, `ProductVariantsTable` to `packages/shared/src/database/types.ts` and register in `Database` interface
- **Schema files:** `packages/shared/src/schemas/product.ts` (new), `packages/shared/src/schemas/deal.ts` (extend DealProductSchema with optional fields)

## Edge Cases

- **Empty state:** "No products yet. Add your first product to get started." with a prominent "Add Product" button
- **Empty category:** Category header still shows with "0 products" count
- **Delete product with variants:** Cascade delete all variants
- **Delete category with products:** Confirmation dialog: "This category has N products. They will become uncategorized." Products set to category_id null via FK ON DELETE SET NULL.
- **Product picker with no catalog:** Autocomplete field shows "No products in catalog — type to add a custom item"; catalog browser modal shows empty state with "Add Product" link
- **Error state:** Toast notification on save/delete failures
- **Loading state:** Skeleton cards for KPI area, skeleton rows for product list
- **Backward compatibility:** Existing deals with `products: [{ name, qty, price }]` remain valid — all new fields are optional additions to the Zod schema. No SQL migration needed for the JSONB column.
- **Negative margin:** Display in red text
- **Zero sell price:** Show margin as "N/A"

## Out of Scope

- Inventory/stock tracking
- Product images
- Bulk import/export
- Price history tracking
- Multi-currency per product (inherits deal currency)
- Supplier management
- SKU codes (can add later)
- Product active/inactive toggle (can add later — for now, delete unwanted products)
- Sorting products by price/margin/name (can add later)
- Best seller / MTD revenue KPIs (requires order data — add when OMS is built)
