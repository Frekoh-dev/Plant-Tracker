import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plant } from "../types"
import { harvestPlant } from "../api"

interface HarvestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: Plant
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function HarvestDialog({ open, onOpenChange, plant, setPlants }: HarvestDialogProps) {
  const { toast } = useToast()
  const [harvestAmount, setHarvestAmount] = useState<string>("")

  const handleHarvest = async () => {
    if (harvestAmount) {
      try {
        const updatedPlant = await harvestPlant(plant.id, parseFloat(harvestAmount))
        setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p))
        onOpenChange(false)
        setHarvestAmount("")
        toast({
          title: "Success",
          description: "Plant harvested successfully",
        })
      } catch (error) {
        console.error('Error harvesting plant:', error)
        toast({
          title: "Error",
          description: "Failed to harvest plant. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Harvest Plant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="harvestAmount" className="text-right">
              Amount (g)
            </Label>
            <Input
              id="harvestAmount"
              type="number"
              value={harvestAmount}
              onChange={(e) => setHarvestAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleHarvest} disabled={!harvestAmount}>Harvest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}