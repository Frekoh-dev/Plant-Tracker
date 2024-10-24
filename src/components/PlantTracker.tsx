import { useState, useEffect } from "react"
import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Plant } from "../types"
import { fetchPlants } from "../api"
import PlantItem from "./PlantItem"
import AddPlantDialog from "./AddPlantDialog"
import { useToast } from "@/components/ui/use-toast"

export default function PlantTracker() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const fetchedPlants = await fetchPlants()
        setPlants(fetchedPlants)
      } catch (error) {
        console.error('Error fetching plants:', error)
        toast({
          title: "Error",
          description: "Failed to load plants. Please try again.",
          variant: "destructive",
        })
      }
    }

    loadPlants()
  }, [toast])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plant Tracker</h1>
      <Button onClick={() => setAddPlantDialogOpen(true)} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> Add Plant
      </Button>
      <Accordion type="single" collapsible className="w-full">
        {plants.map((plant) => (
          <PlantItem key={plant.id} plant={plant} setPlants={setPlants} />
        ))}
      </Accordion>
      <AddPlantDialog
        open={addPlantDialogOpen}
        onOpenChange={setAddPlantDialogOpen}
        setPlants={setPlants}
      />
    </div>
  )
}