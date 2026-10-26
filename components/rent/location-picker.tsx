"use client"

import { useMemo } from "react"
import { MapPin } from "lucide-react"
import {
  ACTIVE_CITY,
  listingAddress,
  nearestLocality,
  type CityConfig,
  type Locality,
} from "@/lib/cities"
import { cn } from "@/lib/utils"

export type MapPinValue = {
  locality: string
  address: string
  lat: number
  lng: number
}

type LocationPickerProps = {
  city?: CityConfig
  value: MapPinValue | null
  onChange: (value: MapPinValue) => void
  error?: string
}

function lon2x(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom
}

function lat2y(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom
}

function x2lon(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180
}

function y2lat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function pinFromLatLng(lat: number, lng: number, city: CityConfig): MapPinValue {
  const nearest = nearestLocality(lat, lng, city)
  const dist = Math.hypot(nearest.lat - lat, nearest.lng - lng)
  const near = dist > 0.006
  return {
    locality: nearest.name,
    address: listingAddress(nearest.name, city, near),
    lat,
    lng,
  }
}

export function LocationPicker({ city = ACTIVE_CITY, value, onChange, error }: LocationPickerProps) {
  const zoom = city.zoom
  const tiles = useMemo(() => {
    const minX = Math.floor(lon2x(city.bounds.west, zoom))
    const maxX = Math.floor(lon2x(city.bounds.east, zoom))
    const minY = Math.floor(lat2y(city.bounds.north, zoom))
    const maxY = Math.floor(lat2y(city.bounds.south, zoom))
    return { minX, maxX, minY, maxY, cols: maxX - minX + 1, rows: maxY - minY + 1 }
  }, [city, zoom])

  const toPercent = (lat: number, lng: number) => {
    const x = lon2x(lng, zoom)
    const y = lat2y(lat, zoom)
    return {
      left: ((x - tiles.minX) / tiles.cols) * 100,
      top: ((y - tiles.minY) / tiles.rows) * 100,
    }
  }

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top
    const worldX = tiles.minX + (px / rect.width) * tiles.cols
    const worldY = tiles.minY + (py / rect.height) * tiles.rows
    onChange(pinFromLatLng(y2lat(worldY, zoom), x2lon(worldX, zoom), city))
  }

  const dropLocality = (locality: Locality) => {
    onChange({
      locality: locality.name,
      address: listingAddress(locality.name, city),
      lat: locality.lat,
      lng: locality.lng,
    })
  }

  const pin = value ? toPercent(value.lat, value.lng) : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">City & location</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {city.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Tap the map or a locality to drop a pin. Address fills in automatically.</p>

      <div
        role="application"
        aria-label={`${city.name} location picker`}
        onClick={handleMapClick}
        className={cn(
          "relative max-h-52 overflow-hidden rounded-2xl border bg-muted",
          error ? "border-destructive" : "border-border",
        )}
        style={{ aspectRatio: `${tiles.cols} / ${tiles.rows}` }}
      >
        <div
          className="grid size-full"
          style={{ gridTemplateColumns: `repeat(${tiles.cols}, 1fr)`, gridTemplateRows: `repeat(${tiles.rows}, 1fr)` }}
        >
          {Array.from({ length: tiles.rows }, (_, row) =>
            Array.from({ length: tiles.cols }, (_, col) => {
              const x = tiles.minX + col
              const y = tiles.minY + row
              return (
                // OSM tiles — raster background for the pin picker
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${x}-${y}`}
                  src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
                  alt=""
                  draggable={false}
                  className="pointer-events-none size-full select-none object-cover"
                />
              )
            }),
          )}
        </div>

        {city.localities.map((locality) => {
          const pos = toPercent(locality.lat, locality.lng)
          const active = value?.locality === locality.name
          return (
            <button
              key={locality.name}
              type="button"
              aria-label={`Drop pin at ${locality.name}`}
              onClick={(event) => {
                event.stopPropagation()
                dropLocality(locality)
              }}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <span
                className={cn(
                  "mb-0.5 block max-w-20 truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold shadow-sm",
                  active ? "bg-primary text-primary-foreground" : "bg-background/90 text-foreground",
                )}
              >
                {locality.name}
              </span>
              <MapPin
                className={cn("mx-auto size-5 drop-shadow-sm", active ? "fill-primary text-primary" : "text-foreground")}
                aria-hidden="true"
              />
            </button>
          )
        })}

        {pin && (
          <span
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
          >
            <MapPin className="size-8 fill-destructive text-destructive drop-shadow" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {city.localities.map((locality) => {
          const active = value?.locality === locality.name
          return (
            <button
              key={locality.name}
              type="button"
              onClick={() => dropLocality(locality)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3 text-xs font-semibold",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent",
              )}
            >
              {locality.name}
            </button>
          )
        })}
      </div>

      {value && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold text-foreground">{value.locality}</span>
            {" · "}
            {value.address}
          </span>
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">Map data © OpenStreetMap contributors</p>
    </div>
  )
}
