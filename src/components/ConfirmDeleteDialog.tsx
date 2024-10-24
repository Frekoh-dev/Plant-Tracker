import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Plant } from "../types"
import { deletePlant } from "../api"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: Plant
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function ConfirmDeleteDialog({ open, onOpenChange, plant, setPlants }: ConfirmDeleteDialogProps) {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await deletePlant(plant.id)
      setPlants(prevPlants => prevPlants.filter(p => p.id !== plant.id))
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Plant deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting plant:', error)
      toast({
        title: "Error",
        description: "Failed to delete plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete {plant.name}?</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}