"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Dish } from "@/lib/menu-data";

export type CartItem = {
  dish: Pick<Dish, "id" | "name" | "price">;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type OrderCartApi = {
  items: CartItem[];
  totalItems: number;
  add: (dish: Pick<Dish, "id" | "name" | "price">, qty?: number) => void;
  increment: (dishId: string) => void;
  decrement: (dishId: string) => void;
  remove: (dishId: string) => void;
  clear: () => void;
  setQuantity: (dishId: string, quantity: number) => void;
};

const STORAGE_KEY = "order_cart_v1";

const OrderCartContext = createContext<OrderCartApi | null>(null);

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(99, Math.max(0, Math.floor(qty)));
}

type StoredCartState = {
  items: Array<{
    dish?: { id?: unknown; name?: unknown; price?: unknown };
    quantity?: unknown;
  }>;
};

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [] });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const stored = parsed as Partial<StoredCartState>;
      if (!stored.items || !Array.isArray(stored.items)) return;
      setState({
        items: stored.items
          .filter((it) => it && typeof it === "object")
          .map((it) => {
            const dish = (it as StoredCartState["items"][number]).dish ?? {};
            return {
              dish: {
                id: String(dish.id ?? ""),
                name: String(dish.name ?? ""),
                price: String(dish.price ?? ""),
              },
              quantity: clampQty(Number((it as StoredCartState["items"][number]).quantity ?? 1)),
            };
          })
          .filter((it) => it.dish.id && it.dish.name && it.quantity > 0),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setQuantity = useCallback((dishId: string, quantity: number) => {
    const q = clampQty(quantity);
    setState((s) => {
      const idx = s.items.findIndex((it) => it.dish.id === dishId);
      if (idx === -1) return s;
      if (q <= 0) {
        return { items: s.items.filter((it) => it.dish.id !== dishId) };
      }
      const next = s.items.slice();
      next[idx] = { ...next[idx], quantity: q };
      return { items: next };
    });
  }, []);

  const add = useCallback((dish: Pick<Dish, "id" | "name" | "price">, qty = 1) => {
    const q = clampQty(qty);
    if (q <= 0) return;
    setState((s) => {
      const idx = s.items.findIndex((it) => it.dish.id === dish.id);
      if (idx === -1) return { items: [...s.items, { dish, quantity: q }] };
      const next = s.items.slice();
      next[idx] = { ...next[idx], quantity: clampQty(next[idx].quantity + q) };
      return { items: next };
    });
  }, []);

  const increment = useCallback((dishId: string) => {
    setState((s) => {
      const idx = s.items.findIndex((it) => it.dish.id === dishId);
      if (idx === -1) return s;
      const next = s.items.slice();
      next[idx] = { ...next[idx], quantity: clampQty(next[idx].quantity + 1) };
      return { items: next };
    });
  }, []);

  const decrement = useCallback((dishId: string) => {
    setState((s) => {
      const idx = s.items.findIndex((it) => it.dish.id === dishId);
      if (idx === -1) return s;
      const current = s.items[idx];
      const nextQty = clampQty(current.quantity - 1);
      if (nextQty <= 0) return { items: s.items.filter((it) => it.dish.id !== dishId) };
      const next = s.items.slice();
      next[idx] = { ...next[idx], quantity: nextQty };
      return { items: next };
    });
  }, []);

  const remove = useCallback((dishId: string) => {
    setState((s) => ({ items: s.items.filter((it) => it.dish.id !== dishId) }));
  }, []);

  const clear = useCallback(() => setState({ items: [] }), []);

  const totalItems = useMemo(
    () => state.items.reduce((acc, it) => acc + (Number.isFinite(it.quantity) ? it.quantity : 0), 0),
    [state.items]
  );

  const value = useMemo<OrderCartApi>(
    () => ({
      items: state.items,
      totalItems,
      add,
      increment,
      decrement,
      remove,
      clear,
      setQuantity,
    }),
    [add, clear, decrement, increment, remove, setQuantity, state.items, totalItems]
  );

  return <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>;
}

export function useOrderCart() {
  const ctx = useContext(OrderCartContext);
  if (!ctx) throw new Error("useOrderCart must be used within OrderCartProvider");
  return ctx;
}

