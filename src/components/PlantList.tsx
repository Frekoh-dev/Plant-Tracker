import { Accordion } from "@/components/ui/accordion"
import { Plant } from "../types"
import PlantItem from "./PlantItem"

interface PlantListProps {
  plants: Plant[]
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function PlantList({ plants, setPlants }: PlantListProps) {
  return (
    <Accordion type="single" collapsible className="space-y-1">
      {plants.map((plant) => (
        <PlantItem key={plant.id} plant={plant} setPlants={setPlants} />
      ))}
    </Accordion>
  )
}