export interface TollGate {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: "active" | "maintenance" | "slow";
  technicalId: string;
  direction: string;
  laneCount: number;
  region: "Avrupa Tarafı" | "Asya Tarafı";
  customLaneText?: string;
}

export interface PassagePoint {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  group: string;
  region: "Avrupa Tarafı" | "Asya Tarafı";
}
