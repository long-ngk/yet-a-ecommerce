import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(1, "Shipping address must not be empty"),
  paymentMethod: z.string().min(1, "Payment method must not be empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
