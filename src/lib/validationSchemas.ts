import { z } from "zod";

// Common validation patterns
const NAME_MAX_LENGTH = 100;
const ADDRESS_MAX_LENGTH = 255;
const POSTAL_CODE_PATTERN = /^[0-9]{5}$/;
// More permissive phone pattern that allows common international formats
const PHONE_PATTERN = /^[+]?[\d\s\-().\/]{6,30}$/;
const MIN_YEAR = 1800;
const MAX_YEAR = new Date().getFullYear() + 5;

// Building validation schema
export const buildingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(NAME_MAX_LENGTH, `Name darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  address: z
    .string()
    .trim()
    .min(1, "Adresse ist erforderlich")
    .max(ADDRESS_MAX_LENGTH, `Adresse darf maximal ${ADDRESS_MAX_LENGTH} Zeichen lang sein`),
  city: z
    .string()
    .trim()
    .min(1, "Stadt ist erforderlich")
    .max(NAME_MAX_LENGTH, `Stadt darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  postal_code: z
    .string()
    .trim()
    .regex(POSTAL_CODE_PATTERN, "PLZ muss 5 Ziffern haben"),
  building_type: z.enum(["apartment", "house", "commercial", "mixed"]),
  year_built: z
    .string()
    .optional()
    .refine(
      (val) => !val || (parseInt(val) >= MIN_YEAR && parseInt(val) <= MAX_YEAR),
      `Baujahr muss zwischen ${MIN_YEAR} und ${MAX_YEAR} liegen`
    ),
  total_area: z
    .string()
    .optional()
    .refine(
      (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 1000000),
      "Fläche muss größer als 0 und kleiner als 1.000.000 m² sein"
    ),
});

// Tenant validation schema
export const tenantSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Vorname ist erforderlich")
    .max(NAME_MAX_LENGTH, `Vorname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  last_name: z
    .string()
    .trim()
    .min(1, "Nachname ist erforderlich")
    .max(NAME_MAX_LENGTH, `Nachname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail darf maximal 255 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Ungültige Telefonnummer")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(ADDRESS_MAX_LENGTH, `Adresse darf maximal ${ADDRESS_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(NAME_MAX_LENGTH, `Stadt darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal("")),
  postal_code: z
    .string()
    .trim()
    .refine(
      (val) => !val || POSTAL_CODE_PATTERN.test(val),
      "PLZ muss 5 Ziffern haben"
    )
    .optional()
    .or(z.literal("")),
});

// Organization validation schema
export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organisationsname ist erforderlich")
    .max(NAME_MAX_LENGTH, `Name darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  address: z
    .string()
    .trim()
    .max(ADDRESS_MAX_LENGTH, `Adresse darf maximal ${ADDRESS_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal(""))
    .transform((val) => val || ""),
  city: z
    .string()
    .trim()
    .max(NAME_MAX_LENGTH, `Stadt darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal(""))
    .transform((val) => val || ""),
  postal_code: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || "")
    .refine(
      (val) => val === "" || POSTAL_CODE_PATTERN.test(val),
      "PLZ muss 5 Ziffern haben"
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || "")
    .refine(
      (val) => val === "" || PHONE_PATTERN.test(val),
      "Ungültige Telefonnummer"
    ),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || "")
    .refine(
      (val) => val === "" || z.string().email().safeParse(val).success,
      "Ungültige E-Mail-Adresse"
    ),
});

// Profile validation schema
export const profileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .max(NAME_MAX_LENGTH, `Vorname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal("")),
  last_name: z
    .string()
    .trim()
    .max(NAME_MAX_LENGTH, `Nachname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`)
    .optional()
    .or(z.literal("")),
});

// Password validation schema with stronger requirements
export const passwordSchema = z
  .string()
  .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
  .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
  .regex(/[a-z]/, "Passwort muss mindestens einen Kleinbuchstaben enthalten")
  .regex(/[0-9]/, "Passwort muss mindestens eine Zahl enthalten");

// Registration validation schema
export const registrationSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Vorname ist erforderlich")
    .max(NAME_MAX_LENGTH, `Vorname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  lastName: z
    .string()
    .trim()
    .min(1, "Nachname ist erforderlich")
    .max(NAME_MAX_LENGTH, `Nachname darf maximal ${NAME_MAX_LENGTH} Zeichen lang sein`),
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail darf maximal 255 Zeichen lang sein"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export type BuildingFormData = z.infer<typeof buildingSchema>;
export type TenantFormData = z.infer<typeof tenantSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
