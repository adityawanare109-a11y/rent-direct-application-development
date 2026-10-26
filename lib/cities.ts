export type CityId = "parbhani"

export type Locality = {
  name: string
  lat: number
  lng: number
}

export type CityConfig = {
  id: CityId
  name: string
  state: string
  label: string
  center: { lat: number; lng: number }
  zoom: number
  bounds: { north: number; south: number; west: number; east: number }
  localities: Locality[]
}

/**
 * Active cities are listed here so new markets can be enabled later
 * without rewriting forms or filters.
 */
export const CITIES: Record<CityId, CityConfig> = {
  parbhani: {
    id: "parbhani",
    name: "Parbhani",
    state: "Maharashtra",
    label: "Parbhani, Maharashtra",
    center: { lat: 19.2686, lng: 76.7708 },
    zoom: 13,
    bounds: { north: 19.298, south: 19.232, west: 76.732, east: 76.818 },
    localities: [
      { name: "Shivaji Nagar", lat: 19.2745, lng: 76.756 },
      { name: "Station Road", lat: 19.2578, lng: 76.7785 },
      { name: "Basmat Road", lat: 19.266, lng: 76.798 },
      { name: "Karegaon Road", lat: 19.2485, lng: 76.792 },
      { name: "Nanal Peth", lat: 19.2682, lng: 76.7708 },
      { name: "Jintur Road", lat: 19.28, lng: 76.765 },
      { name: "Dhar Peth", lat: 19.264, lng: 76.763 },
      { name: "Mondha", lat: 19.261, lng: 76.7755 },
      { name: "Pedgaon Road", lat: 19.252, lng: 76.755 },
      { name: "Gangakhed Road", lat: 19.255, lng: 76.76 },
    ],
  },
}

export const ACTIVE_CITY_ID: CityId = "parbhani"
export const ACTIVE_CITY = CITIES[ACTIVE_CITY_ID]

export function cityLabel(city: string) {
  const match = Object.values(CITIES).find((c) => c.name === city || c.label === city)
  return match?.label ?? city
}

export function formatListingLocation(locality: string, city: string) {
  return `${locality}, ${cityLabel(city)}`
}

export function nearestLocality(lat: number, lng: number, city: CityConfig = ACTIVE_CITY): Locality {
  return city.localities.reduce((best, locality) => {
    const d = (locality.lat - lat) ** 2 + (locality.lng - lng) ** 2
    const bd = (best.lat - lat) ** 2 + (best.lng - lng) ** 2
    return d < bd ? locality : best
  })
}

export function listingAddress(locality: string, city: CityConfig = ACTIVE_CITY, near = false) {
  return `${near ? "Near " : ""}${locality}, ${city.label}`
}
