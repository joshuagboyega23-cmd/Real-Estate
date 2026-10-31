import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional().nullable(),
  country: z.string().min(2, "Country is required"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  amenities: z.array(z.string()),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(50),
  description: z.string().max(1000).optional().nullable(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  rentAmount: z.number().positive("Rent must be a positive number"),
  rentPeriod: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "YEARLY"]),
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE"]),
  features: z.array(z.string()),
});

export type UnitInput = z.infer<typeof unitSchema>;
