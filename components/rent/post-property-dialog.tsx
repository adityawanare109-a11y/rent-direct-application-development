"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, ImagePlus, Loader2, Video, X } from "lucide-react"
import { toast } from "sonner"
import type { NewPropertyInput } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ACTIVE_CITY } from "@/lib/cities"
import {
  AMENITY_OPTIONS,
  FURNISHING_OPTIONS,
  TENANT_PREFERENCE_OPTIONS,
  type Bhk,
  type Furnishing,
  type TenantPreference,
} from "@/lib/properties"
import { cn } from "@/lib/utils"
import { LocationPicker, type MapPinValue } from "./location-picker"
import { bottomSheetClass } from "./sheet-styles"

type PostPropertyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: NewPropertyInput) => Promise<boolean>
}

const MAX_PHOTO_EDGE = 960
const MAX_PHOTOS = 6
const MAX_VIDEO_BYTES = 1_800_000

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let quality = 0.7
  let dataUrl = canvas.toDataURL("image/jpeg", quality)
  while (dataUrl.length > 300_000 && quality > 0.32) {
    quality -= 0.08
    dataUrl = canvas.toDataURL("image/jpeg", quality)
  }
  return dataUrl
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type FormState = {
  title: string
  locality: string
  address: string
  latitude: number | null
  longitude: number | null
  bhk: Bhk
  rent: string
  deposit: string
  furnishing: Furnishing
  areaSqft: string
  tenantPreference: TenantPreference
  petsAllowed: boolean
  ownerName: string
  ownerPhone: string
  description: string
  amenities: string[]
}

const INITIAL_STATE: FormState = {
  title: "",
  locality: "",
  address: "",
  latitude: null,
  longitude: null,
  bhk: 2,
  rent: "",
  deposit: "",
  furnishing: "Semi Furnished",
  areaSqft: "",
  tenantPreference: "Any / Both",
  petsAllowed: false,
  ownerName: "",
  ownerPhone: "",
  description: "",
  amenities: [],
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (form.title.trim().length < 5) errors.title = "Add a short title (min 5 characters)"
  if (!form.locality.trim() || form.latitude == null || form.longitude == null) {
    errors.locality = "Drop a pin on the Parbhani map"
  }
  const rent = Number(form.rent)
  if (!Number.isFinite(rent) || rent < 1000 || rent > 1000000) errors.rent = "Enter rent between ₹1,000 and ₹10,00,000"
  const deposit = Number(form.deposit)
  if (form.deposit === "" || !Number.isFinite(deposit) || deposit < 0) errors.deposit = "Enter a valid deposit"
  const area = Number(form.areaSqft)
  if (!Number.isFinite(area) || area < 100 || area > 20000) errors.areaSqft = "Enter area in sq.ft"
  if (form.ownerName.trim().length < 2) errors.ownerName = "Your name is required"
  if (!/^[6-9]\d{9}$/.test(form.ownerPhone)) errors.ownerPhone = "Enter a valid 10-digit mobile number"
  return errors
}

export function PostPropertyDialog({ open, onOpenChange, onSubmit }: PostPropertyDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Errors>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [processingVideo, setProcessingVideo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const pinValue: MapPinValue | null =
    form.latitude != null && form.longitude != null && form.locality
      ? { locality: form.locality, address: form.address, lat: form.latitude, lng: form.longitude }
      : null

  const applyPin = (pin: MapPinValue) => {
    setForm((prev) => ({
      ...prev,
      locality: pin.locality,
      address: pin.address,
      latitude: pin.lat,
      longitude: pin.lng,
    }))
    if (errors.locality) setErrors((prev) => ({ ...prev, locality: undefined }))
  }

  const toggleAmenity = (amenity: string) =>
    update(
      "amenities",
      form.amenities.includes(amenity) ? form.amenities.filter((a) => a !== amenity) : [...form.amenities, amenity],
    )

  const addPhotoFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos`)
      return
    }
    const files = [...fileList].filter((file) => file.type.startsWith("image/")).slice(0, remaining)
    if (!files.length) return
    setProcessingPhoto(true)
    try {
      const next = await Promise.all(files.map(compressPhoto))
      setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS))
    } catch {
      toast.error("Couldn't read that photo. Try a JPG or PNG.")
    } finally {
      setProcessingPhoto(false)
    }
  }

  const handleVideo = async (file: File | undefined) => {
    if (!file) return
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      toast.error("Upload an MP4 or WebM tour video")
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Keep the tour video under 1.8 MB")
      return
    }
    setProcessingVideo(true)
    try {
      setVideoUrl(await readAsDataUrl(file))
    } catch {
      toast.error("Couldn't read that video")
    } finally {
      setProcessingVideo(false)
    }
  }

  const reset = () => {
    setForm(INITIAL_STATE)
    setErrors({})
    setPhotos([])
    setVideoUrl(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById("post-title")?.focus()
      return
    }

    setSubmitting(true)
    const ok = await onSubmit({
      title: form.title.trim(),
      locality: form.locality.trim(),
      city: ACTIVE_CITY.label,
      address: form.address.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      bhk: form.bhk,
      rent: Math.round(Number(form.rent)),
      deposit: Math.round(Number(form.deposit)),
      furnishing: form.furnishing,
      areaSqft: Math.round(Number(form.areaSqft)),
      tenantPreference: form.tenantPreference,
      petsAllowed: form.petsAllowed,
      amenities: form.amenities,
      images: photos,
      video: videoUrl,
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone,
      description: form.description.trim(),
    })
    setSubmitting(false)
    if (ok) reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setErrors({})
      }}
    >
      <DialogContent className={bottomSheetClass}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <div className="border-b border-border p-5 pb-4">
            <DialogTitle className="text-lg font-extrabold">Post your property</DialogTitle>
            <DialogDescription className="mt-1">
              List a home in {ACTIVE_CITY.label} and get calls directly from tenants.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div>
              <span className="mb-2 block text-sm font-medium">Photos</span>
              {photos.length > 0 && (
                <ul className="mb-3 grid grid-cols-3 gap-2">
                  {photos.map((src, index) => (
                    <li key={`${src.slice(-24)}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      <Image src={src} alt={`Property photo ${index + 1}`} fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 rounded-full bg-foreground/80 px-1.5 py-0.5 text-[9px] font-bold text-background">
                          Cover
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  disabled={processingPhoto || photos.length >= MAX_PHOTOS}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-dashed border-border bg-muted/50 text-xs font-semibold text-foreground"
                >
                  {processingPhoto ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  From gallery
                </button>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={processingPhoto || photos.length >= MAX_PHOTOS}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-dashed border-border bg-muted/50 text-xs font-semibold text-foreground"
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Take photo
                </button>
              </div>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void addPhotoFiles(event.target.files)
                  event.target.value = ""
                }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  void addPhotoFiles(event.target.files)
                  event.target.value = ""
                }}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Up to {MAX_PHOTOS} photos. Optional — a default photo is used if you skip this.
              </p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">Property tour video</span>
              {videoUrl ? (
                <div className="relative overflow-hidden rounded-2xl bg-muted">
                  <video src={videoUrl} controls playsInline className="aspect-video w-full bg-black" />
                  <button
                    type="button"
                    onClick={() => setVideoUrl(null)}
                    className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm"
                    aria-label="Remove video"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  disabled={processingVideo}
                  className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground"
                >
                  {processingVideo ? <Loader2 className="size-6 animate-spin" /> : <Video className="size-6" />}
                  <span className="text-sm font-medium">{processingVideo ? "Preparing video…" : "Add tour video (optional)"}</span>
                  <span className="text-[11px]">MP4 or WebM, up to 1.8 MB</span>
                </button>
              )}
              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/webm"
                className="sr-only"
                onChange={(event) => {
                  void handleVideo(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </div>

            <Field id="post-title" label="Listing title" error={errors.title}>
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Sunny 2 BHK near Station Road"
                aria-invalid={!!errors.title}
                maxLength={80}
              />
            </Field>

            <LocationPicker value={pinValue} onChange={applyPin} error={errors.locality} />

            <Field id="post-address" label="Address">
              <Input
                id="post-address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Filled from the map pin"
                maxLength={120}
              />
            </Field>

            <Segmented
              label="Configuration"
              options={[1, 2, 3].map((n) => ({ label: `${n} BHK`, value: n as Bhk }))}
              value={form.bhk}
              onChange={(v) => update("bhk", v)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field id="post-rent" label="Rent / month (₹)" error={errors.rent}>
                <Input
                  id="post-rent"
                  inputMode="numeric"
                  value={form.rent}
                  onChange={(e) => update("rent", e.target.value.replace(/\D/g, ""))}
                  placeholder="12000"
                  aria-invalid={!!errors.rent}
                />
              </Field>
              <Field id="post-deposit" label="Deposit (₹)" error={errors.deposit}>
                <Input
                  id="post-deposit"
                  inputMode="numeric"
                  value={form.deposit}
                  onChange={(e) => update("deposit", e.target.value.replace(/\D/g, ""))}
                  placeholder="35000"
                  aria-invalid={!!errors.deposit}
                />
              </Field>
            </div>

            <Segmented
              label="Furnishing"
              options={FURNISHING_OPTIONS.map((f) => ({ label: f.replace(" Furnished", ""), value: f }))}
              value={form.furnishing}
              onChange={(v) => update("furnishing", v)}
            />

            <Field id="post-areaSqft" label="Built-up area (sq.ft)" error={errors.areaSqft}>
              <Input
                id="post-areaSqft"
                inputMode="numeric"
                value={form.areaSqft}
                onChange={(e) => update("areaSqft", e.target.value.replace(/\D/g, ""))}
                placeholder="950"
                aria-invalid={!!errors.areaSqft}
              />
            </Field>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Preferred tenant</legend>
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Preferred tenant">
                {TENANT_PREFERENCE_OPTIONS.map((option) => {
                  const active = form.tenantPreference === option
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update("tenantPreference", option)}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-left text-sm font-semibold",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground",
                      )}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <Segmented
              label="Pets allowed"
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              value={form.petsAllowed ? "yes" : "no"}
              onChange={(v) => update("petsAllowed", v === "yes")}
            />

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Amenities</legend>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const active = form.amenities.includes(amenity)
                  return (
                    <button
                      key={amenity}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleAmenity(amenity)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-accent",
                      )}
                    >
                      {amenity}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <Field id="post-description" label="Description (optional)">
              <Textarea
                id="post-description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Nearby landmarks, what's included…"
                rows={3}
                maxLength={500}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="post-ownerName" label="Your name" error={errors.ownerName}>
                <Input
                  id="post-ownerName"
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  aria-invalid={!!errors.ownerName}
                  maxLength={50}
                />
              </Field>
              <Field id="post-ownerPhone" label="Mobile number" error={errors.ownerPhone}>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="post-ownerPhone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={form.ownerPhone}
                    onChange={(e) => update("ownerPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    className="pl-10"
                    aria-invalid={!!errors.ownerPhone}
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="sticky bottom-0 flex gap-2 border-t border-border bg-popover/95 p-4 backdrop-blur">
            <Button type="button" variant="ghost" onClick={reset} disabled={submitting} className="h-12 rounded-full px-5">
              Reset
            </Button>
            <Button
              type="submit"
              disabled={submitting || processingPhoto || processingVideo}
              className="h-12 flex-1 rounded-full text-base font-semibold"
            >
              {submitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {submitting ? "Publishing…" : "Publish Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="grid grid-flow-col gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "h-9 rounded-full text-sm font-semibold transition",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
