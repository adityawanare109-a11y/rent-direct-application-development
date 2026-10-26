"use client"

import useSWR from "swr"
import { createProperty, getProperties, getSavedPropertyIds, setSaved, type NewPropertyInput } from "@/app/actions"
import type { Property } from "@/lib/properties"

const PROPERTIES_KEY = "rentdirect/properties"
const SAVED_KEY = "rentdirect/saved"

export function useProperties(initial: Property[]) {
  const { data, mutate } = useSWR<Property[]>(PROPERTIES_KEY, () => getProperties(), {
    fallbackData: initial,
    revalidateOnMount: false,
  })

  const addProperty = async (input: NewPropertyInput) => {
    const result = await createProperty(input)
    if (result.ok) {
      await mutate((current = []) => [result.property, ...current.filter((p) => p.id !== result.property.id)], {
        revalidate: false,
      })
    }
    return result
  }

  return { properties: data ?? initial, addProperty }
}

export function useShortlist(initial: string[]) {
  const { data, mutate } = useSWR<string[]>(SAVED_KEY, () => getSavedPropertyIds(), {
    fallbackData: initial,
    revalidateOnMount: false,
  })
  const shortlist = data ?? initial

  const toggle = (id: string) => {
    const next = !shortlist.includes(id)
    return mutate(setSaved(id, next), {
      optimisticData: (current = []) => (next ? [id, ...current] : current.filter((x) => x !== id)),
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    })
  }

  return { shortlist, isShortlisted: (id: string) => shortlist.includes(id), toggle }
}
