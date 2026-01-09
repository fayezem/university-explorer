from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/universities_debug")
async def universities_debug():
    url = "https://api.openalex.org/institutions?filter=country_code:CA&per_page=5"
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url)
        r.raise_for_status()
        raw = r.json()

    results = raw.get("results", [])
    return {
        "results_len": len(results),
        "first_geo": (results[0].get("geo") if results else None),
        "first_keys": (list(results[0].keys()) if results else None),
    }

@app.get("/universities")
async def universities():
    url="https://api.openalex.org/institutions?filter=country_code:CA&per_page=200"

    async with httpx.AsyncClient( timeout=20) as client:   

        response = await client.get(url)
        response.raise_for_status()
        raw= response.json()

        results = raw.get("results", [])
        cleaned = []

        for item in results:
            geo= item.get("geo") or {}
            lat= geo.get("latitude")
            lon= geo.get("longitude")
            if lat is None and lon is None:
                continue
            cleaned.append({
                "id": item.get("id"),  
                "name": item.get("display_name"),
                "lat": float(lat),
                "lon": float(lon),
            })
        return cleaned 