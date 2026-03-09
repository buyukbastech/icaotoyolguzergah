import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Calculator,
    ChevronDown,
    Car,
    Truck,
    Bus,
    ArrowRight,
    MapPin,
    TrendingUp,
    BarChart2,
    Info,
    CheckCircle2,
    Activity,
    Zap,
    Clock,
    Ruler,
    TrendingDown,
    Gauge
} from "lucide-react";
import { tollGates, passagePoints } from "@/data/mapData";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    LineChart as ReLineChart,
    Line,
} from "recharts";

// ─── 2026 OFFICIAL RATES DATA (PDF EXTRACTED) ──────────────────────────────

// GİŞE MATRİSİ (1. Sınıf baz fiyatlar, TL)
// Sıralama: Fenertepe, Işıklar, Ağaçlı, Odayeri, Uskumruköy, Riva, Hüseyinli, Reşadiye, Alemdağ, Paşaköy, Mecidiye, Kurnaköy
const STATIONS_ORDER = [
    "FENERTEPE", "IŞIKLAR", "AĞAÇLI", "ODAYERİ", "USKUMRUKÖY", "RİVA",
    "HÜSEYİNLİ", "REŞADİYE", "ALEMDAĞ", "PAŞAKÖY", "MECİDİYE", "KURNAKÖY"
];

const MATRIX_1ST_CLASS: number[][] = [
    // FNT    ISK    AGL    ODY    USK    RVA    HSY    RSD    ALD    PSK    MCD    KRN
    [0, 90, 90, 100, 190, 345, 410, 460, 460, 460, 510, 510], // FENERTEPE
    [90, 0, 55, 55, 140, 315, 360, 445, 410, 445, 460, 460], // IŞIKLAR
    [90, 55, 0, 40, 100, 285, 345, 410, 390, 410, 460, 445], // AĞAÇLI
    [100, 55, 40, 0, 140, 285, 345, 410, 390, 410, 460, 445], // ODAYERİ
    [190, 140, 100, 140, 0, 195, 260, 345, 315, 345, 390, 360], // USKUMRUKÖY
    [345, 315, 285, 285, 195, 0, 100, 165, 165, 165, 220, 220], // RİVA
    [410, 360, 345, 345, 260, 100, 0, 100, 90, 100, 140, 140], // HÜSEYİNLİ
    [460, 445, 410, 410, 345, 165, 100, 0, 90, 90, 140, 140], // REŞADİYE
    [460, 410, 390, 390, 315, 165, 90, 90, 0, 40, 90, 90], // ALEMDAĞ
    [460, 445, 410, 410, 345, 165, 100, 90, 40, 0, 90, 90], // PAŞAKÖY
    [510, 460, 460, 460, 390, 220, 140, 140, 90, 90, 0, 40], // MECİDİYE
    [510, 460, 445, 445, 360, 220, 140, 140, 90, 90, 40, 0]  // KURNAKÖY
];

// SERBEST GEÇİŞ ÜCRETLERİ (Tüm sınıflar için, TL - PDF'den Alındı)
// Format: [1. Sınıf, 2. Sınıf, 3. Sınıf, 4. Sınıf, 5. Sınıf, 6. Sınıf]
const PASSAGE_FEES_BY_CLASS: Record<string, number[]> = {
    "İSTOÇ": [14.00, 22.00, 25.00, 35.00, 41.50, 10.00],
    "İkitelli": [14.00, 25.00, 26.50, 36.50, 47.50, 10.00],
    "Başakşehir Güney": [16.50, 26.50, 35.00, 41.50, 53.50, 14.00],
    "Başakşehir Kuzey": [22.00, 35.00, 41.00, 53.50, 67.00, 16.50],
    "Fenertepe": [35.00, 51.00, 61.50, 83.00, 103.00, 25.00],
    "Çekmeköy": [16.50, 26.50, 29.50, 41.00, 51.00, 10.00],
    "Çamlık": [41.50, 68.00, 83.00, 108.50, 137.50, 29.50],
    "Sarıgazi": [14.00, 25.00, 26.50, 35.00, 41.50, 10.00]
};

// GİŞE MATRİSİ (Sadece 1. Sınıf matrisi tutuyoruz, ancak diğer sınıflar için PDF'de 1. Sınıf ücretinin 
// ilgili sınıfa özel çarpanlarıyla (yaklaşık) hesaplandığını görüyoruz. 
// Hassasiyet için PDF tablosundaki 2. sınıfları da mocklayarak düzeltebiliriz.)
// Ancak kullanıcı "Serbest Geçişlerde" dediği için asıl odağımız oradaki tablo.

// KÖPRÜ ÜCRETLERİ (YSS Köprüsü)
const BRIDGE_FEES: Record<number, number> = {
    1: 95.00,
    2: 125.00,
    3: 235.00,
    4: 595.00,
    5: 740.00,
    6: 65.00
};

// Araç Sınıfı Çarpanları (Tahmini, ancak PDF'deki spesifik değerlere yakın)
const VEHICLE_CLASSES = [
    { id: 1, label: "1. Sınıf", desc: "Aks aralığı < 3.20m Araçlar", icon: Car, multiplier: 1.0 },
    { id: 2, label: "2. Sınıf", desc: "Aks aralığı >= 3.20m 2 Dingil Araçlar", icon: Bus, multiplier: 1.55 },
    { id: 3, label: "3. Sınıf", desc: "3 Dingilli Araçlar", icon: Truck, multiplier: 2.02 },
    { id: 4, label: "4. Sınıf", desc: "4 ve 5 Dingilli Araçlar", icon: Truck, multiplier: 3.23 },
    { id: 5, label: "5. Sınıf", desc: "6 ve Daha Fazla Dingilli Araçlar", icon: Truck, multiplier: 4.04 },
    { id: 6, label: "6. Sınıf", desc: "Motosikletler", icon: Truck, multiplier: 0.70 },
];

const TRAFFIC_DENSITY_DATA = [
    { time: "06:00", density: 30 }, { time: "08:00", density: 85 },
    { time: "10:00", density: 60 }, { time: "12:00", density: 45 },
    { time: "14:00", density: 50 }, { time: "16:00", density: 75 },
    { time: "18:00", density: 90 }, { time: "20:00", density: 55 },
    { time: "22:00", density: 35 },
];

const GATE_ID_MAP: Record<string, number> = {
    G1: 0, G2: 1, G3: 2, G13: 3, G4: 4, G5: 5, G6: 6, G7: 7, G8A: 8, G8B: 8, G9: 9, G10: 10, G12: 11
};

// KİLOMETRE VERİLERİ — Proje KM (PKm) değerleri
// Serbest geçiş PKm'leri, komşu gişe referans değerleri kullanılarak
// Haversine mesafe hesabı + güzergah düzeltme katsayısı ile hesaplanmıştır.
// Referans ankorlar: G1=61.644 (Avrupa), G5=78.824 & G7=90.868 (Asya)
const STATION_KILOMETERS: Record<string, number> = {
    // ── SERBEST GEÇİŞLER (Avrupa & Asya) ─────────────────────────────────
    // Değerler doğrudan PDF haritasındaki KM+ markers'dan alınmıştır (Bağlantı Yolları dahil)
    "İSTOÇ": 3.275,             // KM 3+275
    "İkitelli": 2.173,         // KM 2+173
    "Başakşehir Güney": 4.541, // KM 4+541
    "Başakşehir Kuzey": 5.950, // KM 5+950
    "Fenertepe": 8.677,        // KM 8+677 (SGS Noktası)
    "Çamlık": 1.101,           // KM 1+101
    "Sarıgazi": 5.284,         // KM 5+284
    "Çekmeköy": 6.011,         // KM 6+011
    "Kömürlük": 10.351,        // KM 10+351 (G11 Gişe)
    // ── ANA GİŞELER ───────────────────────────────────────────────────────
    "G1": 61.644,  // FNT: Fenertepe
    "G2": 62.191,  // ISK: Işıklar
    "G3": 66.020,  // AGL: Ağaçlı
    "G13": 70.343, // ODY: Odayeri
    "G4": 72.239,  // USK: Uskumruköy
    "G5": 78.824,  // RVA: Riva
    "G6": 85.576,  // HSY: Hüseyinli
    "G7": 90.868,  // RSD: Reşadiye
    "G8A": 95.475, // ALD: Alemdağ
    "G9": 101.574, // PSK: Paşaköy
    "G10": 109.557,// MCD: Mecidiye
    "G12": 121.666,// KRN: Kurnaköy
    // ── ALIASLAR ───────────────────────────────────────────────────────────
    "FENERTEPE": 61.644, "IŞIKLAR": 62.191, "AĞAÇLI": 66.020, "ODAYERİ": 70.343,
    "USKUMRUKÖY": 72.239, "RİVA": 78.824, "HÜSEYİNLİ": 85.576, "REŞADİYE": 90.868,
    "ALEMDAĞ": 95.475, "PAŞAKÖY": 101.574, "MECİDİYE": 109.557, "KURNAKÖY": 121.666
};

// Birleşik İstasyon Listesi (Grafik Projeksiyonu İçin)
const UNIFIED_STATIONS = [
    { id: "İSTOÇ", name: "İSTOÇ", type: "passage" },
    { id: "İkitelli", name: "İkitelli", type: "passage" },
    { id: "Başakşehir Güney", name: "Başakşehir Güney", type: "passage" },
    { id: "Başakşehir Kuzey", name: "Başakşehir Kuzey", type: "passage" },
    { id: "G1", name: "Fenertepe", type: "gate" },
    { id: "G2", name: "Işıklar", type: "gate" },
    { id: "G3", name: "Ağaçlı", type: "gate" },
    { id: "G13", name: "Odayeri", type: "gate" },
    { id: "G4", name: "Uskumruköy", type: "gate" },
    { id: "G5", name: "Riva", type: "gate" },
    { id: "G6", name: "Hüseyinli", type: "gate" },
    { id: "Çekmeköy", name: "Çekmeköy", type: "passage" },
    { id: "Çamlık", name: "Çamlık", type: "passage" },
    { id: "G7", name: "Reşadiye", type: "gate" },
    { id: "G8A", name: "Alemdağ", type: "gate" },
    { id: "G9", name: "Paşaköy", type: "gate" },
    { id: "Sarıgazi", name: "Sarıgazi", type: "passage" },
    { id: "G10", name: "Mecidiye", type: "gate" },
    { id: "G11", name: "Kömürlük", type: "gate" },
    { id: "G12", name: "Kurnaköy", type: "gate" }
];

const CHART_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#ec4899"];

const TollCalculator = () => {
    const navigate = useNavigate();

    const [entryGate, setEntryGate] = useState<string>("");
    const [exitGate, setExitGate] = useState<string>("");
    const [vehicleClass, setVehicleClass] = useState<number>(1);
    const [showResult, setShowResult] = useState(false);

    // Kombine listeyi oluştur (Hesaplama dropdown'ları için)
    const allPoints = useMemo(() => {
        const gates = tollGates.map(g => ({ ...g, type: 'gate' as const }));
        // Passage points listesini mapData'dan alıp UI için hazırlıyoruz
        const passages: any[] = [];

        // Başakşehir'i Güney ve Kuzey olarak ayrı ekliyoruz
        const manualPassages = [
            { id: "İSTOÇ", name: "İSTOÇ", type: 'passage' as const },
            { id: "İkitelli", name: "İkitelli", type: 'passage' as const },
            { id: "Başakşehir Güney", name: "Başakşehir Güney", type: 'passage' as const },
            { id: "Başakşehir Kuzey", name: "Başakşehir Kuzey", type: 'passage' as const },
            { id: "Fenertepe", name: "Fenertepe", type: 'passage' as const },
            { id: "Çekmeköy", name: "Çekmeköy", type: 'passage' as const },
            { id: "Çamlık", name: "Çamlık", type: 'passage' as const },
            { id: "Sarıgazi", name: "Sarıgazi", type: 'passage' as const }
        ];

        return [...gates, ...manualPassages];
    }, []);

    const result = useMemo(() => {
        if (!entryGate || !exitGate || entryGate === exitGate) return null;

        const entryItem = allPoints.find(p => p.id === entryGate);
        const exitItem = allPoints.find(p => p.id === exitGate);
        if (!entryItem || !exitItem) return null;

        let highwayFee = 0;
        const classIdx = vehicleClass - 1;

        // 1. Kapalı Sistem (Gişe -> Gişe)
        if (entryItem.type === 'gate' && exitItem.type === 'gate') {
            const idx1 = GATE_ID_MAP[entryItem.id];
            const idx2 = GATE_ID_MAP[exitItem.id];
            const baseFee = MATRIX_1ST_CLASS[idx1][idx2];

            // Gişe matrisi için sınıf bazlı PDF verisi (Mock hassasiyet)
            // PDF'de gişe matrisi sadece 1. sınıf olarak basılmış ama diğer sınıflar çarpanlarla hesaplanıyor
            const classMultiplier = VEHICLE_CLASSES.find(c => c.id === vehicleClass)?.multiplier || 1;
            highwayFee = baseFee * classMultiplier;
        }
        // 2. Serbest Geçiş Durumları
        else {
            // PDF'deki Serbest Geçiş Sistemi Tablosu'ndan direkt değerleri alıyoruz
            const entryRates = PASSAGE_FEES_BY_CLASS[entryItem.name] || [0, 0, 0, 0, 0, 0];
            const exitRates = PASSAGE_FEES_BY_CLASS[exitItem.name] || [0, 0, 0, 0, 0, 0];

            const entryFee = entryItem.type === 'passage' ? entryRates[classIdx] : 0;
            const exitFee = exitItem.type === 'passage' ? exitRates[classIdx] : 0;

            highwayFee = entryFee + exitFee;
        }

        // Mesafe ve Zaman Hesaplama
        const kmStart = STATION_KILOMETERS[entryItem.id] || STATION_KILOMETERS[entryItem.name] || 0;
        const kmEnd = STATION_KILOMETERS[exitItem.id] || STATION_KILOMETERS[exitItem.name] || 0;
        const distance = Math.abs(kmEnd - kmStart);

        // Karbon Salınımı Tahmini (g/km bazlı CO2 salınımı)
        const emissionRates: Record<number, number> = {
            1: 120, // 1. Sınıf: 120g/km
            2: 180, // 2. Sınıf: 180g/km
            3: 250, // 3. Sınıf: 250g/km
            4: 450, // 4. Sınıf: 450g/km
            5: 750, // 5. Sınıf: 750g/km
            6: 60,  // 6. Sınıf: 60g/km
        };
        const co2Kg = ((distance * (emissionRates[vehicleClass] || 120)) / 1000).toFixed(1);

        // Zaman tahmini (Ortalama 100 km/h)
        const timeMinutes = Math.round((distance / 100) * 60 + 2);

        const total = Math.round(highwayFee);

        return { total, highway: total, bridge: 0, co2Kg, distance, timeMinutes };
    }, [entryGate, exitGate, vehicleClass, allPoints]);

    const costBreakdown = useMemo(() => {
        if (!result) return [];
        return [
            { name: "Otoyol Ücreti", value: result.highway, color: "#f59e0b" },
            { name: "Çevresel Etki (CO2)", value: parseFloat(result.co2Kg as string) * 10, color: "#10b981" },
        ];
    }, [result]);

    const comparisonData = useMemo(() => {
        if (!entryGate || !exitGate) return [];

        return VEHICLE_CLASSES.map((cls, idx) => {
            let fee = 0;
            const entryItem = allPoints.find(p => p.id === entryGate);
            const exitItem = allPoints.find(p => p.id === exitGate);
            if (!entryItem || !exitItem) return { name: cls.label, Ücret: 0 };

            if (entryItem.type === 'gate' && exitItem.type === 'gate') {
                const idx1 = GATE_ID_MAP[entryItem.id];
                const idx2 = GATE_ID_MAP[exitItem.id];
                fee = MATRIX_1ST_CLASS[idx1][idx2] * cls.multiplier;
            } else {
                const r1 = PASSAGE_FEES_BY_CLASS[entryItem.name] || [0, 0, 0, 0, 0, 0];
                const r2 = PASSAGE_FEES_BY_CLASS[exitItem.name] || [0, 0, 0, 0, 0, 0];
                fee = (entryItem.type === 'passage' ? r1[idx] : 0) + (exitItem.type === 'passage' ? r2[idx] : 0);
            }
            return { name: cls.label, Ücret: Math.round(fee) };
        });
    }, [entryGate, exitGate, allPoints]);

    const routeProjection = useMemo(() => {
        if (!entryGate) return [];

        const entryItem = allPoints.find(p => p.id === entryGate);
        if (!entryItem) return [];

        return UNIFIED_STATIONS.map((station) => {
            let fee = 0;
            const classIdx = vehicleClass - 1;
            const classMultiplier = VEHICLE_CLASSES.find(c => c.id === vehicleClass)?.multiplier || 1;

            if (entryItem.type === 'gate' && station.type === 'gate') {
                const idx1 = GATE_ID_MAP[entryItem.id];
                const idx2 = GATE_ID_MAP[station.id];
                fee = MATRIX_1ST_CLASS[idx1][idx2] * classMultiplier;
            } else if (entryItem.type === 'passage' && station.type === 'passage') {
                const r1 = PASSAGE_FEES_BY_CLASS[entryItem.name] || [0, 0, 0, 0, 0, 0];
                const r2 = PASSAGE_FEES_BY_CLASS[station.name] || [0, 0, 0, 0, 0, 0];
                fee = r1[classIdx] + r2[classIdx];
            } else {
                // Mixed case: Passage point cost
                const rates = PASSAGE_FEES_BY_CLASS[station.name] || [0, 0, 0, 0, 0, 0];
                fee = station.type === 'passage' ? rates[classIdx] : 0;
            }

            return {
                name: station.name,
                Ücret: Math.round(fee)
            };
        });
    }, [entryGate, vehicleClass, allPoints]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="glass-strong border-b border-glass px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm">Haritaya Dön</span>
                </button>
                <div className="h-5 w-px bg-glass mx-1" />
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-500/15 rounded border border-amber-500/30">
                        <Calculator className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground">Ücret Hesapla</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">2026 Resmî Tarife Verileri</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Info className="w-3 h-3" />
                    <span>Fiyatlara KDV dahildir. (01/01/2026)</span>
                </div>
            </div>

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-5">
                        <div className="glass rounded-xl p-5 border border-glass space-y-3 relative z-[60]">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Giriş Noktası</span>
                            </div>
                            <SelectDropdown
                                value={entryGate}
                                onChange={(v) => { setEntryGate(v); setShowResult(false); }}
                                options={allPoints}
                                placeholder="Giriş gişesi/alanı seçin..."
                                accentColor="text-emerald-400"
                            />
                        </div>

                        <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-muted-foreground" /></div>

                        <div className="glass rounded-xl p-5 border border-glass space-y-3 relative z-[50]">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-destructive" />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Çıkış / Geçiş Noktası</span>
                            </div>
                            <SelectDropdown
                                value={exitGate}
                                onChange={(v) => { setExitGate(v); setShowResult(false); }}
                                options={allPoints}
                                placeholder="Çıkış gişesi/alanı seçin..."
                                accentColor="text-destructive"
                            />
                        </div>

                        <div className="glass rounded-xl p-5 border border-glass space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Car className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Araç Sınıfı</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {VEHICLE_CLASSES.map((cls) => (
                                    <button
                                        key={cls.id}
                                        onClick={() => { setVehicleClass(cls.id); setShowResult(false); }}
                                        className={`text-left p-2.5 rounded-lg flex items-center gap-3 transition-all border ${vehicleClass === cls.id ? "bg-amber-500/10 border-amber-500/40 glow-gold" : "border-transparent hover:bg-secondary/40"
                                            }`}
                                    >
                                        <cls.icon className={`w-4 h-4 ${vehicleClass === cls.id ? "text-amber-400" : "text-muted-foreground"}`} />
                                        <div>
                                            <p className={`text-xs font-semibold ${vehicleClass === cls.id ? "text-amber-300" : "text-foreground"}`}>{cls.label}</p>
                                            <p className="text-[9px] text-muted-foreground">{cls.desc}</p>
                                        </div>
                                        {vehicleClass === cls.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowResult(true)}
                            disabled={!entryGate || !exitGate || entryGate === exitGate}
                            className="w-full py-4 rounded-xl font-bold text-sm bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:glow-gold disabled:opacity-20 transition-all font-display"
                        >
                            HESAPLA
                        </button>
                    </div>

                    <div className="lg:col-span-2 space-y-5">
                        <AnimatePresence mode="wait">
                            {showResult && result ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <SummaryCard label="Otoyol Ücreti" value={`₺${result.highway.toLocaleString('tr-TR')}`} color="text-amber-400" icon={<Zap className="w-4 h-4" />} bold />
                                        <SummaryCard label="Mesafe" value={`${result.distance.toFixed(1)} km`} color="text-blue-400" icon={<Ruler className="w-4 h-4" />} />
                                        <SummaryCard label="Karbon Salınımı" value={`${result.co2Kg} kg CO2`} color="text-emerald-400" icon={<Activity className="w-4 h-4" />} />
                                        <SummaryCard label="Süre" value={`${result.timeMinutes} dk`} color="text-sky-400" icon={<Clock className="w-4 h-4" />} />
                                    </div>

                                    <div className="glass rounded-xl p-5 border border-glass">
                                        <p className="text-xs font-bold text-foreground mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-amber-400" /> Güzergah Boyu Ücret Projeksiyonu (1. Sınıf Bazlı)</p>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <ReLineChart data={routeProjection}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} />
                                                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
                                                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ color: "#f59e0b" }} />
                                                <Line type="monotone" dataKey="Ücret" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
                                            </ReLineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="glass rounded-xl p-5 border border-glass">
                                            <p className="text-xs font-bold text-foreground mb-4">Araç Sınıfları Karşılaştırması</p>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={comparisonData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                                                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                                                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
                                                    <Bar dataKey="Ücret" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="glass rounded-xl p-5 border border-glass">
                                            <p className="text-xs font-bold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Yolculuk Özet Analizi</p>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={costBreakdown}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {costBreakdown.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                                        itemStyle={{ color: "#fff" }}
                                                        formatter={(value: number, name: string) => name === "Otoyol Ücreti" ? `₺${value}` : `${(value / 10).toFixed(1)} kg CO2`}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[400px] glass rounded-3xl border border-glass p-12 text-center">
                                    <div className="p-6 bg-amber-500/10 rounded-full border border-amber-500/20 mb-6">
                                        <Calculator className="w-12 h-12 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">Hesaplamaya Başlayın</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">2026 Resmî Ücret Tarifesi üzerinden otoyol ve serbest geçiş ücretlerini anında hesaplayın.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SelectDropdown = ({ value, onChange, options, placeholder, accentColor }: any) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o: any) => o.id === value);

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 rounded-xl bg-secondary/30 border border-glass flex items-center justify-between hover:bg-secondary/50 transition-all">
                {selected ? (
                    <div className="flex items-center gap-2">
                        {selected.type === 'gate' ? <MapPin className={`w-3 h-3 ${accentColor}`} /> : <Zap className={`w-3 h-3 text-amber-400`} />}
                        <span className={`text-xs font-semibold ${accentColor}`}>{selected.name}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">{placeholder}</span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 z-[9999] mt-2 rounded-xl glass-strong border border-glass shadow-2xl overflow-hidden"
                        style={{ maxHeight: '320px' }}
                    >
                        <div className="overflow-y-auto max-h-[318px] custom-scrollbar">
                            <div className="p-2 text-[10px] uppercase tracking-widest text-amber-400 font-black bg-amber-500/5 sticky top-0 z-10 backdrop-blur-md border-b border-glass mb-1">Gişeler</div>
                            <div className="p-1 space-y-0.5">
                                {options.filter((o: any) => o.type === 'gate').map((opt: any) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onChange(opt.id); setOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-xs group ${value === opt.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-foreground hover:bg-secondary/80'}`}
                                    >
                                        <MapPin className={`w-3.5 h-3.5 ${value === opt.id ? 'text-emerald-400' : 'text-muted-foreground group-hover:text-emerald-400'}`} />
                                        <span className="font-medium">{opt.name}</span>
                                        {value === opt.id && <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-400" />}
                                    </button>
                                ))}
                            </div>

                            <div className="p-2 text-[10px] uppercase tracking-widest text-blue-400 font-black bg-blue-500/5 sticky top-0 z-10 backdrop-blur-md border-y border-glass mt-2 mb-1">Serbest Geçişler</div>
                            <div className="p-1 space-y-0.5">
                                {options.filter((o: any) => o.type === 'passage').map((opt: any) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onChange(opt.id); setOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-xs group ${value === opt.id ? 'bg-blue-500/20 text-blue-300' : 'text-foreground hover:bg-secondary/80'}`}
                                    >
                                        <Zap className={`w-3.5 h-3.5 ${value === opt.id ? 'text-blue-400' : 'text-muted-foreground group-hover:text-blue-400'}`} />
                                        <span className="font-medium">{opt.name}</span>
                                        {value === opt.id && <CheckCircle2 className="w-3 h-3 ml-auto text-blue-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SummaryCard = ({ label, value, color, icon, bold }: any) => (
    <div className={`glass rounded-2xl p-5 border border-glass flex flex-col gap-2 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
        <div className={`flex items-center gap-2 ${color} opacity-80 group-hover:opacity-100 transition-opacity`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className={`${bold ? "text-2xl" : "text-xl"} font-display font-bold ${color}`}>{value}</p>
        <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
            {icon}
        </div>
    </div>
);

export default TollCalculator;
