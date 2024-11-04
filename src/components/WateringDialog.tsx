import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Plant } from "../types"
import { waterPlant } from "../api"

interface WateringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: number
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function WateringDialog({ open, onOpenChange, plantId, setPlants }: WateringDialogProps) {
  const { toast } = useToast()

  const handleWater = async (usedFertilizer: boolean) => {
    try {
      await waterPlant(plantId, usedFertilizer)
      setPlants(prevPlants => prevPlants.map(p => 
        p.id === plantId ? { ...p, lastWatered: new Date() } : p
      ))
      onOpenChange(false)
      toast({
        title: "Success",
        description: `Plant watered${usedFertilizer ? ' with fertilizer' : ''}`,
      })
    } catch (error) {
      console.error('Error watering plant:', error)
      toast({
        title: "Error",
        description: "Failed to water plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Water Plant</DialogTitle>
        </DialogHeader>
        <p>Do you want to use fertilizer?</p>
        <DialogFooter>
          <Button onClick={() => handleWater(false)}>No Fertilizer</Button>
          <Button onClick={() => handleWater(true)}>Use Fertilizer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}