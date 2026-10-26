import { PawPrint, Users } from "lucide-react"
import type { Property } from "@/lib/properties"
import { cn } from "@/lib/utils"

export function ListingBadges({
  property,
  className,
}: {
  property: Pick<Property, "tenantPreference" | "petsAllowed">
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
        <Users className="size-3" aria-hidden="true" />
        {property.tenantPreference}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
          property.petsAllowed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        <PawPrint className="size-3" aria-hidden="true" />
        {property.petsAllowed ? "Pets allowed" : "No pets"}
      </span>
    </div>
  )
}
