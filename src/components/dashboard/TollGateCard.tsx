import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Layers, Activity, Route, Globe, Sun, Cloud, CloudRain, Snowflake, Wind, Thermometer } from "lucide-react";
import { TollGate, PassagePoint } from "@/data/types";

interface TollGateCardProps {
  gate: TollGate | PassagePoint | null;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  active: "Aktif",
  maintenance: "Bakımda",
  slow: "Yavaş",
};

const TollGateCard = ({ gate, onClose }: TollGateCardProps) => {
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    wind: number;
    code: number;
    isDay: number;
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    if (!gate) {
      setWeatherData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingWeather(true);

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${gate.lat}&longitude=${gate.lng}&current=temperature_2m,wind_speed_10m,weather_code,is_day&timezone=Europe%2FIstanbul`);
        const data = await res.json();
        if (isMounted && data.current) {
          setWeatherData({
            temp: data.current.temperature_2m,
            wind: data.current.wind_speed_10m,
            code: data.current.weather_code,
            isDay: data.current.is_day,
          });
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [gate]);

  const getWeatherInfo = (code: number, isDay: number) => {
    if (code === 0) return { text: "Açık", icon: <Sun className="w-3 h-3 text-yellow-400" /> };
    if (code <= 3) return { text: "Bulutlu", icon: <Cloud className="w-3 h-3 text-sky-200" /> };
    if (code <= 48) return { text: "Sisli", icon: <Cloud className="w-3 h-3 text-gray-300" /> };
    if (code <= 67) return { text: "Yağmurlu", icon: <CloudRain className="w-3 h-3 text-blue-400" /> };
    if (code <= 77) return { text: "Karlı", icon: <Snowflake className="w-3 h-3 text-white" /> };
    if (code <= 82) return { text: "Sağanak", icon: <CloudRain className="w-3 h-3 text-blue-500" /> };
    if (code <= 86) return { text: "Kar Sağanağı", icon: <Snowflake className="w-3 h-3 text-blue-200" /> };
    if (code >= 95) return { text: "Fırtına", icon: <CloudRain className="w-3 h-3 text-purple-400" /> };
    return { text: "Bilinmiyor", icon: <Cloud className="w-3 h-3 text-gray-400" /> };
  };

  if (!gate) return null;

  const isTollGate = "laneCount" in gate;

  const technicalId = isTollGate ? (gate as TollGate).technicalId : "Serbest Geçiş Alanı";
  const locationText = isTollGate ? (gate as TollGate).location : (gate as PassagePoint).group;
  const status = isTollGate ? (gate as TollGate).status : "active";

  const regionText = gate.region || "Bilinmiyor";

  let lanesText = "Serbest (OGS-HGS)";
  if (isTollGate) {
    const tollGate = gate as TollGate;
    if (tollGate.customLaneText) {
      lanesText = `${tollGate.customLaneText} (${tollGate.laneCount} Şerit)`;
    } else if (tollGate.direction === "Çift Yön") {
      const half = tollGate.laneCount / 2;
      lanesText = `${half} Gidiş ${half} Geliş (${tollGate.laneCount} Şerit)`;
    } else {
      lanesText = `${tollGate.laneCount} Şerit`;
    }
  }

  const directionText = isTollGate ? (gate as TollGate).direction : (gate as PassagePoint).subtitle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[360px]"
      >
        <div className="glass-strong rounded-xl p-5 glow-gold">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm" style={!isTollGate ? { fontSize: "11px" } : {}}>{gate.id}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{gate.name}</h3>
                <p className="text-muted-foreground text-xs">{technicalId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Konum</span>
              </div>
              <p className="text-xs font-medium text-foreground">{locationText}</p>
            </div>

            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Durum</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === "active" ? "status-active" :
                  status === "maintenance" ? "status-maintenance" : "status-slow"
                  }`} />
                <p className="text-xs font-medium text-foreground">{statusLabels[status] || "Aktif"}</p>
              </div>
            </div>

            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-3 h-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Şerit / Geçiş</span>
              </div>
              <p className="text-xs font-medium text-foreground">{lanesText}</p>
            </div>

            <div className="glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Route className="w-3 h-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Yön</span>
              </div>
              <p className="text-xs font-medium text-foreground">{directionText}</p>
            </div>

            <div className="glass rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Bölge & Hava Durumu</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs font-semibold text-emerald-400">{regionText}</p>

                {isLoadingWeather ? (
                  <div className="text-[10px] text-muted-foreground animate-pulse">Yükleniyor...</div>
                ) : weatherData ? (
                  <div className="flex items-center gap-3 bg-secondary/30 px-2 py-1 rounded">
                    <div className="flex items-center gap-1.5" title="Sıcaklık">
                      <Thermometer className="w-3 h-3 text-rose-400" />
                      <span className="text-[11px] font-medium">{weatherData.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Rüzgar">
                      <Wind className="w-3 h-3 text-sky-400" />
                      <span className="text-[11px] font-medium">{weatherData.wind} km/s</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Durum">
                      {getWeatherInfo(weatherData.code, weatherData.isDay).icon}
                      <span className="text-[11px] font-medium">{getWeatherInfo(weatherData.code, weatherData.isDay).text}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TollGateCard;
