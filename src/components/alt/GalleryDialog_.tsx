import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Plant } from "../types"
import { fetchGalleryImages, uploadGalleryImage, deleteGalleryImage } from "../api"
import { Trash2 } from "lucide-react"

interface GalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: Plant
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function GalleryDialog({ open, onOpenChange, plant, setPlants }: GalleryDialogProps) {
  const { toast } = useToast()
  const [galleryImages, setGalleryImages] = useState<{ id: number; url: string }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchImages()
    }
  }, [open, plant.id])

  const fetchImages = async () => {
    try {
      const images = await fetchGalleryImages(plant.id)
      console.log('Fetched gallery images:', images)
      setGalleryImages(images)
      setError('')
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      setError('Failed to fetch gallery images. Please try again.')
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0]
        const resizedBlob = await resizeImage(file, 1200, 1200)
        const imageData = await convertToBase64(new File([resizedBlob], file.name, { type: file.type }))
      
        const updatedPlant = await uploadGalleryImage(plant.id, imageData)
        setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p))
      
        // Fetch the latest gallery images after successful upload
        await fetchImages()
      
        setError('')
        toast({
          title: "Success",
          description: "Gallery image uploaded successfully",
        })
      } catch (error) {
        console.error('Error uploading gallery image:', error)
        setError('Failed to upload gallery image. Please try again.')
        toast({
          title: "Error",
          description: "Failed to upload gallery image. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      const updatedPlant = await deleteGalleryImage(plant.id, imageId)
      setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p))
      await fetchImages() // Fetch updated gallery images after deletion
      toast({
        title: "Success",
        description: "Gallery image deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting gallery image:', error)
      setError('Failed to delete gallery image. Please try again.')
      toast({
        title: "Error",
        description: "Failed to delete gallery image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Plant Gallery</DialogTitle>
        </DialogHeader>
        {error && <p className="text-red-500 flex-shrink-0">{error}</p>}
        <div className="overflow-y-auto flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
            {galleryImages && galleryImages.length > 0 ? (
              galleryImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt="Gallery"
                    className="w-full h-40 object-cover rounded-md cursor-pointer"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            ) : (
              <p>No images in the gallery yet.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex-shrink-0">
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleUploadImage}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const scaleFactor = Math.min(1, Math.max(maxWidth / width, maxHeight / height))

        width *= scaleFactor
        height *= scaleFactor

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx!.drawImage(img, 0, 0, width, height)

        const fileType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const quality = fileType === 'image/png' ? 1 : 0.9

        canvas.toBlob((blob) => {
          resolve(blob!)
        }, fileType, quality)
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}