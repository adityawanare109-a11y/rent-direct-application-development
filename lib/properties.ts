import { ACTIVE_CITY, listingAddress } from "@/lib/cities"

export type Furnishing = "Fully Furnished" | "Semi Furnished" | "Unfurnished"
export type Bhk = 1 | 2 | 3
export type TenantPreference = "Family Only" | "Bachelors (Men / Women)" | "Any / Both"

export type Property = {
  id: string
  title: string
  locality: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  bhk: Bhk
  rent: number
  deposit: number
  furnishing: Furnishing
  areaSqft: number
  floor: string
  availableFrom: string
  tenantPreference: TenantPreference
  petsAllowed: boolean
  amenities: string[]
  image: string
  images: string[]
  video: string | null
  ownerName: string
  ownerPhone: string
  description: string
  postedAt: number
}

export const FURNISHING_OPTIONS: Furnishing[] = ["Fully Furnished", "Semi Furnished", "Unfurnished"]

export const TENANT_PREFERENCE_OPTIONS: TenantPreference[] = [
  "Family Only",
  "Bachelors (Men / Women)",
  "Any / Both",
]

export const AMENITY_OPTIONS = [
  "Lift",
  "Parking",
  "Power Backup",
  "24x7 Security",
  "Gym",
  "Swimming Pool",
  "Wi-Fi",
  "Air Conditioning",
  "Modular Kitchen",
  "Balcony",
  "Gated Society",
  "Pet Friendly",
] as const

export const CITY_OPTIONS = [ACTIVE_CITY.label]

export const BUDGET_OPTIONS = [
  { label: "Under ₹15k", value: 15000 },
  { label: "Under ₹25k", value: 25000 },
  { label: "Under ₹40k", value: 40000 },
] as const

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const loc = (name: string) => ACTIVE_CITY.localities.find((l) => l.name === name) ?? ACTIVE_CITY.localities[0]

function listing(
  partial: Omit<Property, "city" | "address" | "images" | "video" | "latitude" | "longitude"> & {
    images?: string[]
    video?: string | null
    latName: string
  },
): Property {
  const pin = loc(partial.latName)
  const { latName: _, images, video, ...rest } = partial
  const cover = rest.image
  return {
    ...rest,
    city: ACTIVE_CITY.label,
    address: listingAddress(rest.locality),
    latitude: pin.lat,
    longitude: pin.lng,
    images: images?.length ? images : [cover],
    video: video ?? null,
  }
}

export const SEED_PROPERTIES: Property[] = [
  listing({
    id: "p1",
    title: "Spacious 2 BHK Flat in Shivaji Nagar",
    locality: "Shivaji Nagar",
    latName: "Shivaji Nagar",
    bhk: 2,
    rent: 14000,
    deposit: 40000,
    furnishing: "Semi Furnished",
    areaSqft: 950,
    floor: "2nd of 4",
    availableFrom: "Immediately",
    tenantPreference: "Family Only",
    petsAllowed: false,
    amenities: ["Lift", "Parking", "Power Backup", "Balcony"],
    image: "/properties/pune-2bhk.png",
    ownerName: "Rahul Deshpande",
    ownerPhone: "9876543210",
    description:
      "Well-ventilated east-facing flat near Shivaji Nagar market. Wardrobes in both bedrooms and a balcony facing the inner lane.",
    postedAt: now - 1 * DAY,
  }),
  listing({
    id: "p2",
    title: "Furnished 1 BHK near Station Road",
    locality: "Station Road",
    latName: "Station Road",
    bhk: 1,
    rent: 9000,
    deposit: 25000,
    furnishing: "Fully Furnished",
    areaSqft: 480,
    floor: "3rd of 5",
    availableFrom: "Immediately",
    tenantPreference: "Bachelors (Men / Women)",
    petsAllowed: false,
    amenities: ["Wi-Fi", "Air Conditioning", "Modular Kitchen", "Parking"],
    image: "/properties/mumbai-1bhk.png",
    ownerName: "Priya Mehta",
    ownerPhone: "9820011223",
    description: "Move-in ready apartment, a short walk from Parbhani Junction. Bed, fridge, and AC included.",
    postedAt: now - 2 * DAY,
  }),
  listing({
    id: "p3",
    title: "Premium 3 BHK on Basmat Road",
    locality: "Basmat Road",
    latName: "Basmat Road",
    bhk: 3,
    rent: 22000,
    deposit: 80000,
    furnishing: "Fully Furnished",
    areaSqft: 1480,
    floor: "4th of 8",
    availableFrom: "Immediately",
    tenantPreference: "Family Only",
    petsAllowed: true,
    amenities: ["Lift", "Parking", "Gym", "Gated Society", "Power Backup", "Pet Friendly"],
    image: "/properties/bangalore-3bhk.png",
    ownerName: "Anand Rao",
    ownerPhone: "9845098450",
    description: "Corner unit in a quiet gated society on Basmat Road. Ideal for families, pets welcome.",
    postedAt: now - 3 * DAY,
  }),
  listing({
    id: "p4",
    title: "2 BHK Apartment on Karegaon Road",
    locality: "Karegaon Road",
    latName: "Karegaon Road",
    bhk: 2,
    rent: 12500,
    deposit: 35000,
    furnishing: "Semi Furnished",
    areaSqft: 1100,
    floor: "1st of 3",
    availableFrom: "15 Nov 2026",
    tenantPreference: "Any / Both",
    petsAllowed: true,
    amenities: ["Parking", "24x7 Security", "Gated Society", "Pet Friendly"],
    image: "/properties/hyderabad-2bhk.png",
    ownerName: "Srinivas Reddy",
    ownerPhone: "9701234567",
    description: "Peaceful independent building on Karegaon Road with covered parking and round-the-clock water.",
    postedAt: now - 4 * DAY,
  }),
  listing({
    id: "p5",
    title: "Budget 1 BHK in Nanal Peth",
    locality: "Nanal Peth",
    latName: "Nanal Peth",
    bhk: 1,
    rent: 7500,
    deposit: 20000,
    furnishing: "Unfurnished",
    areaSqft: 520,
    floor: "2nd of 3",
    availableFrom: "Immediately",
    tenantPreference: "Bachelors (Men / Women)",
    petsAllowed: false,
    amenities: ["Parking", "Balcony", "Power Backup"],
    image: "/properties/pune-1bhk.png",
    ownerName: "Sneha Kulkarni",
    ownerPhone: "9922334455",
    description: "Quiet lane in Nanal Peth, walking distance to markets and bus stand. Freshly painted.",
    postedAt: now - 5 * DAY,
  }),
  listing({
    id: "p6",
    title: "Airy 2 BHK on Jintur Road",
    locality: "Jintur Road",
    latName: "Jintur Road",
    bhk: 2,
    rent: 16000,
    deposit: 50000,
    furnishing: "Semi Furnished",
    areaSqft: 1200,
    floor: "3rd of 6",
    availableFrom: "1 Dec 2026",
    tenantPreference: "Family Only",
    petsAllowed: false,
    amenities: ["Lift", "Parking", "24x7 Security", "Balcony", "Power Backup"],
    image: "/properties/mumbai-3bhk.png",
    ownerName: "Farhan Shaikh",
    ownerPhone: "9833445566",
    description: "Bright living room and two bedrooms, close to Jintur Road. Family-preferred society.",
    postedAt: now - 6 * DAY,
  }),
]

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

export function formatINR(value: number) {
  return inr.format(value)
}

export function formatPostedAgo(timestamp: number) {
  const days = Math.floor((Date.now() - timestamp) / DAY)
  if (days <= 0) return "Posted today"
  if (days === 1) return "Posted yesterday"
  return `Posted ${days} days ago`
}

export function coverImage(property: Pick<Property, "image" | "images">) {
  return property.images[0] || property.image || "/placeholder.svg"
}

export function listingImages(property: Pick<Property, "image" | "images">) {
  const photos = property.images.filter(Boolean)
  if (photos.length) return photos
  return property.image ? [property.image] : []
}

export function isTenantPreference(value: string): value is TenantPreference {
  return (TENANT_PREFERENCE_OPTIONS as string[]).includes(value)
}

export function matchesTenantFilter(listingValue: string, filter: TenantPreference | null) {
  if (!filter) return true
  if (filter === "Any / Both") return true
  const value = listingValue.toLowerCase()
  const open = value.includes("any")
  if (filter === "Family Only") return open || value.includes("family")
  return open || value.includes("bachelor") || value.includes("working")
}
