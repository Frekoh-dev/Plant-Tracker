export interface Plant {
  id: number;
  name: string;
  species: string | null;
  stage: PlantStage;
  imageUrl?: string;
  lastWatered: string | null;
  harvestedAmount?: number;
  seedDate: string | null;
  seedlingDate: string | null;
  vegetativeDate: string | null;
  floweringDate: string | null;
  ripeningDate: string | null;
  protocolEntries: ProtocolEntry[];
  isHarvested: boolean;
}

export type PlantStage = "SEED" | "SEEDLING" | "VEGETATIVE" | "FLOWERING" | "RIPENING";

export interface ProtocolEntry {
  id: number;
  plantId: number;
  action: string;
  title: string;
  description: string;
  tasks: string[];
  createdAt: string;
}

export interface GalleryImage {
  id: number;
  url: string;
  plantId: number;
}

export type Protocol = ProtocolEntry[];