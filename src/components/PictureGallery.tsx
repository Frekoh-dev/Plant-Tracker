'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, X, Loader2, ZoomIn } from 'lucide-react'
import { GalleryImage } from '@/types'

interface PictureGalleryProps {
  plantId: number
  isOpen: boolean
  onClose: () => void
}

export function PictureGallery({ plantId, isOpen, onClose }: PictureGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loadedImages, setLoadedImages] = useState<GalleryImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<GalleryImage | null>(null)
  const [isLoadingFullSize, setIsLoadingFullSize] = useState(false)
  const [isFullSizeDialogOpen, setIsFullSizeDialogOpen] = useState(false)
  const { toast } = useToast()

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  const fetchImages = useCallback(async () => {
    if (!isOpen) return
    setIsLoading(true)
    setLoadedImages([])
    try {
      const response = await fetch(`/api/plants/${plantId}/images?thumbnailsOnly=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      const data: GalleryImage[] = await response.json()
      setImages(data)
      
      // Fetch and load thumbnails one by one
      for (const image of data) {
        try {
          await preloadImage(image.thumbnailUrl)
          setLoadedImages(prev => [...prev, image])
        } catch (error) {
          console.error(`Failed to load thumbnail for image ${image.id}:`, error)
        }
      }
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

      const newImage: GalleryImage = await response.json()
      setImages(prevImages => [...prevImages, newImage])
      setLoadedImages(prevImages => [...prevImages, newImage])
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
      setLoadedImages(prevImages => prevImages.filter(img => img.id !== imageId))
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
      const response = await fetch(`/api/plants/${plantId}/images/${imageId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error response body: ${errorText}`)
        throw new Error(`Failed to fetch full size image: ${response.statusText}`)
      }
      
      const data: GalleryImage = await response.json()
      
      if (!data.imageUrl) {
        throw new Error('Image URL is missing from the response')
      }
      setFullSizeImage(data)
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
          <DialogDescription>
            View and manage images for this plant. Click on an image to see it in full size.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          {isLoading && loadedImages.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {loadedImages.map((image) => (
                <div key={image.id} className="relative group aspect-square">
                  <Image
                    src={image.thumbnailUrl}
                    alt={`Plant image ${image.id}`}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover rounded-lg cursor-pointer"
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
              {isLoading && loadedImages.length < images.length && (
                <div className="flex justify-center items-center aspect-square">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              {previewImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain rounded-lg"
                  />
                </div>
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
          <DialogHeader>
            <DialogTitle className="sr-only">Full Size Image</DialogTitle>
            <DialogDescription className="sr-only">
              Enlarged view of the selected plant image.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full" style={{ minHeight: '60vh' }}>
            {isLoadingFullSize ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : fullSizeImage ? (
              <Image
                src={fullSizeImage.imageUrl}
                alt="Full size plant image"
                width={fullSizeImage.width || 800}
                height={fullSizeImage.height || 600}
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
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