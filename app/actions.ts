"use server"

import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { inquiries, properties, savedHomes } from "@/lib/db/schema"
import { ACTIVE_CITY } from "@/lib/cities"
import {
  AMENITY_OPTIONS,
  FURNISHING_OPTIONS,
  SEED_PROPERTIES,
  TENANT_PREFERENCE_OPTIONS,
  isTenantPreference,
  type Bhk,
  type Furnishing,
  type Property,
  type TenantPreference,
} from "@/lib/properties"
import { ensureVisitorId, readVisitorId } from "@/lib/visitor"

type PropertyRow = typeof properties.$inferSelect

function toProperty(row: PropertyRow): Property {
  const images = row.images?.length ? row.images : row.image ? [row.image] : []
  const tenantPreference: TenantPreference = isTenantPreference(row.tenantPreference)
    ? row.tenantPreference
    : "Any / Both"
  return {
    id: row.id,
    title: row.title,
    locality: row.locality,
    city: row.city,
    address: row.address || `${row.locality}, ${row.city}`,
    latitude: row.latitude,
    longitude: row.longitude,
    bhk: row.bhk as Bhk,
    rent: row.rent,
    deposit: row.deposit,
    furnishing: row.furnishing as Furnishing,
    areaSqft: row.areaSqft,
    floor: row.floor,
    availableFrom: row.availableFrom,
    tenantPreference,
    petsAllowed: Boolean(row.petsAllowed),
    amenities: row.amenities,
    image: images[0] || row.image,
    images,
    video: row.video,
    ownerName: row.ownerName,
    ownerPhone: row.ownerPhone,
    description: row.description,
    postedAt: row.createdAt.getTime(),
  }
}

export async function getProperties(): Promise<Property[]> {
  try {
    const rows = await db.select().from(properties).orderBy(desc(properties.createdAt)).limit(200)
    return rows.map(toProperty)
  } catch {
    return SEED_PROPERTIES
  }
}

export type NewPropertyInput = {
  title: string
  locality: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  bhk: number
  rent: number
  deposit: number
  furnishing: string
  areaSqft: number
  tenantPreference: TenantPreference
  petsAllowed: boolean
  amenities: string[]
  description: string
  ownerName: string
  ownerPhone: string
  images: string[]
  video: string | null
}

const FALLBACK_IMAGES: Record<Bhk, string> = {
  1: "/properties/pune-1bhk.png",
  2: "/properties/pune-2bhk.png",
  3: "/properties/bangalore-3bhk.png",
}

const MAX_IMAGE_CHARS = 320_000
const MAX_IMAGES = 6
const MAX_VIDEO_CHARS = 2_800_000
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "")
const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

function isPhotoDataUrl(value: string) {
  return /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= MAX_IMAGE_CHARS
}

function isVideoDataUrl(value: string) {
  return /^data:video\/(mp4|webm);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= MAX_VIDEO_CHARS
}

export async function createProperty(
  input: NewPropertyInput,
): Promise<{ ok: true; property: Property } | { ok: false; error: string }> {
  const title = clean(input.title, 80)
  const locality = clean(input.locality, 40)
  const city = ACTIVE_CITY.label
  const address = clean(input.address, 120) || `${locality}, ${city}`
  const ownerName = clean(input.ownerName, 50)
  const ownerPhone = clean(input.ownerPhone, 10)
  const description = clean(input.description, 500)

  if (title.length < 5 || !locality || ownerName.length < 2) return { ok: false, error: "Missing details" }
  if (!/^[6-9]\d{9}$/.test(ownerPhone)) return { ok: false, error: "Invalid mobile number" }
  if (!isInt(input.bhk, 1, 3)) return { ok: false, error: "Invalid configuration" }
  if (!isInt(input.rent, 1000, 1_000_000)) return { ok: false, error: "Invalid rent" }
  if (!isInt(input.deposit, 0, 10_000_000)) return { ok: false, error: "Invalid deposit" }
  if (!isInt(input.areaSqft, 100, 20_000)) return { ok: false, error: "Invalid area" }
  if (!FURNISHING_OPTIONS.includes(input.furnishing as Furnishing)) return { ok: false, error: "Invalid furnishing" }
  if (!TENANT_PREFERENCE_OPTIONS.includes(input.tenantPreference)) return { ok: false, error: "Invalid tenant preference" }

  const latitude = isFiniteNumber(input.latitude) ? input.latitude : null
  const longitude = isFiniteNumber(input.longitude) ? input.longitude : null

  const allowedAmenities = new Set<string>(AMENITY_OPTIONS)
  const amenities = Array.isArray(input.amenities)
    ? [...new Set(input.amenities.filter((a) => allowedAmenities.has(a)))]
    : []

  const uploaded = Array.isArray(input.images) ? input.images.filter(isPhotoDataUrl).slice(0, MAX_IMAGES) : []
  const images = uploaded.length ? uploaded : [FALLBACK_IMAGES[input.bhk as Bhk]]

  let video: string | null = null
  if (input.video) {
    if (!isVideoDataUrl(input.video)) return { ok: false, error: "Video is too large or not MP4/WebM" }
    video = input.video
  }

  await ensureVisitorId()

  try {
    const [row] = await db
      .insert(properties)
      .values({
        id: crypto.randomUUID(),
        title,
        locality,
        city,
        address,
        latitude,
        longitude,
        bhk: input.bhk,
        rent: input.rent,
        deposit: input.deposit,
        furnishing: input.furnishing,
        areaSqft: input.areaSqft,
        floor: "—",
        tenantPreference: input.tenantPreference,
        petsAllowed: Boolean(input.petsAllowed),
        amenities,
        image: images[0],
        images,
        video,
        ownerName,
        ownerPhone,
        description,
      })
      .returning()

    return { ok: true, property: toProperty(row) }
  } catch {
    return { ok: false, error: "Couldn't publish listing. Database is missing the latest listing fields." }
  }
}

export async function getSavedPropertyIds(): Promise<string[]> {
  const visitorId = await readVisitorId()
  if (!visitorId) return []
  const rows = await db
    .select({ propertyId: savedHomes.propertyId })
    .from(savedHomes)
    .where(eq(savedHomes.visitorId, visitorId))
    .orderBy(desc(savedHomes.createdAt))
  return rows.map((r) => r.propertyId)
}

export async function setSaved(propertyId: string, saved: boolean): Promise<string[]> {
  if (typeof propertyId !== "string" || propertyId.length > 64) return getSavedPropertyIds()
  const visitorId = await ensureVisitorId()

  if (saved) {
    const [exists] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId))
    if (exists) await db.insert(savedHomes).values({ visitorId, propertyId }).onConflictDoNothing()
  } else {
    await db
      .delete(savedHomes)
      .where(and(eq(savedHomes.visitorId, visitorId), eq(savedHomes.propertyId, propertyId)))
  }

  const rows = await db
    .select({ propertyId: savedHomes.propertyId })
    .from(savedHomes)
    .where(eq(savedHomes.visitorId, visitorId))
    .orderBy(desc(savedHomes.createdAt))
  return rows.map((r) => r.propertyId)
}

export type InquiryInput = {
  propertyId: string
  channel: "call" | "whatsapp" | "message"
  name?: string
  phone?: string
  message?: string
}

export async function logInquiry(input: InquiryInput): Promise<{ ok: boolean }> {
  if (!["call", "whatsapp", "message"].includes(input.channel)) return { ok: false }
  if (typeof input.propertyId !== "string" || input.propertyId.length > 64) return { ok: false }

  const phone = clean(input.phone, 10)
  if (input.channel === "message") {
    if (clean(input.name, 50).length < 2 || !/^[6-9]\d{9}$/.test(phone)) return { ok: false }
  }

  const [exists] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, input.propertyId))
  if (!exists) return { ok: false }

  const visitorId = await ensureVisitorId()
  await db.insert(inquiries).values({
    propertyId: input.propertyId,
    visitorId,
    channel: input.channel,
    name: clean(input.name, 50) || null,
    phone: phone || null,
    message: clean(input.message, 500) || null,
  })
  return { ok: true }
}
