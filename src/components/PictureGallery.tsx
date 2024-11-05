'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, X, Loader2, ZoomIn } from 'lucide-react'

interface PictureGalleryProps {
  plantId: number
  isOpen: boolean
  onClose: () => void
}

interface PlantImage {
  id: number
  thumbnailUrl: string
}

interface FullSizeImage extends PlantImage {
  imageUrl: string
}

export function PictureGallery({ plantId, isOpen, onClose }: PictureGalleryProps) {
  const [images, setImages] = useState<PlantImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null)
  const [isLoadingFullSize, setIsLoadingFullSize] = useState(false)
  const [isFullSizeDialogOpen, setIsFullSizeDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchImages = useCallback(async () => {
    if (!isOpen) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/plants/${plantId}/images?thumbnailsOnly=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      const data = await response.json()
      setImages(data)
    } catch (error) {
      console.error('Error fetching images:', error)
      toast({
        title: "Error",
        description: "Failed to fetch images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [plantId, isOpen, toast])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleImageUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/plants/${plantId}/images`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const newImage = await response.json()
      setImages(prevImages => [...prevImages, newImage])
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setPreviewImage(null)
      setSelectedFile(null)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/plants/${plantId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setImages(prevImages => prevImages.filter(img => img.id !== imageId))
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreviewImage(previewUrl)
    }
  }

  const handleImageClick = async (imageId: number) => {
    setIsFullSizeDialogOpen(true)
    setIsLoadingFullSize(true)
    setFullSizeImage(null)
    try {
      console.log(`Fetching image with ID: ${imageId} for plant ID: ${plantId}`)
      const response = await fetch(`/api/plants/${plantId}/images/${imageId}`)
      console.log(`Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error response body: ${errorText}`)
        throw new Error(`Failed to fetch full size image: ${response.statusText}`)
      }
      
      const data: FullSizeImage = await response.json()
      console.log(`Received data:`, data)
      
      if (!data.imageUrl) {
        throw new Error('Image URL is missing from the response')
      }
      setFullSizeImage(data.imageUrl)
    } catch (error) {
      console.error('Error fetching full size image:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load full size image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFullSize(false)
    }
  }

  const handleCloseFullSizeDialog = () => {
    setIsFullSizeDialogOpen(false)
    setFullSizeImage(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Picture Gallery for Plant {plantId}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <Image
                    src={image.thumbnailUrl}
                    alt={`Plant image ${image.id}`}
                    width={100}
                    height={100}
                    className="w-full h-[100px] object-cover rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(image.id)}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageClick(image.id)}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Preview"
                  width={300}
                  height={300}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Pencil className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {isUploading ? 'Uploading...' : 'Upload a new image'}
                  </span>
                </div>
              )}
            </div>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </Label>
          {previewImage && (
            <Button
              onClick={handleImageUpload}
              disabled={isUploading}
              className="mt-2"
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          )}
        </div>
      </DialogContent>
      <Dialog open={isFullSizeDialogOpen} onOpenChange={handleCloseFullSizeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative w-full h-full" style={{ minHeight: '60vh' }}>
            {isLoadingFullSize ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : fullSizeImage ? (
              <Image
                src={fullSizeImage}
                alt="Full size image"
                fill
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p>Failed to load image</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}