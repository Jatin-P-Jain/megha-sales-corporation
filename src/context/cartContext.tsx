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
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { firestore } from "@/firebase/client";
import { CartProduct } from "@/types/cartProduct";
import { Product } from "@/types/product";
import { mapProductToClientProduct, organizeCartProducts } from "@/lib/utils";

export type CartItem = {
  id: string; // Firestore document ID
  productId: string;
  cartItemKey: string;
  productPricing: {
    price?: number;
    discount?: number;
    gst?: number;
  };
  quantity: number;
  selectedSize?: string;
};
export type CartTotals = {
  totalUnits: number;
  totalItems: number;
  totalAmount: number; // after discount & GST
  totalDiscount: number; // total discount applied
  totalGST: number; // total GST applied
  totalNetAmount: number; // total after discount & GST
  totalSavings: number; // total savings from discounts
};

type CartContextType = {
  cart: CartItem[];
  cartProducts: CartProduct[];
  loading: boolean;
  error?: FirestoreError;
  cartTotals: CartTotals;
  addToCart: (
    productId: string,
    productPricing: { price?: number; discount?: number; gst?: number },
    selectedSize?: string,
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
  const [cartTotals, setCartTotals] = useState<CartTotals>({} as CartTotals);
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
    const orderedQuery = query(itemsCol, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      orderedQuery,
      (snap) => {
        const data = snap.docs.map((d) => {
          return {
            id: d.id,
            productId: d.data().productId,
            cartItemKey: d.data().cartItemKey,
            productPricing: d.data().productPricing || {},
            quantity: (d.data().quantity as number) || 0,
            selectedSize: d.data().selectedSize as string | undefined,
          };
        });
        let totalUnits = 0;
        let totalDiscount = 0;
        let totalGST = 0;
        let totalAmount = 0;
        data.forEach((item) => {
          const qty = item.quantity;
          const {
            price = 0,
            discount = 0,
            gst = 0,
          } = item.productPricing || {};

          const unitDiscount = Math.round((discount / 100) * price);
          const unitPriceAfterDiscount = Math.round(price - unitDiscount);
          const unitGST = Math.round((gst / 100) * unitPriceAfterDiscount);
          const unitNetPrice = Math.round(unitPriceAfterDiscount + unitGST);
          const totalPrice = Math.round(unitNetPrice * qty);
          const discountAmt = Math.round(unitDiscount * qty);
          const gstAmt = Math.round(unitGST * qty);
          const finalAmount = totalPrice;

          totalUnits += qty;
          totalDiscount += discountAmt;
          totalGST += gstAmt;
          totalAmount += finalAmount;
        });

        const round = Math.round;
        setCartTotals({
          totalUnits: round(totalUnits),
          totalItems: data.length,
          totalAmount: round(totalAmount),
          totalDiscount: round(totalDiscount),
          totalGST: round(totalGST),
          totalNetAmount: round(totalAmount), // or round(discountedTotal + gst) if you separate
          totalSavings: round(totalDiscount),
        });
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
        const proms = cart.map(
          async ({
            productId,
            quantity,
            selectedSize,
            cartItemKey,
            productPricing,
          }) => {
            const snap = await getDoc(doc(firestore, "products", productId));
            const data = snap.data() || {};
            return {
              id: snap.id,
              product: mapProductToClientProduct(data),
              quantity,
              selectedSize,
              cartItemKey,
              productPricing: {
                price: productPricing?.price,
                discount: productPricing?.discount,
                gst: productPricing?.gst,
              },
            } as CartProduct;
          },
        );
        const results = await Promise.all(proms);
        if (active) {
          const organizedCartProducts = organizeCartProducts(results);
          setCartProducts(organizedCartProducts);
        }
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
    selectedSize?: string,
    qty = 1,
  ) => {
    if (!currentUser) throw new Error("Not authenticated");
    const key = selectedSize
      ? `${productId}_${selectedSize.replaceAll(" ", "")}`
      : productId;

    const ref = doc(firestore, "carts", currentUser.uid, "items", key);
    await setDoc(
      ref,
      {
        productId,
        cartItemKey:
          productId +
          (selectedSize ? "_" + selectedSize?.replaceAll(" ", "") : ""),
        quantity: qty,
        productPricing,
        selectedSize,
        createdAt: new Date(),
      },
      { merge: true },
    );
  };

  const removeFromCart = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    await deleteDoc(ref);
  };

  const increment = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const existing = cart.find((i) => i?.cartItemKey === productId);
    const newQty = existing ? existing.quantity + 1 : 1;
    const ref = doc(firestore, "carts", currentUser.uid, "items", productId);
    await setDoc(ref, { quantity: newQty }, { merge: true });
  };

  const decrement = async (productId: string) => {
    if (!currentUser) throw new Error("Not authenticated");
    const existing = cart.find((i) => i.cartItemKey === productId);
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
        cartTotals,
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
