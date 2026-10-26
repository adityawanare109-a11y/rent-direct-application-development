"use client"

import { useState } from "react"
import { Copy, Loader2, MessageCircle, Phone, PhoneIncoming, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { logInquiry } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatINR, type Property } from "@/lib/properties"
import { bottomSheetClass } from "./sheet-styles"

type ContactOwnerDialogProps = {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPhone(phone: string) {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
}

export function ContactOwnerDialog({ property, open, onOpenChange }: ContactOwnerDialogProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sentFor, setSentFor] = useState<string | null>(null)

  const whatsappMessage = property
    ? `Hi ${property.ownerName}, I found your ${property.bhk} BHK in ${property.locality}, ${property.city} (${formatINR(property.rent)}/month) on DirectNest. Is it still available?`
    : ""

  const track = (channel: "call" | "whatsapp") => {
    if (property) logInquiry({ propertyId: property.id, channel }).catch(() => {})
  }

  const copyNumber = async () => {
    if (!property) return
    try {
      await navigator.clipboard.writeText(`+91${property.ownerPhone}`)
      toast.success("Phone number copied")
    } catch {
      toast.error("Couldn't copy number")
    }
  }

  const requestCallback = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!property || sending) return
    if (name.trim().length < 2 || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter your name and a valid 10-digit mobile number")
      return
    }
    setSending(true)
    const result = await logInquiry({
      propertyId: property.id,
      channel: "message",
      name: name.trim(),
      phone,
      message: message.trim(),
    }).catch(() => ({ ok: false }))
    setSending(false)
    if (!result.ok) {
      toast.error("Couldn't send your request. Please try again.")
      return
    }
    setSentFor(property.id)
    setMessage("")
    toast.success("Callback requested", { description: `${property.ownerName} will get your details.` })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={bottomSheetClass}>
        {property && (
          <div className="flex flex-col gap-5 p-5 pt-6">
            <div className="mx-auto h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
            <div className="flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-success/12 text-xl font-extrabold text-success">
                {property.ownerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <DialogTitle className="mt-3 text-lg font-extrabold">{property.ownerName}</DialogTitle>
              <DialogDescription className="mt-0.5">
                Owner of {property.bhk} BHK in {property.locality}
              </DialogDescription>
              <button
                type="button"
                onClick={copyNumber}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-base font-bold tracking-wide text-foreground transition hover:bg-accent"
                aria-label={`Copy phone number ${formatPhone(property.ownerPhone)}`}
              >
                {formatPhone(property.ownerPhone)}
                <Copy className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                nativeButton={false}
                render={<a href={`tel:+91${property.ownerPhone}`} onClick={() => track("call")} />}
                className="h-12 rounded-full text-base font-semibold"
              >
                <Phone className="size-5" aria-hidden="true" />
                Call Owner
              </Button>
              <Button
                nativeButton={false}
                render={
                  <a
                    href={`https://wa.me/91${property.ownerPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("whatsapp")}
                  />
                }
                className="h-12 rounded-full bg-whatsapp text-base font-semibold text-white hover:bg-whatsapp/90"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Chat on WhatsApp
              </Button>
            </div>

            <form onSubmit={requestCallback} noValidate className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <PhoneIncoming className="size-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold">Or request a callback</h3>
              </div>
              {sentFor === property.id ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Request sent. The owner will reach out to you shortly.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inquiry-name">Your name</Label>
                      <Input
                        id="inquiry-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        maxLength={50}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inquiry-phone">Mobile</Label>
                      <Input
                        id="inquiry-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="inquiry-message">Message (optional)</Label>
                    <Textarea
                      id="inquiry-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Best time to call, move-in date…"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={sending} className="h-11 rounded-full font-semibold">
                    {sending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {sending ? "Sending…" : "Request Callback"}
                  </Button>
                </>
              )}
            </form>

            <p className="flex items-start gap-2 rounded-2xl bg-success/10 p-3 text-xs leading-relaxed text-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              You&apos;re talking directly to the owner. Never pay any token amount before visiting the property.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
