"use client"

import { Home, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type AppHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  onPostProperty: () => void
  children?: React.ReactNode
}

export function AppHeader({ query, onQueryChange, onPostProperty, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <a href="#" className="flex items-center gap-2.5" aria-label="DirectNest home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Home className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Direct<span className="text-primary">Nest</span>
            </span>
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">No brokers. Just owners.</span>
          </span>
        </a>
        <Button onClick={onPostProperty} className="h-9 rounded-full px-3.5 font-semibold shadow-sm">
          <Plus className="size-4" aria-hidden="true" />
          Post Property
        </Button>
      </div>

      <div className="px-4 pb-3">
        <label htmlFor="search" className="sr-only">
          Search by locality in Parbhani
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search locality, e.g. Shivaji Nagar"
            autoComplete="off"
            className="h-11 w-full rounded-full border border-border bg-muted/60 pr-10 pl-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {children}
    </header>
  )
}
