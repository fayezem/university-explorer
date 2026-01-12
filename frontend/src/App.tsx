
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'leaflet/dist/leaflet.css'
import './App.css'


export default function App(){


  


  type MarkerType = {
    id: string| number;
    name?: string;
    geocode: [number, number]; // tuple type
    // add other fields returned by your API (e.g. address, website) if needed
  };

  type BackendUniversity ={
    id: string | number;
    name: string;
    lat: number;
    lon: number;
  }

  // Sample markers kept as a fallback while you wire the real API.
  // Replace or remove these once your API is available.
  // Example Canadian sample markers (visible when OpenAlex isn't used yet)
  const SAMPLE_MARKERS: MarkerType[] = [
    { id: 1, geocode: [43.6532, -79.3832], name: 'Sample University Toronto' },
    { id: 2, geocode: [45.5017, -73.5673], name: 'Sample University Montreal' },
    { id: 3, geocode: [49.2827, -123.1207], name: 'Sample University Vancouver' },
  ];

  // State for markers that will be displayed. Start with SAMPLE_MARKERS for immediate UI.
  const [markers, setMarkers] = useState<MarkerType[]>(SAMPLE_MARKERS);
  const [selected, setSelected] = useState<MarkerType | null>(null);
  const [backendStatus, setBackendStatus] = useState<"loading" | "ok" | "fail">("loading");


  /**
   * Placeholder/fetch skeleton for loading real markers from an external API.
   * Replace `API_URL` with your endpoint and map the response to `MarkerType[]`.
   * The function accepts an optional AbortSignal to allow cancelling the request.
   */
  async function fetchMarkers(signal?: AbortSignal): Promise<MarkerType[]> {
    const API_URL = "http://localhost:8000/universities"; // API endpoint

    const res= await fetch(API_URL, { signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch markers: ${res.status} ${res.statusText}`);
    }

    const items: BackendUniversity[] = await res.json();
    
    // Map backend data to MarkerType
    return items.map((u, idx) => ({
    id: u.id ?? idx,
    name: u.name,
    geocode: [u.lat, u.lon],
  }));
}

  useEffect(() => {
  fetch("http://localhost:8000/health")
    .then((r) => r.json())
    .then((d) => setBackendStatus(d.ok ? "ok" : "fail"))
    .catch(() => setBackendStatus("fail"));
}, []);
  
  // Load markers on mount. Uses AbortController to cancel if component unmounts.
  useEffect(() => {
    const ctrl = new AbortController();

    // Call the OpenAlex-fetch implementation. This fetches up to `per_page` results.
    // If you need full coverage, implement pagination (OpenAlex supports cursor/pagination).
    fetchMarkers(ctrl.signal)
      .then(m => setMarkers(prev => (m.length ? m : prev)))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    return () => {
      ctrl.abort();
    };
  }, []);

const customIcon =new Icon({
  iconUrl:"https://cdn-icons-png.flaticon.com/512/5695/5695214.png",
 // iconUrl: "src=img/uni-icon.png",
  iconSize: [38, 38]
})

const createCustomClusterIcon = (cluster: { getChildCount: () => number }) => {
  return new DivIcon({
    html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
    iconSize: [33, 33],
    className: 'custom-cluster-icon'    
  });
};

  // Center map on Canada (approximate geographic center)
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
    
    <div style={{ position: "absolute", zIndex: 9999, top: 10, left: 10, padding: 8, background: "black" }}>
      Backend: {backendStatus}
    </div>
    <MapContainer center={[56.1304, -106.3468]} zoom={4} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <MarkerClusterGroup
    chunkedLoading
    iconCreateFunction={createCustomClusterIcon}>

    {markers.map(marker => (
      <Marker key={String(marker.id)} position={marker.geocode} icon={customIcon} eventHandlers={{click:() => setSelected(marker),}}>
        <Popup>
          <h2>{marker.name ?? `University ${marker.id}`}</h2>
        </Popup>
      </Marker>

    ))}
    </MarkerClusterGroup>

    </MapContainer>

    {selected && (
  <div
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 380,
      height: "100%",
      background: "black",
      zIndex: 9999,
      padding: 16,
      overflowY: "auto",
      boxShadow: "0 0 16px rgba(11, 10, 10, 0.2)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ margin: 0 }}>{selected.name ?? "University"}</h2>
      <button onClick={() => setSelected(null)}>X</button>
    </div>

    <hr />

    <p><b>ID:</b> {String(selected.id)}</p>
    <p><b>Latitude:</b> {selected.geocode[0]}</p>
    <p><b>Longitude:</b> {selected.geocode[1]}</p>
  </div>
)}
    </div>
  );
}




