import { z } from "zod";

export const productsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be a positive integer")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be a positive integer")
    .optional()
    .default(20),
  sort: z
    .enum(["price_asc", "price_desc", "name_asc", "newest"], {
      errorMap: () => ({
        message: "Sort must be one of: price_asc, price_desc, name_asc, newest",
      }),
    })
    .optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});

export type ProductsQueryInput = z.infer<typeof productsQuerySchema>;
