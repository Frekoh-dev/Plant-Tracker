import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plant, GalleryImage } from "../types"
import { fetchGalleryImages } from "../api"
import { useToast } from "@/components/ui/use-toast"
import GalleryUploadDialog from "./GalleryUploadDialog"

interface GalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: Plant
}

export default function GalleryDialog({ open, onOpenChange, plant }: GalleryDialogProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchGalleryImages(plant.id)
        .then(setGalleryImages)
        .catch(error => {
          console.error('Error fetching gallery images:', error)
          toast({
            title: "Error",
            description: "Failed to fetch gallery images. Please try again.",
            variant: "destructive",
          })
        })
    }
  }, [open, plant.id, toast])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Plant Gallery</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={`Gallery image ${image.id}`}
                className="w-full h-48 object-cover rounded-md"
              />
            ))}
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>Add Image</Button>
        </DialogContent>
      </Dialog>
      <GalleryUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        plant={plant}
        setGalleryImages={setGalleryImages}
      />
    </>
  )
}