"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Heart,
  Layers,
  MapPin,
  Maximize,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Sofa,
  Sun,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Zap,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatListingLocation } from "@/lib/cities"
import { coverImage, formatINR, formatPostedAgo, listingImages, type Property } from "@/lib/properties"
import { cn } from "@/lib/utils"
import { ListingBadges } from "./listing-badges"
import { ZeroBrokerageTag } from "./property-card"
import { bottomSheetClass } from "./sheet-styles"

const AMENITY_ICONS: Record<string, LucideIcon> = {
  Lift: ArrowUpDown,
  Parking: Car,
  "Power Backup": Zap,
  "24x7 Security": ShieldCheck,
  Gym: Dumbbell,
  "Swimming Pool": Waves,
  "Wi-Fi": Wifi,
  "Air Conditioning": Snowflake,
  "Modular Kitchen": UtensilsCrossed,
  Balcony: Sun,
  "Gated Society": Building2,
  "Pet Friendly": PawPrint,
}

type PropertyDetailsDialogProps = {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContact: () => void
  shortlisted: boolean
  onToggleShortlist: () => void
}

export function PropertyDetailsDialog({
  property,
  open,
  onOpenChange,
  onContact,
  shortlisted,
  onToggleShortlist,
}: PropertyDetailsDialogProps) {
  const photos = property ? listingImages(property) : []
  const [photoIndex, setPhotoIndex] = useState(0)
  const activePhoto = photos[Math.min(photoIndex, Math.max(photos.length - 1, 0))] || (property ? coverImage(property) : "/placeholder.svg")

  useEffect(() => {
    setPhotoIndex(0)
  }, [property?.id])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setPhotoIndex(0)
      }}
    >
      <DialogContent className={bottomSheetClass} showCloseButton>
        {property && (
          <>
            <div className="relative aspect-[16/11] w-full shrink-0 bg-muted">
              <Image
                src={activePhoto}
                alt={`${property.title} in ${formatListingLocation(property.locality, property.city)}`}
                fill
                sizes="448px"
                className="object-cover"
                unoptimized={activePhoto.startsWith("data:") || activePhoto.startsWith("blob:")}
              />
              <ZeroBrokerageTag className="absolute bottom-3 left-4" />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm"
                    aria-label="Previous photo"
                    onClick={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm"
                    aria-label="Next photo"
                    onClick={() => setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <span className="absolute right-3 bottom-3 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] font-semibold text-background">
                    {Math.min(photoIndex, photos.length - 1) + 1}/{photos.length}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-5 p-5">
              <div>
                <DialogTitle className="text-xl leading-tight font-extrabold text-balance">{property.title}</DialogTitle>
                <DialogDescription className="mt-1.5 flex items-start gap-1 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {property.address || formatListingLocation(property.locality, property.city)}
                  </span>
                </DialogDescription>
                <ListingBadges property={property} className="mt-3" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-primary/8 p-3.5">
                  <p className="text-xs font-medium text-muted-foreground">Monthly rent</p>
                  <p className="mt-1 text-xl font-extrabold text-primary">{formatINR(property.rent)}</p>
                </div>
                <div className="rounded-2xl bg-muted p-3.5">
                  <p className="text-xs font-medium text-muted-foreground">Security deposit</p>
                  <p className="mt-1 text-xl font-extrabold text-foreground">{formatINR(property.deposit)}</p>
                </div>
              </div>

              <section aria-labelledby="overview-heading">
                <h3 id="overview-heading" className="mb-3 text-sm font-bold text-foreground">
                  Overview
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                  <DetailItem icon={Building2} label="Configuration" value={`${property.bhk} BHK`} />
                  <DetailItem icon={Maximize} label="Built-up area" value={`${property.areaSqft} sq.ft`} />
                  <DetailItem icon={Sofa} label="Furnishing" value={property.furnishing} />
                  <DetailItem icon={Layers} label="Floor" value={property.floor} />
                  <DetailItem icon={CalendarDays} label="Available from" value={property.availableFrom} />
                  <DetailItem icon={Users} label="Preferred tenants" value={property.tenantPreference} />
                  <DetailItem icon={PawPrint} label="Pets" value={property.petsAllowed ? "Allowed" : "Not allowed"} />
                </dl>
              </section>

              {property.video && (
                <section aria-labelledby="tour-heading">
                  <h3 id="tour-heading" className="mb-3 text-sm font-bold text-foreground">
                    Property tour
                  </h3>
                  <video src={property.video} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />
                </section>
              )}

              {property.amenities.length > 0 && (
                <section aria-labelledby="amenities-heading">
                  <h3 id="amenities-heading" className="mb-3 text-sm font-bold text-foreground">
                    Amenities
                  </h3>
                  <ul className="grid grid-cols-3 gap-2">
                    {property.amenities.map((amenity) => {
                      const Icon = AMENITY_ICONS[amenity] ?? Check
                      return (
                        <li
                          key={amenity}
                          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-2.5 text-center"
                        >
                          <Icon className="size-5 text-primary" aria-hidden="true" />
                          <span className="text-[11px] leading-tight font-medium text-foreground">{amenity}</span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              {property.description && (
                <section aria-labelledby="about-heading">
                  <h3 id="about-heading" className="mb-2 text-sm font-bold text-foreground">
                    About this home
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>
                </section>
              )}

              <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-success/12 text-sm font-bold text-success">
                  {property.ownerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{property.ownerName}</p>
                  <p className="text-xs text-muted-foreground">Verified owner · {formatPostedAgo(property.postedAt)}</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-2 border-t border-border bg-popover/95 p-4 backdrop-blur">
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleShortlist}
                aria-pressed={shortlisted}
                aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
                className="size-12 rounded-full"
              >
                <Heart className={cn("size-5", shortlisted && "fill-destructive text-destructive")} aria-hidden="true" />
              </Button>
              <Button onClick={onContact} className="h-12 flex-1 rounded-full text-base font-semibold">
                Contact Owner
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] text-muted-foreground">{label}</dt>
        <dd className="text-sm leading-snug font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  )
}
