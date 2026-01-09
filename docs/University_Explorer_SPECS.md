# University Explorer (Web App) 
**Goal**
Help students compare programs by showing **Total Cost of Study (TCS)** with transparent assumptions, filters, and sources.

**Outcome**
A fast web app you can run locally and deploy to Azure for a public demo. After teardown, the repo still runs locally with seed data.

---

## Stack (boring, resume-friendly)

* **Frontend:** React + Vite (TypeScript)
* **Backend API:** Node + Fastify (TypeScript) *(or Python FastAPI if you prefer)*
* **Data:** JSON seed → SQLite for local dev; on Azure use Blob-hosted JSON or a managed Postgres/SQLite-in-container
* **Build/Run:** pnpm (or npm), Docker (optional), GitHub Actions (CI)
* **Deploy (Azure):**

  * Easiest: **Azure Static Web Apps (Free)** for React + **SWA API (Azure Functions)**
  * Or: **Azure Container Apps** for a containerized API + **Static Web Apps** for the frontend

---

## MVP Scope

* Filters: region, language, tuition band
* Results list (table or cards) with pagination
* Detail panel: tuition, living costs, **TCS/year** and **TCS/total** with currency toggle
* Transparency: **source link + last updated** per cost item
* Offline-first: ships with **seed JSON**; local script loads into SQLite

---

## Data Model (logical)

```
universities(id, name, country, city, website, language, discipline, years)
costs(university_id, tuition_per_year_local, currency, source_url, checked_at)
city_costs(city, rent_1br, utilities, food, transit, insurance, currency, checked_at)
fx_rates(code, rate_to_usd, date)
```

## TCS (v1)

```
TCS_year = tuition + (rent + utilities + food + transit + insurance) * 12
TCS_total = TCS_year * years
```

---

## API Routes (minimal)

* `GET /api/universities?q=&region=&language=&tuitionBand=&page=&limit=` → list + minimal fields + TCS preview
* `GET /api/universities/:id` → full details + TCS breakdown + sources
* `GET /api/fx` → FX table + date (local: static; cloud: daily cached)
* (Dev) `POST /api/seed` *(local only)* loads seed JSON → SQLite

---

## UI Bits

* **Left filter rail** (region, language, tuition band)
* **Results** center pane (table/cards)
* **Right detail drawer** (breakdown, sources, “last updated,” currency toggle)
* **Scenario sliders (stretch):** roommates, food multiplier, transit pass

---

## Repo Layout

```
/app
  /frontend  (React+Vite, src/components, src/pages, src/lib)
  /backend   (Fastify/FastAPI, src/routes, src/db, src/services)
  /data      (seed/*.json - 50 curated schools + costs + city costs + fx)
  /scripts   (seed.ts|py, export.ts|py)
  .env.example
  docker-compose.yml (optional dev convenience)
```

---

## Definition of Done

* [ ] Local: `pnpm i && pnpm dev` → app runs with seeded data
* [ ] Filters return results **< 200 ms** on 50–200 rows
* [ ] Detail shows TCS + breakdown + currency toggle + sources with dates
* [ ] CI: typecheck + lint + unit tests (TCS math, FX conversion)
* [ ] Azure deploy: live URL + README steps to reproduce

---

## Tests / Quality

* **Unit:** TCS math, FX conversions, tuition banding, query builder
* **API:** list + detail schema, pagination bounds
* **e2e (light):** Playwright (optional) smoke test on build artifact
* **Data QA:** script that validates required fields + date staleness

---

## Milestones (90-min slices)

1. **Walking Skeleton:** React page + fake row; Fastify `GET /health`; proxy connects FE→BE
2. **Data Load:** seed JSON → SQLite; `GET /api/universities` returns 50 rows
3. **TCS Function:** pure function + tests; detail endpoint includes breakdown
4. **Filters + Pagination:** DAO queries with prepared statements
5. **Polish:** currency toggle, sources/checked_at, README screenshots
6. **Deploy:** SWA (FE) + Functions (API) or Container Apps (API)

---

## Stretch (pick 1–2)

* Scenario sliders (roommates, food multiplier, transit pass)
* Shortlist → **PDF compare** (server-side render or client print CSS)
* Basic map (Leaflet) in FE with clustered markers
* Watchlist/alerts (manual refresh button first)

---

## Note: Running Locally vs Deploying vs Deleting Azure

**Local (forever runnable)**

* Keep **seed JSON** in `/data/seed/*.json` and a **seed script** (`/scripts/seed.ts|py`) that creates/populates SQLite.
* Use `.env.example` with sensible defaults:

```
NODE_ENV=development
PORT=8080
DATABASE_URL=sqlite:./dev.db
FX_SOURCE=local
```

* Document in README: `pnpm i`, `pnpm dev` runs both FE+BE (or `docker-compose up`).

**Deploy to Azure (for demo)**

* **Static Web Apps (Free):** points to `/frontend`, wires to Functions in `/backend` if you choose SWA + Functions.
* Or **Container Apps:** containerize the backend (`Dockerfile`) and deploy; keep the frontend on SWA.
* Use **App Settings/Key Vault** for secrets. Commit **no secrets**.

**Teardown (delete costs; keep code runnable)**

* Put all cloud resources in **one Resource Group**. When done demoing:

  * Record a short demo video/GIF; keep the GitHub repo public with **screenshots**.
  * **Delete the Resource Group** to stop charges.
  * Nothing in the repo is lost—your code, seed JSON, and SQLite scripts remain.
  * If you stored data in cloud (Blob, Postgres), export a **snapshot** to `/data/export/` before deleting (add an `export` script).

**Proof after teardown**

* README contains:

  * The former **live demo link** (when active) + recorded demo (GIF/video)
  * “Run locally” steps + screenshots
  * **Cloud Architecture (Demo)** section listing services used and a **Cleanup** note confirming RG deletion

**Optional: IaC for reproducibility**

* Add a `bicep/` or `terraform/` folder for SWA + Container Apps + Storage. Lets you redeploy quickly if an interviewer asks.
