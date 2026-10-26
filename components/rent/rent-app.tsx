"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Heart, SearchX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { NewPropertyInput } from "@/app/actions"
import { useProperties, useShortlist } from "@/hooks/use-properties"
import { matchesTenantFilter, type Bhk, type Property, type TenantPreference } from "@/lib/properties"
import { cn } from "@/lib/utils"
import { AppHeader } from "./app-header"
import { ContactOwnerDialog } from "./contact-owner-dialog"
import { FilterChips } from "./filter-chips"
import { PostPropertyDialog } from "./post-property-dialog"
import { PropertyCard } from "./property-card"
import { PropertyDetailsDialog } from "./property-details-dialog"

type SortOrder = "newest" | "rent-asc" | "rent-desc"

type RentAppProps = {
  initialProperties: Property[]
  initialSavedIds: string[]
}

export function RentApp({ initialProperties, initialSavedIds }: RentAppProps) {
  const { properties, addProperty } = useProperties(initialProperties)
  const { shortlist, isShortlisted, toggle: toggleSaved } = useShortlist(initialSavedIds)

  const toggle = (id: string) => {
    toggleSaved(id).catch(() => toast.error("Couldn't update saved homes. Please try again."))
  }

  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [bhk, setBhk] = useState<Bhk | null>(null)
  const [maxBudget, setMaxBudget] = useState<number | null>(null)
  const [tenantPreference, setTenantPreference] = useState<TenantPreference | null>(null)
  const [petsAllowed, setPetsAllowed] = useState<boolean | null>(null)
  const [sort, setSort] = useState<SortOrder>("newest")
  const [showSaved, setShowSaved] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)

  const selected = properties.find((p) => p.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const list = properties.filter((p) => {
      if (showSaved && !shortlist.includes(p.id)) return false
      if (bhk !== null && p.bhk !== bhk) return false
      if (maxBudget !== null && p.rent > maxBudget) return false
      if (!matchesTenantFilter(p.tenantPreference, tenantPreference)) return false
      if (petsAllowed !== null && p.petsAllowed !== petsAllowed) return false
      if (q && !`${p.locality} ${p.city} ${p.address} ${p.title}`.toLowerCase().includes(q)) return false
      return true
    })
    return list.sort((a, b) => {
      if (sort === "rent-asc") return a.rent - b.rent
      if (sort === "rent-desc") return b.rent - a.rent
      return b.postedAt - a.postedAt
    })
  }, [properties, deferredQuery, bhk, maxBudget, tenantPreference, petsAllowed, sort, showSaved, shortlist])

  const hasFilters =
    query !== "" || bhk !== null || maxBudget !== null || tenantPreference !== null || petsAllowed !== null || showSaved

  const clearFilters = () => {
    setQuery("")
    setBhk(null)
    setMaxBudget(null)
    setTenantPreference(null)
    setPetsAllowed(null)
    setShowSaved(false)
  }

  const openDetails = (property: Property) => {
    setSelectedId(property.id)
    setDetailsOpen(true)
  }

  const openContact = (property: Property) => {
    setSelectedId(property.id)
    setDetailsOpen(false)
    setContactOpen(true)
  }

  const handlePost = async (input: NewPropertyInput) => {
    const result = await addProperty(input).catch(() => ({ ok: false as const, error: "Network error" }))
    if (!result.ok) {
      toast.error("Couldn't publish listing", { description: result.error })
      return false
    }
    const property = result.property
    setPostOpen(false)
    clearFilters()
    setSort("newest")
    toast.success("Your property is live!", { description: `${property.title} · ${property.locality}` })
    window.scrollTo({ top: 0, behavior: "smooth" })
    return true
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:border-x sm:border-border/60 sm:shadow-xl">
      <AppHeader query={query} onQueryChange={setQuery} onPostProperty={() => setPostOpen(true)}>
        <FilterChips
          bhk={bhk}
          onBhkChange={setBhk}
          maxBudget={maxBudget}
          onBudgetChange={setMaxBudget}
          tenantPreference={tenantPreference}
          onTenantChange={setTenantPreference}
          petsAllowed={petsAllowed}
          onPetsChange={setPetsAllowed}
        />
      </AppHeader>

      <main className="flex flex-1 flex-col gap-4 bg-muted/40 px-4 pt-4 pb-10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm whitespace-nowrap text-muted-foreground" aria-live="polite">
            <span className="font-bold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "home" : "homes"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSaved((v) => !v)}
              aria-pressed={showSaved}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition",
                showSaved
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-background text-foreground hover:bg-accent",
              )}
            >
              <Heart className={cn("size-3.5", showSaved && "fill-current")} aria-hidden="true" />
              Saved{shortlist.length > 0 ? ` (${shortlist.length})` : ""}
            </button>
            <label htmlFor="sort" className="sr-only">
              Sort properties
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="h-8 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
            >
              <option value="newest">Newest</option>
              <option value="rent-asc">Rent: Low to High</option>
              <option value="rent-desc">Rent: High to Low</option>
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {filtered.map((property, index) => (
              <li key={property.id}>
                <PropertyCard
                  property={property}
                  priority={index === 0}
                  shortlisted={isShortlisted(property.id)}
                  onToggleShortlist={() => toggle(property.id)}
                  onViewDetails={() => openDetails(property)}
                  onContact={() => openContact(property)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-background px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-foreground">No homes match your filters</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try a different locality or widen your budget.</p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full">
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </main>

      <PropertyDetailsDialog
        property={selected}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onContact={() => selected && openContact(selected)}
        shortlisted={selected ? isShortlisted(selected.id) : false}
        onToggleShortlist={() => selected && toggle(selected.id)}
      />
      <ContactOwnerDialog property={selected} open={contactOpen} onOpenChange={setContactOpen} />
      <PostPropertyDialog open={postOpen} onOpenChange={setPostOpen} onSubmit={handlePost} />

      <footer className="mt-auto border-t border-border/60 bg-background px-4 py-5 text-center">
        <p className="text-sm font-extrabold tracking-tight text-foreground">
          Direct<span className="text-primary">Nest</span>
        </p>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">No brokers. Just owners.</p>
      </footer>
    </div>
  )
}
