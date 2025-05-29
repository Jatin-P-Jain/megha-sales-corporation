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
  writeBatch,
  FirestoreError,
  getDoc,
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
  cartProducts: CartProduct[];
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
  setCartProducts: (cartProducts: CartProduct[]) => void;
  /** ← new: wipe both Firestore _and_ local state */
  resetCartContext: () => Promise<void>;
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
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError>();

  // Firestore listener
  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setLoading(false);
      return;
    }
    const itemsCol = collection(firestore, "carts", currentUser.uid, "items");
    const unsub = onSnapshot(
      itemsCol,
      (snap) => {
        const data = snap.docs.map((d) => ({
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

  useEffect(() => {
    if (!currentUser) {
      setCartProducts([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const proms = cart.map(async ({ productId, quantity }) => {
          const snap = await getDoc(doc(firestore, "products", productId));
          const data = snap.data() || {};
          return {
            id: snap.id,
            partName: data.partName as string,
            partNumber: data.partNumber as string,
            image: data.image as string,
            price: data.price as number,
            discount: data.discount as number,
            gst: data.gst as number,
            quantity,
          } as CartProduct;
        });
        const results = await Promise.all(proms);
        if (active) setCartProducts(results);
      } catch (e) {
        console.error("Failed to fetch products for cart:", e);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [cart, currentUser]);

  // existing CRUD methods…
  const addToCart = async (
    productId: string,
    productPricing: { price?: number; discount?: number; gst?: number },
    qty = 1,
  ) => {
    if (!currentUser) throw new Error("Not authenticated");
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    await setDoc(ref, { quantity: qty, productPricing }, { merge: true });
  };

  const removeFromCart = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    await deleteDoc(ref);
  };

  const increment = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
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
    const batch = writeBatch(firestore);
    cart.forEach((i) => {
      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        i.productId,
      );
      batch.delete(ref);
    });
    await batch.commit();
  };

  // ← New: reset _both_ Firestore _and_ local state
  const resetCartContext = async () => {
    // 1) clear remote
    if (currentUser) {
      const batch = writeBatch(firestore);
      cart.forEach((i) => {
        const ref = doc(
          firestore,
          "carts",
          currentUser.uid,
          "items",
          i.productId,
        );
        batch.delete(ref);
      });
      await batch.commit();
    }
    // 2) clear local
    setCart([]);
    setCartProducts([]);
    setLoading(false);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartProducts,
        loading,
        error,
        addToCart,
        removeFromCart,
        clearCart,
        increment,
        decrement,
        setCartProducts,
        resetCartContext,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
