import { useCallback, useEffect, useState } from "react"
import { fetchPets } from "../api/services/pets"
import type { Pet } from "../features/pets/types"

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const loadPets = useCallback(async () => {
    setLoading(true)
    try {
      setPets(await fetchPets())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPets()
  }, [loadPets])

  return { pets, loading, getPets: loadPets }
}
