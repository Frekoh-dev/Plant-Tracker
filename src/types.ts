export interface Plant {
  id: number;
  name: string;
  stage: PlantStage;
  imageUrl?: string;
  lastWatered?: string;
  harvestedAmount?: number;
  seedDate: string | null
  seedlingDate: string | null
  vegetativeDate: string | null
  floweringDate: string | null
  ripeningDate: string | null
  protocol: ProtocolEntry[];
}

export type PlantStage = "seedling" | "vegetative" | "bloom"

export interface ProtocolEntry {
  id?: number;
  date: string;
  action: string;
}

export interface GalleryImage {
  id: number
  url: string
  plantId: number
}

export interface ProtocolEntry {
  id: number
  plantId: number
  title: string
  description: string
  tasks: string[]
}