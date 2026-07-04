import { z } from "zod";

// Accepts common phone formats: +84..., 0..., international with spaces/dashes/parens
const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name must not be empty").optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number format")
    .optional(),
  address: z.string().optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
