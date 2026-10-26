"use client"

import { useState } from "react"
import { ChevronDown, IndianRupee, PawPrint, Users } from "lucide-react"
import { BUDGET_OPTIONS, TENANT_PREFERENCE_OPTIONS, type Bhk, type TenantPreference } from "@/lib/properties"
import { cn } from "@/lib/utils"

type FilterChipsProps = {
  bhk: Bhk | null
  onBhkChange: (value: Bhk | null) => void
  maxBudget: number | null
  onBudgetChange: (value: number | null) => void
  tenantPreference: TenantPreference | null
  onTenantChange: (value: TenantPreference | null) => void
  petsAllowed: boolean | null
  onPetsChange: (value: boolean | null) => void
}

const BHK_OPTIONS: Bhk[] = [1, 2, 3]
const TENANT_CHIP_LABEL: Record<TenantPreference, string> = {
  "Family Only": "Family",
  "Bachelors (Men / Women)": "Bachelors",
  "Any / Both": "Any tenant",
}

function Chip({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent",
        className,
      )}
      {...props}
    />
  )
}

export function FilterChips({
  bhk,
  onBhkChange,
  maxBudget,
  onBudgetChange,
  tenantPreference,
  onTenantChange,
  petsAllowed,
  onPetsChange,
}: FilterChipsProps) {
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [tenantOpen, setTenantOpen] = useState(false)
  const budgetLabel = BUDGET_OPTIONS.find((o) => o.value === maxBudget)?.label

  return (
    <div className="pb-3">
      <div
        className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Filters"
      >
        {BHK_OPTIONS.map((option) => (
          <Chip key={option} active={bhk === option} onClick={() => onBhkChange(bhk === option ? null : option)}>
            {option} BHK
          </Chip>
        ))}
        <Chip
          active={maxBudget !== null}
          aria-expanded={budgetOpen}
          aria-controls="budget-options"
          onClick={() => {
            setBudgetOpen((open) => !open)
            setTenantOpen(false)
          }}
        >
          <IndianRupee className="size-3.5" aria-hidden="true" />
          {budgetLabel ?? "Budget"}
          <ChevronDown className={cn("size-3.5 transition-transform", budgetOpen && "rotate-180")} aria-hidden="true" />
        </Chip>
        <Chip
          active={tenantPreference !== null}
          aria-expanded={tenantOpen}
          aria-controls="tenant-options"
          onClick={() => {
            setTenantOpen((open) => !open)
            setBudgetOpen(false)
          }}
        >
          <Users className="size-3.5" aria-hidden="true" />
          {tenantPreference ? TENANT_CHIP_LABEL[tenantPreference] : "Tenant"}
          <ChevronDown className={cn("size-3.5 transition-transform", tenantOpen && "rotate-180")} aria-hidden="true" />
        </Chip>
        <Chip
          active={petsAllowed === true}
          onClick={() => onPetsChange(petsAllowed === true ? null : true)}
        >
          <PawPrint className="size-3.5" aria-hidden="true" />
          Pets allowed
        </Chip>
        <Chip
          active={petsAllowed === false}
          onClick={() => onPetsChange(petsAllowed === false ? null : false)}
        >
          No pets
        </Chip>
      </div>

      {budgetOpen && (
        <div
          id="budget-options"
          className="mt-2 flex gap-2 overflow-x-auto px-4 animate-in fade-in-0 slide-in-from-top-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Budget"
        >
          {BUDGET_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              active={maxBudget === option.value}
              className="h-8 px-3 text-xs"
              onClick={() => {
                onBudgetChange(maxBudget === option.value ? null : option.value)
                setBudgetOpen(false)
              }}
            >
              {option.label}
            </Chip>
          ))}
          {maxBudget !== null && (
            <Chip
              active={false}
              className="h-8 px-3 text-xs text-muted-foreground"
              onClick={() => {
                onBudgetChange(null)
                setBudgetOpen(false)
              }}
            >
              Any budget
            </Chip>
          )}
        </div>
      )}

      {tenantOpen && (
        <div
          id="tenant-options"
          className="mt-2 flex gap-2 overflow-x-auto px-4 animate-in fade-in-0 slide-in-from-top-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Tenant preference"
        >
          {TENANT_PREFERENCE_OPTIONS.map((option) => (
            <Chip
              key={option}
              active={tenantPreference === option}
              className="h-8 px-3 text-xs"
              onClick={() => {
                onTenantChange(tenantPreference === option ? null : option)
                setTenantOpen(false)
              }}
            >
              {option}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
