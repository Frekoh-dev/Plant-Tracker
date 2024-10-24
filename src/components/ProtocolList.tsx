'use client'

import { useEffect, useState } from 'react'
import { Protocol } from '@/types'
import { fetchProtocol } from '@/api'
import { useToast } from "@/components/ui/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ProtocolListProps {
  plantId: number
}

export default function ProtocolList({ plantId }: ProtocolListProps) {
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProtocol(plantId)
      .then(setProtocol)
      .catch((error) => {
        console.error('Error fetching protocol:', error)
        toast({
          title: "Error",
          description: "Failed to fetch protocol. Please try again.",
          variant: "destructive",
        })
      })
  }, [plantId, toast])

  if (!protocol) {
    return <p>Loading protocol...</p>
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {protocol.steps.map((step, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{step.title}</AccordionTrigger>
          <AccordionContent>
            <p>{step.description}</p>
            {step.tasks && step.tasks.length > 0 && (
              <ul className="list-disc list-inside mt-2">
                {step.tasks.map((task, taskIndex) => (
                  <li key={taskIndex}>{task}</li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}