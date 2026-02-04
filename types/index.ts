import type { Product, Category, CartItem } from '@prisma/client';

export type { Product, Category, CartItem };

export type ProductWithCategory = Product & {
  category: Category | null;
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};
