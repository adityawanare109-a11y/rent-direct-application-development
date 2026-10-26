"use client"

import Image from "next/image"
import { BadgeCheck, Heart, Images, MapPin, Maximize, Sofa, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatListingLocation } from "@/lib/cities"
import { coverImage, formatINR, formatPostedAgo, listingImages, type Property } from "@/lib/properties"
import { cn } from "@/lib/utils"
import { ListingBadges } from "./listing-badges"

type PropertyCardProps = {
  property: Property
  shortlisted: boolean
  onToggleShortlist: () => void
  onViewDetails: () => void
  onContact: () => void
  priority?: boolean
}

export function ZeroBrokerageTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[11px] font-bold tracking-wide text-success-foreground uppercase shadow-sm",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Zero Brokerage
    </span>
  )
}

export function PropertyCard({
  property,
  shortlisted,
  onToggleShortlist,
  onViewDetails,
  onContact,
  priority,
}: PropertyCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <button
          type="button"
          onClick={onViewDetails}
          className="block size-full"
          aria-label={`View photos and details for ${property.title}`}
        >
          <Image
            src={coverImage(property)}
            alt={`${property.title} in ${formatListingLocation(property.locality, property.city)}`}
            fill
            sizes="(max-width: 480px) 100vw, 448px"
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority={priority}
            unoptimized={coverImage(property).startsWith("data:") || coverImage(property).startsWith("blob:")}
          />
        </button>
        <ZeroBrokerageTag className="absolute top-3 left-3" />
        {listingImages(property).length > 1 && (
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-1 text-[11px] font-semibold text-background backdrop-blur">
            <Images className="size-3" aria-hidden="true" />
            {listingImages(property).length}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleShortlist}
          aria-pressed={shortlisted}
          aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:scale-105"
        >
          <Heart
            className={cn("size-[18px]", shortlisted && "fill-destructive text-destructive")}
            aria-hidden="true"
          />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
          {property.bhk} BHK · {property.areaSqft} sq.ft
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-pretty text-base leading-snug font-bold text-foreground">{property.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{formatListingLocation(property.locality, property.city)}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg leading-none font-extrabold text-foreground">{formatINR(property.rent)}</p>
            <p className="mt-1 text-xs text-muted-foreground">per month</p>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-muted/60 py-2.5 text-center">
          <div className="px-2">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Wallet className="size-3" aria-hidden="true" />
              Deposit
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">{formatINR(property.deposit)}</dd>
          </div>
          <div className="px-2">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Sofa className="size-3" aria-hidden="true" />
              Furnishing
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {property.furnishing.replace(" Furnished", "")}
            </dd>
          </div>
          <div className="px-2">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Maximize className="size-3" aria-hidden="true" />
              Area
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">{property.areaSqft} ft²</dd>
          </div>
        </dl>

        <ListingBadges property={property} />

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onViewDetails} className="h-11 flex-1 rounded-full font-semibold">
            View Details
          </Button>
          <Button onClick={onContact} className="h-11 flex-1 rounded-full font-semibold">
            Contact Owner
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {formatPostedAgo(property.postedAt)} by {property.ownerName}
        </p>
      </div>
    </article>
  )
}
