import { z } from 'zod';

// === Product Category ===
export const ProductCategorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  sort_order: z.number(),
  created_at: z.string(),
});

export const CreateProductCategorySchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().optional(),
});

export const UpdateProductCategorySchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().optional(),
});

// === Product ===
export const ProductSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.string().uuid().nullable(),
  sell_price: z.number().nullable(),
  cost_price: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  sell_price: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  sell_price: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
});

// === Product Variant ===
export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  attributes: z.record(z.string(), z.any()).default({}),
  sell_price: z.number().nullable(),
  cost_price: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProductVariantSchema = z.object({
  name: z.string().min(1),
  attributes: z.record(z.string(), z.any()).optional(),
  sell_price: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
});

export const UpdateProductVariantSchema = z.object({
  name: z.string().min(1).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  sell_price: z.number().nullable().optional(),
  cost_price: z.number().nullable().optional(),
});

// === Type exports ===
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type CreateProductCategoryInput = z.infer<typeof CreateProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof UpdateProductCategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type CreateProductVariantInput = z.infer<typeof CreateProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof UpdateProductVariantSchema>;
