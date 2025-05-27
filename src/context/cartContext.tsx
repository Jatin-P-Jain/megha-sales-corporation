// src/context/cart-context.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  FirestoreError,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { firestore } from "@/firebase/client";
import { CartProduct } from "@/types/cartProduct";

export type CartItem = {
  productId: string;
  productPricing: {
    price?: number;
    discount?: number;
    gst?: number;
  };
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  itemsWithQty: CartProduct[];
  loading: boolean;
  error?: FirestoreError;
  addToCart: (
    productId: string,
    productPricing: { price?: number; discount?: number; gst?: number },
    qty?: number,
  ) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  increment: (productId: string) => Promise<void>;
  decrement: (productId: string) => Promise<void>;
  setItemsWithQty: (items: CartProduct[]) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError>();
  const [itemsWithQty, setItemsWithQty] = useState<CartProduct[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setLoading(false);
      return;
    }

    // Listen to `/carts/{uid}/items`
    const itemsCol = collection(firestore, "carts", currentUser.uid, "items");
    const unsub = onSnapshot(
      itemsCol,
      (snap) => {
        const data: CartItem[] = snap.docs.map((d) => ({
          productId: d.id,
          productPricing: d.data().productPricing || {},
          quantity: (d.data().quantity as number) || 0,
        }));
        setCart(data);
        setLoading(false);
      },
      (err) => {
        console.error("Cart onSnapshot error", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [currentUser]);

  const addToCart = async (
    productId: string,
    productPricing: { price?: number; discount?: number; gst?: number },
    qty = 1,
  ) => {
    if (!currentUser) throw new Error("Not authenticated");
    const itemRef = doc(
      firestore,
      "carts",
      currentUser.uid,
      "items",
      productId,
    );
    // overwrite or create with new quantity
    await setDoc(itemRef, { quantity: qty, productPricing }, { merge: true });
  };

  const removeFromCart = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const itemRef = doc(
      firestore,
      "carts",
      currentUser.uid,
      "items",
      productId,
    );
    await deleteDoc(itemRef);
  };
  // inside your CartProvider, after addToCart/removeFromCart…

  const increment = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    // find existing quantity
    const existing = cart.find((i) => i.productId === productId);
    const newQty = existing ? existing.quantity + 1 : 1;
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    await setDoc(ref, { quantity: newQty }, { merge: true });
  };

  const decrement = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const existing = cart.find((i) => i.productId === productId);
    if (!existing) return;
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    if (existing.quantity > 1) {
      await setDoc(ref, { quantity: existing.quantity - 1 }, { merge: true });
    } else {
      await deleteDoc(ref);
    }
  };

  const clearCart = async () => {
    if (!currentUser) throw new Error("Not authenticated");
    // you could batch‐delete all docs under `/carts/{uid}/items`
    const batch = writeBatch(firestore);
    cart.forEach((i) => {
      const itemRef = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        i.productId,
      );
      batch.delete(itemRef);
    });
    await batch.commit();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemsWithQty,
        loading,
        error,
        addToCart,
        removeFromCart,
        clearCart,
        increment,
        decrement,
        setItemsWithQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
