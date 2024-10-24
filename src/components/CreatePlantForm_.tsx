'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePlantForm() {
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [waterFrequency, setWaterFrequency] = useState('')
  const router = useRouter()

  async function createPlant(e: React.FormEvent) {
    e.preventDefault()
    
    const response = await fetch('/api/plants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        species,
        waterFrequency: parseInt(waterFrequency, 10),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to create plant:', errorData.error)
      // Handle error (e.g., show error message to user)
    } else {
      // Plant created successfully
      router.refresh() // Refresh the current route
      // Optionally, reset form or navigate to a different page
    }
  }

  return (
    <form onSubmit={createPlant}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Plant Name"
        required
      />
      <input
        type="text"
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        placeholder="Species (optional)"
      />
      <input
        type="number"
        value={waterFrequency}
        onChange={(e) => setWaterFrequency(e.target.value)}
        placeholder="Water Frequency (days)"
        required
      />
      <button type="submit">Create Plant</button>
    </form>
  )
}