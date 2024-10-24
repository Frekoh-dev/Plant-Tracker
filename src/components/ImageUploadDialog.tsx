import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plant } from "../types"
import { uploadPlantImage } from "../api"
import { useToast } from "@/components/ui/use-toast"

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: Plant
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function ImageUploadDialog({ open, onOpenChange, plant, setPlants }: ImageUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    try {
      const updatedPlant = await uploadPlantImage(plant.id, file)
      setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p))
      onOpenChange(false)
      setFile(null)
      toast({
        title: "Success",
        description: "Plant image uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading plant image:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload plant image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Plant Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}