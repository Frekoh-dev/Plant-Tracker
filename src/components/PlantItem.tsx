import { useState, useEffect, useCallback } from "react"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplet, Flower, Image as ImageIcon, Sprout, Trash2, Edit, Scissors, ChevronDown } from "lucide-react"
import { Plant, PlantStage } from "../types"
import { updatePlantStage } from "../api"
import { useToast } from "@/components/ui/use-toast"
import WateringDialog from "./WateringDialog"
import HarvestDialog from "./HarvestDialog"
import GalleryDialog from "./GalleryDialog"
import ConfirmDeleteDialog from "./ConfirmDeleteDialog"
import ImageUploadDialog from "./ImageUploadDialog"
import ProtocolList from "./ProtocolList"

interface PlantItemProps {
  plant: Plant
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>
}

export default function PlantItem({ plant, setPlants }: PlantItemProps) {
  const { toast } = useToast()
  const [wateringDialogOpen, setWateringDialogOpen] = useState(false)
  const [harvestDialogOpen, setHarvestDialogOpen] = useState(false)
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false)
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false)
  const [localPlant, setLocalPlant] = useState(plant)

  useEffect(() => {
    console.log('Plant prop updated:', plant);
    setLocalPlant(plant)
  }, [plant])

  const getStageIcon = (stage: PlantStage) => {
    switch (stage) {
      case "early stage":
        return <Sprout className="text-green-500" size={18} />
      case "growing stage":
        return <Sprout className="text-green-600" size={18} />
      case "bloom":
        return <Flower className="text-pink-500" size={18} />
    }
  }

  const handleUpdateStage = async (newStage: PlantStage) => {
    try {
      const updatedPlant = await updatePlantStage(plant.id, newStage)
      console.log('Updated plant after stage change:', updatedPlant);
      setLocalPlant(updatedPlant)
      setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p))
      toast({
        title: "Success",
        description: "Plant stage updated successfully",
      })
    } catch (error) {
      console.error('Error updating plant stage:', error)
      toast({
        title: "Error",
        description: "Failed to update plant stage. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateLocalPlant = useCallback((updatedFields: Partial<Plant>) => {
    console.log('Updating local plant:', updatedFields);
    setLocalPlant(prevPlant => {
      const updatedPlant = { ...prevPlant, ...updatedFields };
      console.log('New local plant state:', updatedPlant);
      setPlants(prevPlants => prevPlants.map(p => p.id === updatedPlant.id ? updatedPlant : p));
      return updatedPlant;
    });
  }, [setPlants]);

  return (
    <AccordionItem value={`plant-${localPlant.id}`} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="w-full p-0 [&[data-state=open]>div>div>svg]:rotate-180">
        <Card className="w-full overflow-hidden border border-border hover:border-primary transition-colors duration-300">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted py-2 px-4">
            <CardTitle className="text-lg font-medium flex items-center justify-between text-foreground">
              <div className="flex items-center space-x-4">
                {localPlant.imageUrl ? (
                  <img
                    src={localPlant.imageUrl}
                    alt={localPlant.name}
                    className="w-12 h-12 object-cover rounded-full border-2 border-green-300"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-full border-2 border-green-300">
                    <ImageIcon size={24} className="text-green-500" />
                  </div>
                )}
                <div className="flex items-center">
                  {getStageIcon(localPlant.stage)}
                  <span className="ml-2">{localPlant.name}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </CardTitle>
          </CardHeader>
        </Card>
      </AccordionTrigger>
      <AccordionContent>
        <Card className="w-full overflow-hidden border-2 border-border">
          <CardContent className="bg-background pt-2 px-3 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {localPlant.imageUrl ? (
                    <img
                      src={localPlant.imageUrl}
                      alt={localPlant.name}
                      className="w-24 h-24 object-cover rounded-full border-4 border-border cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 bg-primary/10 flex items-center justify-center rounded-full border-4 border-border"
                    >
                      <ImageIcon size={32} className="text-green-500" />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 bg-background rounded-full shadow-md"
                    onClick={() => setImageUploadDialogOpen(true)}
                  >
                    <Edit size={16} className="text-green-600" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-green-700">
                    {localPlant.lastWatered
                      ? `Last watered: ${new Date(localPlant.lastWatered).toLocaleString()}`
                      : "Not watered yet"}
                  </p>
                  <p className="text-sm font-medium text-green-800">
                    Stage: {localPlant.stage}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirmDialogOpen(true)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={18} />
                </Button>
                {!localPlant.harvested && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHarvestDialogOpen(true)}
                    className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                  >
                    <Scissors size={18} />
                  </Button>
                )}
              </div>
            </div>
            {!localPlant.harvested && (
              <div className="flex justify-center gap-2 mb-2">
                <Button 
                  onClick={() => setWateringDialogOpen(true)} 
                  variant="outline" 
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/50 flex-1 h-10"
                >
                  <Droplet className="mr-2" size={18} />
                  Water
                </Button>
                <Select
                  onValueChange={(value: PlantStage) => handleUpdateStage(value)}
                  defaultValue={localPlant.stage}
                >
                  <SelectTrigger className="w-[50%] bg-secondary text-secondary-foreground border-secondary/50 h-10">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early stage">Early Stage</SelectItem>
                    <SelectItem value="growing stage">Growing Stage</SelectItem>
                    <SelectItem value="bloom">Bloom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button 
              onClick={() => setGalleryDialogOpen(true)} 
              size="sm" 
              variant="outline" 
              className="w-full mb-2 bg-accent/10 hover:bg-accent/20 text-accent-foreground border-accent/50"
            >
              <ImageIcon className="mr-2" size={18} />
              View Gallery
            </Button>
            <ProtocolList
              key={`${localPlant.id}-${localPlant.protocol.length}`}
              plantId={localPlant.id}
              entries={localPlant.protocol}
              updatePlant={updateLocalPlant}
            />
          </CardContent>
        </Card>
      </AccordionContent>

      <WateringDialog
        open={wateringDialogOpen}
        onOpenChange={setWateringDialogOpen}
        plantId={localPlant.id}
        setPlants={setPlants}
      />

      <HarvestDialog
        open={harvestDialogOpen}
        onOpenChange={setHarvestDialogOpen}
        plant={localPlant}
        setPlants={setPlants}
      />

      <GalleryDialog
        open={galleryDialogOpen}
        onOpenChange={setGalleryDialogOpen}
        plant={localPlant}
        setPlants={setPlants}
      />

      <ConfirmDeleteDialog
        open={deleteConfirmDialogOpen}
        onOpenChange={setDeleteConfirmDialogOpen}
        plant={localPlant}
        setPlants={setPlants}
      />

      <ImageUploadDialog
        open={imageUploadDialogOpen}
        onOpenChange={setImageUploadDialogOpen}
        plant={localPlant}
        setPlants={setPlants}
      />
    </AccordionItem>
  )
}