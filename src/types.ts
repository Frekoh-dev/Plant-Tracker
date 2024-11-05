export interface Plant {
  id: number;
  name: string;
  species: string | null;
  stage: PlantStage;
  imageUrl?: string;
  lastWatered: Date | null;
  harvestedAmount?: number;
  seedDate: Date | null;
  seedlingDate: Date | null;
  vegetativeDate: Date | null;
  floweringDate: Date | null;
  ripeningDate: Date | null;
  protocolEntries: ProtocolEntry[];
  isHarvested: boolean;
}

export type PlantStage = "SEED" | "SEEDLING" | "VEGETATIVE" | "FLOWERING" | "RIPENING" | "HARVESTED";

export interface ProtocolEntry {
  id: number;
  plantId: number;
  action: string;
  title: string;
  description: string;
  tasks: string[];
  createdAt: Date;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  plantId: number;
  createdAt: Date;
  updatedAt: Date;
  width?: number;  // Add this line
  height?: number; // Add this line
}

export type Protocol = ProtocolEntry[];