# University Explorer — UI & Architecture Map

---

## UI Layout → Components

* **Base:** Google Maps canvas filling the page.
* **Left overlay (rail):** Search + Filters + Results (scrollable).
* **Bottom sheet:** Details for the selected university.

  * Left: facts (name, city, tuition, living breakdown, sources, **Add to compare**).
  * Right: small **AI Cost Summary** (optional).
* **Top-right chip:** **Compare (N)** dropdown → opens **Compare Drawer** (table + AI compare button).
* **Toasts:** errors, added-to-compare, saved filters.

```tsx
<AppShell>
  <MapCanvas />
  <LeftRail>
    <SearchBar />
    <FilterGroup />
    <ResultsList />   {/* <ResultCard/> x N; [+Compare] */}
  </LeftRail>
  <BottomSheet>
    <UniversityDetails />
    <AICostSummary />   {/* optional */}
    <ActionsRow> <AddToCompare/> </ActionsRow>
  </BottomSheet>
  <CompareChip />
  <CompareDrawer>
    <CompareTable />
    <AICompareSummary />
  </CompareDrawer>
</AppShell>
```

---

## Client State (store sketch)

```ts
type Filters = { q?: string; region?: string; language?: string; tuitionBand?: string };
type UniLite = { id: string; name: string; lat: number; lng: number; tuitionBand: string; country: string; city: string };
type UniFull = UniLite & {
  years: number;
  tuitionLocal: number; currency: string;
  sources: { tuition:string; cityCosts:string; checkedAt:string };
  living: { rent:number; utilities:number; food:number; transit:number; insurance:number };
};

state = {
  filters: {} as Filters,
  results: [] as UniLite[],
  selectedId: null as string | null,
  selected: null as UniFull | null,
  compare: [] as string[],
  fx: { USD:1 },
  ui: { isCompareOpen:false, isBottomOpen:false, isLoading:false }
};
```

**Event flow**

* Filter/search → fetch `GET /api/universities?...` → render markers + list.
* Click marker/card → set `selectedId` → fetch `GET /api/universities/:id` → open BottomSheet.
* Add to Compare → push id (dedupe) → update CompareChip.
* Open Compare → fetch details for ids if not cached → render table → optional AI compare.

---

## Backend Services (minimal)

* `GET /api/universities?q=&region=&language=&tuitionBand=&page=&limit=` — list
* `GET /api/universities/:id` — detail + TCS breakdown + sources
* `GET /api/fx` — FX table + date
* (Optional) `POST /api/ai/summary` — `{ ids?:string[], textItems?:string[] }` → text bullets

**Data model (logical)**

```
universities(id, name, country, city, website, language, discipline, years, lat, lng)
costs(university_id, tuition_per_year_local, currency, source_url, checked_at)
city_costs(city, rent_1br, utilities, food, transit, insurance, currency, checked_at)
fx_rates(code, rate_to_usd, date)
summaries(university_id | compare_hash, text, created_at, model)
```

**Compare view (table)**
Columns: Name • City/Country • Tuition (local + converted) • Living (rent/utilities/food/transit/insurance) • **TCS/year** • **TCS/total** • Sources.

---

## Google Maps specifics

* Use **Maps JavaScript API** (or **Leaflet + OSM** for $0).
* Marker **clustering** for performance.
* Debounce “map bounds changed” to highlight results currently in view (optional).

---

## Azure mapping (cheap)

* **Frontend:** Azure Static Web Apps (Free).
* **API:** Azure Functions (Consumption) or Azure Container Apps free grant.
* **Data:** ship seed JSON (50 schools). Cloud can read Blob/JSON; local uses SQLite.
* **App Insights:** logs + basic metrics.

---

## Build Order (learn-as-you-go)

1. **Walking skeleton** (Day 1–2): Map renders; LeftRail with SearchBar. Backend `/health` up; FE→BE proxy works.
2. **Search + results + map** (Day 3–5): seed 50 rows; list endpoint; markers; ResultCard; AddToCompare (local state).
3. **Details + TCS** (Day 6–8): detail endpoint; BottomSheet shows TCS (pure function + unit test), currency toggle.
4. **Compare drawer** (Day 9–10): fetch details for compare ids; render **CompareTable**; remove row; copy CSV.
5. **Polish + deploy** (Day 11–12): screenshots; README; deploy to SWA + Functions.
6. **AI stubs (optional)** (Day 13–14): `/api/ai/summary` + UI button; store text in `summaries`.

---

## What to learn per feature

* **MapCanvas:** Maps JS basics (API key, markers, clustering, handlers).
* **LeftRail:** controlled inputs, debounced queries, pagination.
* **List/Marker sync:** state mgmt (Context/Zustand), memoization.
* **BottomSheet:** fetch patterns, optimistic UI, formatting.
* **TCS math:** pure function + unit tests.
* **CompareTable:** table rendering, sorting, CSV export.
* **AI portal (opt):** API calling, rate limits, storing summary text.

---

## Definition of Done (page-level)

* Filters return in **< 200 ms** against 50–200 rows.
* Every cost number shows **source + last updated**.
* Add-to-compare works from list and details; Compare table exports CSV.
* README has **Run locally** and **Deploy to Azure** steps with screenshots.

---

## Local vs Azure vs Teardown

* Keep **seed JSON** and `scripts/seed.(ts|py)` for SQLite so the app runs offline forever.
* Deploy all cloud resources in **one Resource Group**. Record demo, then **delete the RG** to stop charges.
* Repo remains runnable locally (depends on seed/SQLite). If you stored cloud data, add an **export** script to `/data/export/` before deletion.
