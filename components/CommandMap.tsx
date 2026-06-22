'use client';

// Pure Leaflet map (no SSR). Loaded via next/dynamic({ ssr:false }) from
// CommandCentreClient so Leaflet never runs on the server. Uses CircleMarker
// bubbles (no marker-icon asset needed) sized by activity density.
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isHeadOffice: boolean;
  reports: number;
  participants: number;
  attendance: number | null; // 0..1
}

const BLUE = '#2A7CC7';
const NAVY = '#1B2B4B';

export default function CommandMap({ sites, metric }: { sites: MapSite[]; metric: 'reports' | 'participants' }) {
  const values = sites.map((s) => (metric === 'reports' ? s.reports : s.participants));
  const max = Math.max(1, ...values);
  // Bubble radius scales with sqrt of intensity so area ≈ value (8..38px).
  const radius = (v: number) => 8 + Math.sqrt(v / max) * 30;

  return (
    <MapContainer
      center={[-29.6, 30.5]}
      zoom={8}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '1.5rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sites.map((s) => {
        const v = metric === 'reports' ? s.reports : s.participants;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={radius(v)}
            pathOptions={{
              color: s.isHeadOffice ? NAVY : BLUE,
              fillColor: s.isHeadOffice ? NAVY : BLUE,
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={1}>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>{s.name}</strong>
                <br />
                {s.reports.toLocaleString()} reports
                <br />
                {s.participants.toLocaleString()} participant-days
                {s.attendance != null && (
                  <>
                    <br />
                    {Math.round(s.attendance * 100)}% attendance
                  </>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
