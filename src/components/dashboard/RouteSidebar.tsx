import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Route,
  MapPin,
  ChevronRight,
  Zap,
  Activity,
  Settings,
  ToggleLeft,
  ToggleRight,
  List,
  Search,
  Calculator
} from "lucide-react";
import { passagePoints, tollGates } from "@/data/mapData";

interface RouteSidebarProps {
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  activeRoute: string | null;
  setActiveRoute: (route: string | null) => void;
  peakHourMode: boolean;
  setPeakHourMode: (mode: boolean) => void;
  onPointSelect?: (lat: number, lng: number) => void; // Added for map zoom
}

// Group passage points by their group
const passageGroups = Array.from(new Set(passagePoints.map(p => p.group)));

const RouteSidebar = ({
  selectedGroup,
  setSelectedGroup,
  activeRoute,
  setActiveRoute,
  peakHourMode,
  setPeakHourMode,
  onPointSelect
}: RouteSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handlePointClick = (id: string, lat: number, lng: number) => {
    setActiveRoute(activeRoute === id ? null : id);
    if (activeRoute !== id && onPointSelect) {
      onPointSelect(lat, lng);
    }
  };

  return (
    <div className="w-[320px] h-full glass-strong flex flex-col overflow-hidden border-r border-glass">
      {/* Header */}
      <div className="p-5 border-b border-glass">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 flex items-center justify-center">
            {/* The user will need to put ica-logo.png in the public folder */}
            <img src="/logo_disi.png" alt="ICA" className="h-full w-auto object-contain drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-wide">Güzergah Yönetimi</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Kuzey Marmara Otoyolu</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ara (Örn: S1A, G1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/30 border border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
          />
        </div>

        {searchQuery.trim().length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">Arama Sonuçları</p>
            {tollGates.filter(g => g.id.toLowerCase().includes(searchQuery.toLowerCase()) || g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(gate => {
              const isActive = activeRoute === gate.id;
              const isPurple = gate.id === "G3";
              const colorClass = isPurple ? "text-purple-500" : "text-destructive";
              const bgClass = isPurple ? "bg-purple-500/10 border-purple-500/40" : "bg-destructive/10 border-destructive/40";

              return (
                <button
                  key={gate.id}
                  onClick={() => {
                    setSelectedGroup("bariyerli");
                    handlePointClick(gate.id, gate.lat, gate.lng);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-all ${isActive ? `${bgClass} border glow-destructive` : "hover:bg-secondary/40"}`}
                >
                  <span className={`text-xs font-semibold ${isActive ? colorClass : "text-foreground"}`}>{gate.id} - {gate.name}</span>
                  <MapPin className={`w-3 h-3 ${isActive ? colorClass : "text-muted-foreground"}`} />
                </button>
              );
            })}

            {passagePoints.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())).map(point => {
              const isActive = activeRoute === point.id;
              const isAnkara = point.id.endsWith("A");

              return (
                <button
                  key={point.id}
                  onClick={() => {
                    setSelectedGroup("serbest");
                    handlePointClick(point.id, point.lat, point.lng);
                  }}
                  className={`w-full text-left p-2 rounded-lg flex flex-col gap-1 transition-all ${isActive ? (isAnkara ? "bg-accent/10 border border-accent/40 glow-cyan" : "bg-destructive/10 border border-destructive/40") : "hover:bg-secondary/40 border border-transparent"}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-semibold ${isActive ? (isAnkara ? "text-neon-cyan" : "text-destructive") : "text-foreground"}`}>{point.id}</span>
                    <Zap className={`w-3 h-3 ${isActive ? (isAnkara ? "text-neon-cyan" : "text-destructive") : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{point.subtitle} - {point.name}</span>
                </button>
              );
            })}

            {tollGates.filter(g => g.id.toLowerCase().includes(searchQuery.toLowerCase()) || g.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && passagePoints.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">Sonuç bulunamadı.</div>
            )}
          </div>
        ) : (
          <>
            {/* CATEGORY 1: Bariyerli Geçişler (Toll Gates) */}
            <div>
              <button
                onClick={() => {
                  setSelectedGroup(selectedGroup === "bariyerli" ? null : "bariyerli");
                  setActiveRoute(null);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${selectedGroup === "bariyerli"
                  ? "glass glow-gold border border-primary/30"
                  : "hover:bg-secondary/50 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                    <List className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Gişeler</p>
                    <p className="text-[10px] text-muted-foreground">Bariyerli Geçişler</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedGroup === "bariyerli" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
              </button>

              {/* Toll Gates List */}
              {selectedGroup === "bariyerli" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 pl-4 pr-1 space-y-1.5 border-l-2 border-glass ml-4">
                  {tollGates.map((gate) => {
                    const isActive = activeRoute === gate.id;
                    const isPurple = gate.id === "G3";
                    const colorClass = isPurple ? "text-purple-500" : "text-destructive";
                    const bgClass = isPurple ? "bg-purple-500/10 border-purple-500/40" : "bg-destructive/10 border-destructive/40";

                    return (
                      <button
                        key={gate.id}
                        onClick={() => handlePointClick(gate.id, gate.lat, gate.lng)}
                        className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-all ${isActive ? `${bgClass} border glow-destructive` : "hover:bg-secondary/40"
                          }`}
                      >
                        <span className={`text-xs font-semibold ${isActive ? colorClass : "text-foreground"}`}>{gate.id} - {gate.name}</span>
                        <MapPin className={`w-3 h-3 ${isActive ? colorClass : "text-muted-foreground"}`} />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* CATEGORY 2: Serbest Geçiş Alanları (Passage Points) */}
            <div>
              <button
                onClick={() => {
                  setSelectedGroup(selectedGroup === "serbest" ? null : "serbest");
                  setActiveRoute(null);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${selectedGroup === "serbest"
                  ? "glass glow-gold border border-primary/30"
                  : "hover:bg-secondary/50 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <Route className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Gişesiz Geçiş Alanları</p>
                    <p className="text-[10px] text-muted-foreground">(OGS-HGS)</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedGroup === "serbest" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
              </button>

              {/* Passage Points Groups List */}
              {selectedGroup === "serbest" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 pl-4 pr-1 space-y-3 border-l-2 border-glass ml-4">
                  {passageGroups.map((groupName) => {
                    const pts = passagePoints.filter(p => p.group === groupName);
                    return (
                      <div key={groupName} className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{groupName}</p>
                        {pts.map((point) => {
                          const isActive = activeRoute === point.id;
                          const isAnkara = point.id.endsWith("A");

                          return (
                            <button
                              key={point.id}
                              onClick={() => handlePointClick(point.id, point.lat, point.lng)}
                              className={`w-full text-left p-2 rounded-lg flex flex-col gap-1 transition-all ${isActive
                                ? isAnkara
                                  ? "bg-accent/10 border border-accent/40 glow-cyan"
                                  : "bg-destructive/10 border border-destructive/40"
                                : "hover:bg-secondary/40 border border-transparent"
                                }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-semibold ${isActive ? (isAnkara ? "text-neon-cyan" : "text-destructive") : "text-foreground"}`}>
                                  {point.id}
                                </span>
                                <Zap className={`w-3 h-3 ${isActive ? (isAnkara ? "text-neon-cyan" : "text-destructive") : "text-muted-foreground"}`} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{point.subtitle}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-glass space-y-3">
        {/* Ücret Hesapla Butonu */}
        <button
          onClick={() => navigate("/toll-calculator")}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all
            bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-500/50
            group"
        >
          <div className="p-1.5 bg-amber-500/20 rounded border border-amber-500/30 group-hover:bg-amber-500/30 transition-colors">
            <Calculator className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-amber-300">Ücret Hesapla</p>
            <p className="text-[10px] text-muted-foreground">Geçiş ücreti hesaplama aracı</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400/60 ml-auto group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Settings className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Kuzey Marmara
          </span>
        </div>
      </div>
    </div>
  );
};

export default RouteSidebar;
