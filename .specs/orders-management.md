# Feature: Order Management System (OMS)

Track the fulfillment lifecycle of orders from placement through production to delivery, with customizable stages and per-item specifications.

## User Story

As a drapeworks business owner, I want a dedicated order tracking system that picks up where my CRM deals leave off, so that I can manage production, schedule deliveries, and see the fulfillment status of all orders at a glance.

## Acceptance Criteria

1. [ ] When a CRM deal moves to the "ordered" stage, an order is automatically created in the OMS with a sequential per-user order number (ORD-001, ORD-002, etc., zero-padded to 3 digits)
2. [ ] Auto-create logic lives in the `updateDeal` server action: when `input.stage === 'ordered' && current.stage !== 'ordered'`, call a `createOrderFromDeal(dealId)` helper
3. [ ] Auto-created order inherits: line items as immutable snapshots (with specs/dimensions/notes), client reference, and deal reference
4. [ ] Payments are NOT copied — they are read from the linked deal's `payments` table at display time
5. [ ] User can view all orders on a dedicated Orders page, grouped by fulfillment stage
6. [ ] KPI summary cards show order counts per stage with total value (computed from `orders.total_amount`)
7. [ ] User can search orders by title/number and filter by stage, date, and client
8. [ ] User can click an order to see full detail: stage timeline, line items with specs, delivery info, payment status, client link, stage history
9. [ ] Each order line item displays its full spec sheet (width, drop, room, window position, fixing, stack, lining, motor, notes) — these are immutable snapshots taken at order creation
10. [ ] User can advance an order's stage with an optional note (e.g., "Advance to In Production")
11. [ ] Stage changes are recorded in `order_stage_history` with timestamps and notes
12. [ ] When an order stage changes to the final configured stage: if the linked deal's stage is still "ordered", auto-advance it to "fulfilled". If the deal is already at "fulfilled" or later, do nothing.
13. [ ] User can edit order-level fields: title, notes, delivery address, scheduled date/time, delivery notes, assigned installer
14. [ ] Order stages are customizable: user can add, rename, reorder, and remove stages. Renaming a stage updates all orders currently in that stage (batch update).
15. [ ] Default stages seeded on first access (when user has 0 `order_stages` rows): Ordered (color: orange) → In Production (color: blue) → Ready for Delivery (color: green) → Delivered (color: purple). New orders are created with stage set to the name of the `order_stages` row with the lowest `sort_order`.
16. [ ] Orders page is accessible from a dedicated sidebar nav item ("Orders") between "Products" and "Settings"
17. [ ] Order detail links back to the source deal and client for quick navigation

## UI Behavior

- **Orders list page**: KPI cards at top (one per stage with count + total value); search bar + stage/date/client filters; orders grouped by stage in collapsible sections with colored headers
- **Order row**: Shows order title, order number, item count, client name + avatar, amount, estimated/delivery date, payment badge (partial/paid/unpaid), arrow to detail
- **Order detail**: Back arrow + order title + order number in header; "Edit" and "Advance Stage →" buttons; two-column layout (main + sidebar)
  - **Main**: Stage timeline (horizontal dots), line items with expandable spec sheets, delivery info card, order notes textarea
  - **Sidebar**: Client link card, payment progress bar + breakdown (read from linked deal's payments), linked deal reference, stage history log
- **Stage timeline**: Horizontal steps with dots — completed (filled dark), current (highlighted with ring), future (outlined); each step shows label and date
- **Mobile**: Sidebar collapses to hamburger; KPI cards stack 2x2; order rows become full-width cards; detail view stacks sidebar below main; stage timeline becomes a compact progress bar
- **Sidebar**: "Orders" between "Products" and "Settings" with badge showing active (non-delivered) order count

## Data

- **New tables:**
  - `order_stages` — id, user_id, name, sort_order, color (text, hex string e.g. "#f59e0b"), created_at
  - `orders` — id, deal_id (FK ON DELETE CASCADE), contact_id (FK ON DELETE CASCADE), user_id, order_number (text), title (text), stage (text — stores the stage name), total_amount (numeric 12,2 — computed at creation from line items), notes (text), delivery_address (text), delivery_date (date), delivery_notes (text), assigned_to (text), created_at, updated_at
  - `order_items` — id, order_id (FK ON DELETE CASCADE), product_id (nullable FK ON DELETE SET NULL), product_variant_id (nullable FK ON DELETE SET NULL), name, qty (integer), unit_price (numeric 12,2), width_cm (numeric 8,2), drop_cm (numeric 8,2), room_name (text), window_position (text), fixing_type (text), stack_direction (text), lining_type (text), motorization (text), notes (text), sort_order (integer), created_at
  - `order_stage_history` — id, order_id (FK ON DELETE CASCADE), from_stage (text, nullable for initial creation), to_stage (text), changed_by (uuid FK to auth.users, nullable for system-triggered changes), notes (text), created_at
- **Modified tables:**
  - `document_sequences` — add 'order' type for ORD-XXX numbering (uses existing per-user sequence mechanism)
- **Reads:** orders, order_items, order_stages, order_stage_history, deals, payments (from linked deal), contacts
- **Writes:** orders, order_items, order_stages, order_stage_history, deals (stage sync on delivery), document_sequences, activities (via logActivity)
- **Migration:** `packages/shared/migrations/012_order_management.ts`
- **Kysely types:** Add `OrderStagesTable`, `OrdersTable`, `OrderItemsTable`, `OrderStageHistoryTable` to `packages/shared/src/database/types.ts` and register in `Database` interface
- **Schema:** `packages/shared/src/schemas/order.ts` (new)

### Stage name vs FK design decision

`orders.stage` stores the stage name as text (not a FK to `order_stages.id`). Rationale: stage names are human-readable strings displayed everywhere. Using a FK would require joins on every query. Trade-off: renaming a stage must batch-update all orders using the old name. This is handled in the `updateOrderStageConfig` action.

### Order items are immutable snapshots

Order line items are snapshots of the deal's line items at the time the order was created. They are NOT live-linked to the deal. If the deal's line items change after order creation, the order items stay as they were. This ensures order integrity for production and fulfillment.

**Field mapping from deal products JSONB to order_items:**
- `name` → `name`
- `qty` → `qty`
- `price` → `unit_price` (renamed for clarity)
- `product_id` → `product_id` (nullable, from PMM spec's DealProductSchema extension)
- `variant_id` → `product_variant_id` (nullable)
- `width_cm`, `drop_cm`, `room_name`, `window_position`, `fixing_type`, `stack_direction`, `lining_type`, `motorization`, `notes` → copied 1:1

**Prerequisite:** The PMM spec (`products-catalog.md`) extends `DealProductSchema` with these optional fields. If PMM is not yet implemented when OMS is built, order items will snapshot only `name`, `qty`, and `price` — spec fields will be null.

## Edge Cases

- **Empty state:** "No orders yet. Orders are created automatically when a deal moves to the 'Ordered' stage." with link to Clients page
- **Deal moved back from ordered:** Order remains — do not delete. Log a warning activity. Orders are independent once created.
- **Deal deleted with linked order:** Cascade delete the order (FK ON DELETE CASCADE)
- **Deal with no line items moves to ordered:** Create order with empty items and $0 total_amount; user can manage via deal
- **Duplicate order prevention:** `UNIQUE` constraint on `orders.deal_id` enforced at database level. Application also checks before inserting. If order already exists, skip creation and log an info activity.
- **No custom stages configured:** Seed 4 default stages on first access (checked in `getOrders` and `getOrderStageConfigs`)
- **Stage deleted while orders use it:** Prevent deletion if any orders currently have that stage name. Return error message.
- **Stage renamed:** Batch-update all orders with the old stage name to the new name in a single query
- **Delivered → fulfilled sync:** Only auto-advance the linked deal if its current stage is "ordered". If already at "fulfilled", "completed", or "lost", do nothing.
- **Multiple orders per deal:** Not expected (idempotency guard prevents it), but if it happens, each order is independent.
- **Error state:** Toast notifications on save/stage-advance failures
- **Loading state:** Skeleton KPI cards, skeleton order rows

## Out of Scope

- Drag-and-drop between stages (use buttons to advance)
- Supplier/purchase order tracking
- Per-item production status tracking
- Supplier/factory assignment per order item
- Shipping/courier integration
- PDF order confirmation generation
- Batch stage advancement
- Editing order line item specs after creation (order items are immutable snapshots — create a new order if specs change significantly)
- Real-time order status updates via Supabase subscriptions (can add later)
