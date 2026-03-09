import { useState } from "react";
import RouteSidebar from "@/components/dashboard/RouteSidebar";
import MapView from "@/components/dashboard/MapView";

const Index = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [peakHourMode, setPeakHourMode] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <RouteSidebar
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
        peakHourMode={peakHourMode}
        setPeakHourMode={setPeakHourMode}
      />
      <div className="flex-1 relative">
        <MapView
          activeRoute={activeRoute}
          peakHourMode={peakHourMode}
          selectedGroup={selectedGroup}
        />
      </div>
    </div>
  );
};

export default Index;
