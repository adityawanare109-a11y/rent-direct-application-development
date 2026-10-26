import { boolean, integer, pgTable, primaryKey, real, serial, text, timestamp } from "drizzle-orm/pg-core"

export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  locality: text("locality").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  bhk: integer("bhk").notNull(),
  rent: integer("rent").notNull(),
  deposit: integer("deposit").notNull(),
  furnishing: text("furnishing").notNull(),
  areaSqft: integer("area_sqft").notNull(),
  floor: text("floor").notNull().default(""),
  availableFrom: text("available_from").notNull().default("Immediately"),
  tenantPreference: text("tenant_preference").notNull().default("Any / Both"),
  petsAllowed: boolean("pets_allowed").notNull().default(false),
  amenities: text("amenities").array().notNull().default([]),
  image: text("image").notNull(),
  images: text("images").array().notNull().default([]),
  video: text("video"),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: text("property_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  channel: text("channel").notNull(),
  name: text("name"),
  phone: text("phone"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const savedHomes = pgTable(
  "saved_homes",
  {
    visitorId: text("visitor_id").notNull(),
    propertyId: text("property_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.visitorId, table.propertyId] })],
)
