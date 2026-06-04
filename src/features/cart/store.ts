"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
}

function lineIdFor(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (product, variant, quantity = 1) =>
        set((state) => {
          const lineId = lineIdFor(product.id, variant.id);
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.lineId === lineId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          const item: CartItem = {
            lineId,
            productId: product.id,
            handle: product.handle,
            title: product.title,
            image: product.images[0]?.url ?? "",
            variantId: variant.id,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            quantity,
          };
          return { isOpen: true, items: [...state.items, item] };
        }),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) =>
                  i.lineId === lineId ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "lining-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.quantity, 0);

export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
