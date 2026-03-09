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
  const [mapStyle, setMapStyle] = useState<'dark' | 'light' | 'satellite'>('dark');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const mapStyles = {
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [41.12, 29.05],
      zoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    // Initial tile layer
    tileLayerRef.current = L.tileLayer(mapStyles[mapStyle].url, {
      attribution: mapStyles[mapStyle].attribution,
      maxZoom: 19,
    }).addTo(map);

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

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapInstance.current) return;

    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(mapStyles[mapStyle].url, {
      attribution: mapStyles[mapStyle].attribution,
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, [mapStyle]);

  // Draw route lines or zoom when a point is selected
  useEffect(() => {
    routeLayersRef.current.clearLayers();

    if (!selectedGroup || !activeRoute) return;

    let selectedCoord: L.LatLngExpression | null = null;
    let pointData: TollGate | PassagePoint | undefined = undefined;
    let isAnkara = false;

    if (selectedGroup === "bariyerli") {
      pointData = tollGates.find(g => g.id === activeRoute);
    } else if (selectedGroup === "serbest") {
      pointData = passagePoints.find(p => p.id === activeRoute);
      isAnkara = activeRoute.endsWith("A");
    }

    if (pointData) {
      selectedCoord = [pointData.lat, pointData.lng];

      // Just fly to the selected point
      if (mapInstance.current) {
        // Zoom slightly closer for passages to see interchanges but keep overview for toll gates
        const zoomLevel = selectedGroup === "serbest" ? 17 : 15;
        mapInstance.current.flyTo(selectedCoord, zoomLevel, { duration: 1.5 });
      }
      setSelectedGate(pointData);
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

      {/* Map Style Selector */}
      <div className="absolute top-16 left-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => setMapStyle('dark')}
          className={`glass rounded-lg w-10 h-10 flex items-center justify-center transition-all ${mapStyle === 'dark' ? 'border-primary border-2 shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'hover:bg-white/10'}`}
          title="Koyu Mod"
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/20" />
        </button>
        <button
          onClick={() => setMapStyle('light')}
          className={`glass rounded-lg w-10 h-10 flex items-center justify-center transition-all ${mapStyle === 'light' ? 'border-primary border-2 shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'hover:bg-white/10'}`}
          title="Açık Mod"
        >
          <div className="w-5 h-5 rounded-full bg-slate-200 border border-black/10" />
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`glass rounded-lg w-10 h-10 flex items-center justify-center transition-all ${mapStyle === 'satellite' ? 'border-primary border-2 shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'hover:bg-white/10'}`}
          title="Uydu"
        >
          <div className="w-5 h-5 rounded-lg bg-[url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/381/617')] bg-cover border border-white/20" />
        </button>
      </div>

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
