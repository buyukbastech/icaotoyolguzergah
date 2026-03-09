import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { tollGates, passagePoints } from "@/data/mapData";
import { TollGate, PassagePoint } from "@/data/types";
import TollGateCard from "./TollGateCard";

interface MapViewProps {
  activeRoute: string | null;
  peakHourMode: boolean;
  selectedGroup: string | null;
}

const MapView = ({ activeRoute, peakHourMode, selectedGroup }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup>(L.layerGroup());
  const [selectedGate, setSelectedGate] = useState<TollGate | PassagePoint | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [41.12, 29.05],
      zoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    routeLayersRef.current.addTo(map);

    // Add toll gate markers (red-styled in KML, purple for G3)
    tollGates.forEach((gate) => {
      const statusColor = gate.id === "G3" ? "#a855f7" : "#ef4444";

      const icon = L.divIcon({
        className: "custom-gate-marker",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:${statusColor};opacity:0.2;" class="pulse-ring"></div>
            <div style="width:30px;height:30px;border-radius:50%;background:hsl(225,20%,10%);border:2px solid ${statusColor};display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${statusColor}60;cursor:pointer;">
              <span style="color:hsl(42,78%,55%);font-size:8px;font-weight:700;letter-spacing:0.3px;">${gate.id}</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([gate.lat, gate.lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelectedGate(gate);
        map.flyTo([gate.lat, gate.lng], 15, { duration: 1.5 });
      });
    });

    // Add passage points (green-styled in KML)
    passagePoints.forEach((point) => {
      const icon = L.divIcon({
        className: "custom-passage-marker",
        html: `
          <div style="width:24px;height:24px;border-radius:6px;background:hsl(225,20%,10%);border:1.5px solid hsl(150,80%,40%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px hsla(150,80%,40%,0.3);cursor:pointer;" title="${point.name} (${point.subtitle})">
            <span style="color:hsl(150,80%,50%);font-size:7px;font-weight:700;">${point.id}</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([point.lat, point.lng], { icon })
        .addTo(map)
        .bindTooltip(`${point.name}<br/><span style="opacity:0.7">${point.subtitle}</span>`, {
          className: "dark-tooltip",
          direction: "top",
          offset: [0, -14],
        });
      marker.on("click", () => {
        setSelectedGate(point);
        map.flyTo([point.lat, point.lng], 17, { duration: 1.5 });
      });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Draw route lines or zoom when a point is selected
  useEffect(() => {
    routeLayersRef.current.clearLayers();

    if (!selectedGroup || !activeRoute) return;

    let selectedCoord: L.LatLngExpression | null = null;

    if (selectedGroup === "bariyerli") {
      // It's a Toll Gate
      const gate = tollGates.find(g => g.id === activeRoute);
      if (gate) {
        selectedCoord = [gate.lat, gate.lng];

        // Just fly to the gate (no route lines needed for individual gates)
        if (mapInstance.current) {
          mapInstance.current.flyTo(selectedCoord, 15, { duration: 1.5 });
        }
        setSelectedGate(gate);
      }
    } else if (selectedGroup === "serbest") {
      // It's a Passage Point in a group
      const point = passagePoints.find(p => p.id === activeRoute);
      if (point) {
        selectedCoord = [point.lat, point.lng];

        const isAnkara = activeRoute.endsWith("A");
        const color = peakHourMode ? "#ef4444" : isAnkara ? "#00d4ff" : "#ff6b35";
        const glowColor = peakHourMode ? "#ef444460" : isAnkara ? "#00d4ff50" : "#ff6b3550";

        // Find nearby toll gates sorted by distance
        const sortedGates = [...tollGates]
          .map(g => ({
            ...g,
            dist: Math.sqrt(Math.pow(g.lat - point.lat, 2) + Math.pow(g.lng - point.lng, 2)),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4);

        const routeCoords: [number, number][] = [
          [point.lat, point.lng],
          ...sortedGates.map(g => [g.lat, g.lng] as [number, number]),
        ];

        // Glow
        L.polyline(routeCoords, {
          color: glowColor,
          weight: 12,
          opacity: 0.4,
          lineCap: "round",
        }).addTo(routeLayersRef.current);

        // Main line
        L.polyline(routeCoords, {
          color,
          weight: 4,
          opacity: 0.9,
          lineCap: "round",
          dashArray: "12 8",
          className: "route-flow-animation",
        }).addTo(routeLayersRef.current);

        // Fit bounds for passage point routes
        if (mapInstance.current) {
          mapInstance.current.flyTo(selectedCoord, 17, { duration: 1.5 });
        }
        setSelectedGate(point);
      }
    }
  }, [activeRoute, peakHourMode, selectedGroup]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-[500]">
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Canlı Harita
          </span>
        </div>
      </div>

      {/* Peak hour */}
      {peakHourMode && (
        <div className="absolute top-4 left-4 z-[500]">
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-2 border border-destructive/30" style={{ boxShadow: "0 0 15px rgba(239,68,68,0.2)" }}>
            <div className="w-2 h-2 rounded-full status-slow animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-destructive font-medium">
              Yoğun Saat Simülasyonu Aktif
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[500]">
        <div className="glass rounded-lg p-3 space-y-2">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Gösterge</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "#ef4444", background: "hsl(225,20%,10%)" }} />
            <span className="text-[10px] text-foreground">Gişeler (Bariyerli Geçiş)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "#a855f7", background: "hsl(225,20%,10%)" }} />
            <span className="text-[10px] text-foreground">Ağaçlı Gişesi G3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md border-[1.5px]" style={{ borderColor: "hsl(150,80%,40%)", background: "hsl(225,20%,10%)" }} />
            <span className="text-[10px] text-foreground">Serbest Geçiş</span>
          </div>
        </div>
      </div>

      <TollGateCard gate={selectedGate} onClose={() => setSelectedGate(null)} />

      <style>{`
        .dark-tooltip {
          background: hsl(225, 20%, 10%) !important;
          color: hsl(40, 20%, 85%) !important;
          border: 1px solid hsl(225, 15%, 20%) !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .dark-tooltip::before {
          border-top-color: hsl(225, 15%, 20%) !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;
