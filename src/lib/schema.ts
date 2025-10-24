import { z } from "zod";

export const createGroupOrderSchema = z.object({
  menuId: z.string().cuid(),
  slug: z.string().min(3),
  deadlineTs: z.string().datetime().or(z.string().min(1)),
  deliveryCostGs: z.coerce.number().int().nonnegative(),
  minTotalGs: z.coerce.number().int().nonnegative().optional(),
  minItems: z.coerce.number().int().nonnegative().optional(),
  splitStrategy: z.enum(["EVEN", "WEIGHTED"]).default("EVEN"),
  adminPin: z.string().min(3),
});

export const createOrderLineSchema = z.object({
  name: z.string().min(1),
  whatsapp: z.string().min(6),
  payMethod: z.enum(["TC", "TD", "TRANSFER", "CASH", "QR"]),
  itemId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  note: z.string().max(300).optional(),
});
