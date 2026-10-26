import { cookies } from "next/headers"

export const VISITOR_COOKIE = "rd_vid"
const ONE_YEAR = 60 * 60 * 24 * 365

const VISITOR_ID_PATTERN = /^[0-9a-f-]{36}$/

export async function readVisitorId() {
  const value = (await cookies()).get(VISITOR_COOKIE)?.value
  return value && VISITOR_ID_PATTERN.test(value) ? value : null
}

/** Only callable from Server Actions / Route Handlers, where cookies can be written. */
export async function ensureVisitorId() {
  const existing = await readVisitorId()
  if (existing) return existing
  const id = crypto.randomUUID()
  ;(await cookies()).set(VISITOR_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: ONE_YEAR,
  })
  return id
}
