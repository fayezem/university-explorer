# University Explorer — Architecture Trees

---

## 1) Runtime System Tree

```
University Explorer (runtime)
├─ Client (Browser)
│  ├─ React App
│  │  ├─ AppShell
│  │  │  ├─ MapCanvas  ← Google Maps JS API / (Leaflet alt.)
│  │  │  ├─ LeftRail
│  │  │  │  ├─ SearchBar
│  │  │  │  ├─ FilterGroup
│  │  │  │  └─ ResultsList
│  │  │  │     └─ ResultCard [+Compare]
│  │  │  ├─ BottomSheet
│  │  │  │  ├─ UniversityDetails
│  │  │  │  ├─ AICostSummary (optional)
│  │  │  │  └─ ActionsRow [AddToCompare]
│  │  │  ├─ CompareChip
│  │  │  └─ CompareDrawer
│  │  │     ├─ CompareTable
│  │  │     └─ AICompareSummary (optional)
│  │  ├─ Client Store (state)
│  │  │  ├─ filters / results / selected / compare
│  │  │  └─ fx / ui flags
│  │  └─ Services
│  │     ├─ apiClient (fetch + retry + debounce)
│  │     └─ tcs.ts (pure computation)
│  └─ Auth (none for MVP; add later if needed)
│
├─ API Layer
│  ├─ HTTP Gateway (Fastify or Functions HTTP triggers)
│  ├─ Routes
│  │  ├─ GET /api/universities        → list w/ filters
│  │  ├─ GET /api/universities/:id    → full details + TCS
│  │  ├─ GET /api/fx                  → FX table
│  │  └─ POST /api/ai/summary         → text bullets (optional)
│  └─ Middlewares: validation (zod), logging, caching headers
│
├─ Domain / Services
│  ├─ UniversityService (queries + DTO shaping)
│  ├─ TcsService (TCS breakdown, currency convert)
│  ├─ FxService (daily rates; local static or cached fetch)
│  └─ AiService (rate‑limited summarization; optional)
│
├─ Data Access
│  ├─ Repos (prepared queries)
│  └─ DB Driver (SQLite local / Postgres cloud) or Blob JSON reader
│
└─ Data Stores
   ├─ SQLite (local dev) or Postgres (cloud)
   ├─ Blob Storage (seed JSON, exports) — cloud
   └─ App Insights (logs/metrics) — cloud
```

---

## 2) Backend Services Tree (layers)

```
Backend
├─ app.ts (bootstraps server, wiring)
├─ routes/
│  ├─ universities.list.ts
│  ├─ universities.detail.ts
│  ├─ fx.get.ts
│  └─ ai.summary.ts (optional)
├─ services/
│  ├─ UniversityService.ts
│  ├─ TcsService.ts
│  ├─ FxService.ts
│  └─ AiService.ts
├─ repos/
│  ├─ UniversityRepo.ts
│  ├─ CostsRepo.ts
│  ├─ CityCostsRepo.ts
│  └─ FxRepo.ts
├─ db/
│  ├─ schema.sql (migrations v1)
│  └─ connection.ts
├─ util/
│  ├─ validate.ts (zod schemas)
│  ├─ cache.ts (simple in‑memory cache)
│  └─ logger.ts (pino/winston)
└─ tests/
   ├─ tcs.spec.ts
   ├─ fx.spec.ts
   ├─ universities.route.spec.ts
   └─ repos.spec.ts
```

---

## 3) Data Model Tree

```
Data Model
├─ universities
│  ├─ id (PK)
│  ├─ name, website
│  ├─ country, city, language, discipline
│  ├─ years
│  ├─ lat, lng
│  └─ created_at / updated_at
├─ costs
│  ├─ university_id (FK)
│  ├─ tuition_per_year_local, currency
│  ├─ source_url, checked_at
│  └─ notes
├─ city_costs
│  ├─ city (PK or ref table)
│  ├─ rent_1br, utilities, food, transit, insurance
│  ├─ currency, checked_at
│  └─ source_url
├─ fx_rates
│  ├─ code (PK)
│  ├─ rate_to_usd, date
│  └─ source
└─ summaries (optional)
   ├─ id (PK)
   ├─ kind: 'uni' | 'compare'
   ├─ ref: university_id | compare_hash
   ├─ text, model, created_at
   └─ inputs_hash
```

---

## 4) Request/Render Flow Tree

```
User → Search/Filter change
└─ Frontend debounces input (250ms)
   └─ GET /api/universities?q=...&filters
      ├─ UniversityService.buildQuery(filters)
      ├─ UniversityRepo.list()
      └─ Return {results[]} → render markers + list

User → Click marker/card
└─ set selectedId → GET /api/universities/:id
   ├─ UniversityRepo.getById + joins
   ├─ TcsService.calculate(detail, fx)
   └─ Return {detail+TCS} → open BottomSheet

User → Add to Compare
└─ Frontend store.push(id) (dedupe) → CompareChip count ↑

User → Open Compare Drawer
└─ For ids not cached → GET detail for each → render CompareTable
   └─ (Optional) POST /api/ai/summary → bullets → cache in `summaries`
```

---

## 5) Deploy Tree (Azure)

```
Azure Subscription (Students or Pay‑As‑You‑Go)
└─ Resource Group: rg-uni-explorer
   ├─ Static Web App: swa-uni-explorer (Frontend)
   ├─ Function App or Container App: api-uni-explorer (Backend)
   ├─ Storage Account: stuni (Blob for seed/export)
   └─ Application Insights: appi-uni-explorer
```

**Teardown:** delete **rg-uni-explorer** to remove all cloud resources. Repo remains runnable with local SQLite + seed JSON.

---

## 6) Learning Map (feature → topic)

```
MapCanvas     → Google Maps JS (markers, clusters, events)
LeftRail      → Controlled inputs, debounced fetch, pagination
ResultsList   → Virtualized lists (optional), accessibility
BottomSheet   → Data fetching patterns, optimistic UI, formatting
TCS Service   → Pure functions, unit testing
CompareTable  → Table libs, sorting, CSV export
API Layer     → Routing, validation, error handling, caching
Data Access   → SQL joins, indexes, prepared statements
Azure Deploy  → SWA + Functions/Container Apps, App Settings, Insights
```

# Priority Stack (in order)

## 1) Design system first (1–2 hrs max)
- Pick fonts, spacing scale, colors, and “glass” tokens (Tailwind classes).
- Make 3 reusable primitives: **Button**, **Input**, **Card**.
- **Purpose:** avoid redesign churn later.

## 2) Walking skeleton (end-to-end, ugly is fine)
- Page renders **MapCanvas**, **LeftRail** with an input, **BottomSheet** placeholder.
- A fake API (`apiClient.mock.ts`) returns hardcoded data with `await wait(200)`.
- **Purpose:** routing, state, error handling, and layout all work.

## 3) Search → results (wired to mock)
- Debounced input updates **ResultsList** using the mock API.
- Add “**Add to Compare**” (local state only).
- **DoD:** typing shows 5 fake rows; compare count increments.

## 4) Real list API + seed data
- Build `GET /api/universities` over your seed dataset.
- Swap UI from mock to real by flipping one import.
- **DoD:** same UI now powered by real endpoint; **< 200 ms** on 50–200 rows.

## 5) Select → details + TCS
- `GET /api/universities/:id`; bottom sheet shows breakdown.
- TCS is a **pure function** with a unit test.
- **DoD:** clicking a card or marker opens details with **TCS + sources**.

## 6) Compare drawer/table
- Table shows selected rows side by side; remove row; copy CSV.
- **DoD:** 2–4 items compare without jank.

## 7) UX polish pass (now make it pretty)
- Apply glass styles, spacing, shadows, focus rings, micro-motion.
- Add empty/loading/error states; skeletons for list/detail.
- **DoD:** it **feels** cohesive and snappy.

## 8) Deploy to Azure (free tiers)
- **SWA** for frontend; **Functions** or **Container Apps** for API.
- App Insights logging; update README with steps & screenshots.
- **DoD:** live URL works; local dev still works offline with seed.

## 9) Optional AI
- Add `POST /api/ai/summary` (rate-limited); store text next to a snapshot.
- **DoD:** “Generate” renders **4–6 bullets** with a timestamp & model name.

---

# Mini Checklists per Slice (use as DoD)

## List slice
- [ ] Typing debounces to a request (or mock)  
- [ ] “No results” and “error” messages appear correctly  
- [ ] Keyboard can focus cards; **Enter** selects

## Detail slice
- [ ] TCS unit test passes (happy + edge case)  
- [ ] Sources show a URL + **checked_at** date  
- [ ] **Add to Compare** works from both list and detail

## Compare slice
- [ ] Table sorts by **TCS/year**  
- [ ] Remove row works; copy **CSV** works  
- [ ] Empty state explains how to add items

Break down:

1) Get google maps on a page: node/react --> google api
    - https://developers.google.com/maps/documentation/javascript/overview

2) Add basic UI for leftPopup, and make it look nice: React UI --> Tailwind CSS --> Radix + shadcn/ui --> Framer Motion
    └─ React component structure
        ├─ Controlled inputs, lifting state up to the page.
        └─ Debounced search (use setTimeout/clearTimeout or a tiny hook).
    └─ Layout & layering
        ├─ Map is the background (position: absolute / full-screen).
        ├─ Left rail is an overlay with fixed width and its own scroll.
        └─ Use z-index and backdrop blur to achieve glass.
    └─ Styling system
        ├─ Tailwind basics (spacing, rounded, shadows, opacity).
        └─ Glassmorphism recipe: backdrop-blur + translucent background + hairline border.
    └─ Components / Accessibility
        ├─ Mount/unmount transitions for rail & cards (Framer Motion’s AnimatePresence).
        └─ Keyboard nav (Tab, Arrow keys), focus rings, ARIA labels.
    └─ Motion polish
        ├─ Controlled inputs, lifting state up to the page.
        └─ Tiny hover/tap scale on buttons.
    └─ Performance
        ├─ Debounce searches.
        └─ Virtualize long lists later (react-virtual).
