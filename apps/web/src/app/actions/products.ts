'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductVariant,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  ProductCategory,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '@agent-crm/shared';
import { logActivity } from './activities';

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

// === Product Categories ===

export async function getProductCategories(): Promise<ProductCategory[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data as ProductCategory[];
}

export async function createProductCategory(input: CreateProductCategoryInput): Promise<ProductCategory> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('product_categories')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const category = data as ProductCategory;
  await logActivity(supabase, {
    userId,
    entityType: 'product_category',
    entityId: category.id,
    eventType: 'created',
    actor: 'human',
    metadata: { name: category.name },
  });
  return category;
}

export async function updateProductCategory(id: string, input: UpdateProductCategoryInput): Promise<ProductCategory> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('product_categories')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const category = data as ProductCategory;
  await logActivity(supabase, {
    userId,
    entityType: 'product_category',
    entityId: category.id,
    eventType: 'updated',
    actor: 'human',
    metadata: {},
  });
  return category;
}

export async function deleteProductCategory(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  await logActivity(supabase, {
    userId,
    entityType: 'product_category',
    entityId: id,
    eventType: 'deleted',
    actor: 'human',
    metadata: {},
  });
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// === Products ===

export async function getProducts(): Promise<(Product & { variants: ProductVariant[] })[]> {
  const { supabase, userId } = await getUserId();

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (productsError) throw new Error(productsError.message);

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('user_id', userId);
  if (variantsError) throw new Error(variantsError.message);

  const variantsByProductId = (variants as ProductVariant[]).reduce<Record<string, ProductVariant[]>>(
    (acc, variant) => {
      if (!acc[variant.product_id]) acc[variant.product_id] = [];
      acc[variant.product_id].push(variant);
      return acc;
    },
    {},
  );

  return (products as Product[]).map((product) => ({
    ...product,
    variants: variantsByProductId[product.id] ?? [],
  }));
}

export async function getProduct(id: string): Promise<Product & { variants: ProductVariant[] }> {
  const { supabase, userId } = await getUserId();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (productError) throw new Error(productError.message);

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .eq('user_id', userId);
  if (variantsError) throw new Error(variantsError.message);

  return {
    ...(product as Product),
    variants: (variants as ProductVariant[]) ?? [],
  };
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const product = data as Product;
  await logActivity(supabase, {
    userId,
    entityType: 'product',
    entityId: product.id,
    eventType: 'created',
    actor: 'human',
    metadata: { name: product.name },
  });
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const product = data as Product;
  await logActivity(supabase, {
    userId,
    entityType: 'product',
    entityId: product.id,
    eventType: 'updated',
    actor: 'human',
    metadata: {},
  });
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  await logActivity(supabase, {
    userId,
    entityType: 'product',
    entityId: id,
    eventType: 'deleted',
    actor: 'human',
    metadata: {},
  });
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// === Product Variants ===

export async function createProductVariant(productId: string, input: CreateProductVariantInput): Promise<ProductVariant> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('product_variants')
    .insert({ ...input, product_id: productId, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const variant = data as ProductVariant;
  await logActivity(supabase, {
    userId,
    entityType: 'product_variant',
    entityId: variant.id,
    eventType: 'created',
    actor: 'human',
    metadata: { name: variant.name, product_id: productId },
  });
  return variant;
}

export async function updateProductVariant(id: string, input: UpdateProductVariantInput): Promise<ProductVariant> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from('product_variants')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const variant = data as ProductVariant;
  await logActivity(supabase, {
    userId,
    entityType: 'product_variant',
    entityId: variant.id,
    eventType: 'updated',
    actor: 'human',
    metadata: {},
  });
  return variant;
}

export async function deleteProductVariant(id: string): Promise<void> {
  const { supabase, userId } = await getUserId();
  await logActivity(supabase, {
    userId,
    entityType: 'product_variant',
    entityId: id,
    eventType: 'deleted',
    actor: 'human',
    metadata: {},
  });
  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// === Search ===

export type ProductSearchResult = {
  product_id: string;
  variant_id?: string;
  name: string;
  sell_price: number | null;
  cost_price: number | null;
};

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const { supabase, userId } = await getUserId();
  const pattern = `%${query}%`;

  const [{ data: matchedProducts, error: productsError }, { data: matchedVariants, error: variantsError }] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, name, sell_price, cost_price')
        .eq('user_id', userId)
        .ilike('name', pattern),
      supabase
        .from('product_variants')
        .select('id, product_id, name, sell_price, cost_price, products!inner(name)')
        .eq('user_id', userId)
        .ilike('name', pattern),
    ]);

  if (productsError) throw new Error(productsError.message);
  if (variantsError) throw new Error(variantsError.message);

  const productResults: ProductSearchResult[] = (matchedProducts ?? []).map((p) => ({
    product_id: p.id,
    name: p.name,
    sell_price: p.sell_price,
    cost_price: p.cost_price,
  }));

  const variantResults: ProductSearchResult[] = (matchedVariants ?? []).map((v) => {
    const productName = (v.products as unknown as { name: string } | null)?.name ?? '';
    return {
      product_id: v.product_id,
      variant_id: v.id,
      name: productName ? `${productName} — ${v.name}` : v.name,
      sell_price: v.sell_price,
      cost_price: v.cost_price,
    };
  });

  // Merge and deduplicate, limit to 20
  const merged = [...productResults, ...variantResults].slice(0, 20);
  return merged;
}
