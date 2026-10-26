import { getProperties, getSavedPropertyIds } from "@/app/actions"
import { RentApp } from "@/components/rent/rent-app"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [properties, savedIds] = await Promise.all([getProperties(), getSavedPropertyIds()])
  return <RentApp initialProperties={properties} initialSavedIds={savedIds} />
}
