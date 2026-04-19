"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
import { firestore } from "@/firebase/client";
import { CartProduct } from "@/types/cartProduct";
import { mapProductToClientProduct, organizeCartProducts } from "@/lib/utils";
import { useAuthState } from "./useAuth";

export type CartItem = {
  id: string;
  productId: string;
  cartItemKey: string;
  productPricing: { price?: number; discount?: number; gst?: number };
  quantity: number;
  selectedSize?: string;
};

export type CartTotals = {
  totalUnits: number;
  totalItems: number;
  totalAmount: number;
  totalDiscount: number;
  totalGST: number;
  totalNetAmount: number;
  totalSavings: number;
};

export type CartState = {
  cart: CartItem[];
  cartProducts: CartProduct[];
  cartTotals: CartTotals;
  loading: boolean;
  error?: FirestoreError;

  // ✅ derived index for O(1) lookup in ProductCard etc.
  cartIndex: Record<string, CartItem>; // key = cartItemKey
};

export type CartActions = {
  addToCart: (
    productId: string,
    productPricing: { price?: number; discount?: number; gst?: number },
    selectedSize?: string,
    qty?: number,
  ) => Promise<void>;
  removeFromCart: (cartItemKey: string) => Promise<void>;
  clearCart: () => Promise<void>;
  increment: (cartItemKey: string) => Promise<void>;
  decrement: (cartItemKey: string) => Promise<void>;
  setQuantity: (cartItemKey: string, quantity: number) => Promise<void>;
  setCartProducts: (cartProducts: CartProduct[]) => void;
  resetCartContext: () => Promise<void>;
};

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

export function useCartState() {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error("useCartState must be inside CartProvider");
  return ctx;
}

export function useCartActions() {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be inside CartProvider");
  return ctx;
}

// Backward compat if you want (optional)
export function useCart() {
  return { ...useCartState(), ...useCartActions() };
}

// ✅ Selector: minimal subscription usage in ProductCard
export function useCartItem(cartItemKey: string) {
  const { cartIndex } = useCartState();
  return cartIndex[cartItemKey];
}

// helper to compute key same as your addToCart logic
function normalizeSizeForCartKey(selectedSize?: string) {
  if (!selectedSize) return "";
  return selectedSize.trim().replace(/\s+/g, "").replace(/\//g, "-");
}

export function getCartItemKey(productId: string, selectedSize?: string) {
  const normalizedSize = normalizeSizeForCartKey(selectedSize);
  return normalizedSize ? `${productId}_${normalizedSize}` : productId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthState();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [cartTotals, setCartTotals] = useState<CartTotals>({} as CartTotals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError>();

  // Listener: cart items + totals
  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setCartProducts([]);
      setCartTotals({} as CartTotals);
      setLoading(false);
      return;
    }

    setLoading(true);

    const itemsCol = collection(firestore, "carts", currentUser.uid, "items");
    const orderedQuery = query(itemsCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      orderedQuery,
      (snap) => {
        const data: CartItem[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            productId: v.productId as string,
            cartItemKey: v.cartItemKey as string,
            productPricing: (v.productPricing ||
              {}) as CartItem["productPricing"],
            quantity: (v.quantity as number) || 0,
            selectedSize: v.selectedSize as string | undefined,
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

          totalUnits += qty;
          totalDiscount += discountAmt;
          totalGST += gstAmt;
          totalAmount += totalPrice;
        });

        const round = Math.round;
        setCartTotals({
          totalUnits: round(totalUnits),
          totalItems: data.length,
          totalAmount: round(totalAmount),
          totalDiscount: round(totalDiscount),
          totalGST: round(totalGST),
          totalNetAmount: round(totalAmount),
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

  // Derive cartIndex for quick lookup (stable + cheap)
  const cartIndex = useMemo(() => {
    const idx: Record<string, CartItem> = {};
    for (const item of cart) {
      idx[item.cartItemKey] = item;
    }
    return idx;
  }, [cart]);

  // Fetch cartProducts when cart changes (you can optimize later; keep close)
  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    (async () => {
      try {
        const proms = cart.map(async (item) => {
          const snap = await getDoc(doc(firestore, "products", item.productId));
          const data = snap.data() || {};
          return {
            id: snap.id,
            product: mapProductToClientProduct(data),
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            cartItemKey: item.cartItemKey,
            productPricing: {
              price: item.productPricing?.price,
              discount: item.productPricing?.discount,
              gst: item.productPricing?.gst,
            },
          } as CartProduct;
        });

        const results = await Promise.all(proms);
        if (active) setCartProducts(organizeCartProducts(results));
      } catch (e) {
        console.error("Failed to fetch products for cart:", e);
      }
    })();

    return () => {
      active = false;
    };
  }, [cart, currentUser]);

  // Actions (memoized)
  const addToCart = useCallback(
    async (
      productId: string,
      productPricing: { price?: number; discount?: number; gst?: number },
      selectedSize?: string,
      qty = 1,
    ) => {
      if (!currentUser) throw new Error("Not authenticated");

      const key = getCartItemKey(productId, selectedSize);

      const ref = doc(firestore, "carts", currentUser.uid, "items", key);

      await setDoc(
        ref,
        {
          productId,
          cartItemKey: key,
          quantity: qty,
          productPricing,
          selectedSize,
          createdAt: new Date(),
        },
        { merge: true },
      );
    },
    [currentUser],
  );

  const removeFromCart = useCallback(
    async (cartItemKey: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        cartItemKey,
      );
      await deleteDoc(ref);
    },
    [currentUser],
  );

  const increment = useCallback(
    async (cartItemKey: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const existing = cartIndex[cartItemKey];
      const newQty = existing ? existing.quantity + 1 : 1;
      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        cartItemKey,
      );
      await setDoc(ref, { quantity: newQty }, { merge: true });
    },
    [currentUser, cartIndex],
  );

  const decrement = useCallback(
    async (cartItemKey: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const existing = cartIndex[cartItemKey];
      if (!existing) return;

      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        cartItemKey,
      );
      if (existing.quantity > 1) {
        await setDoc(ref, { quantity: existing.quantity - 1 }, { merge: true });
      } else {
        await deleteDoc(ref);
      }
    },
    [currentUser, cartIndex],
  );

  const setQuantity = useCallback(
    async (cartItemKey: string, quantity: number) => {
      if (!currentUser) throw new Error("Not authenticated");

      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        cartItemKey,
      );

      if (quantity > 0) {
        await setDoc(ref, { quantity }, { merge: true });
      } else {
        await deleteDoc(ref);
      }
    },
    [currentUser],
  );

  const clearCart = useCallback(async () => {
    if (!currentUser) throw new Error("Not authenticated");
    const batch = writeBatch(firestore);
    cart.forEach((i) => {
      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        i.cartItemKey,
      );
      batch.delete(ref);
    });
    await batch.commit();
  }, [currentUser, cart]);

  const resetCartContext = useCallback(async () => {
    if (!currentUser?.uid) return;
    const batch = writeBatch(firestore);

    cart.forEach((i) => {
      const ref = doc(
        firestore,
        "carts",
        currentUser.uid,
        "items",
        i.cartItemKey,
      );
      batch.delete(ref);
    });

    try {
      await batch.commit();
      setCart([]);
      setCartProducts([]);
      setCartTotals({} as CartTotals);
    } catch (err) {
      console.error("Failed to reset remote cart:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, cart]);

  const stateValue = useMemo<CartState>(
    () => ({
      cart,
      cartProducts,
      cartTotals,
      loading,
      error,
      cartIndex,
    }),
    [cart, cartProducts, cartTotals, loading, error, cartIndex],
  );

  const actionsValue = useMemo<CartActions>(
    () => ({
      addToCart,
      removeFromCart,
      clearCart,
      increment,
      decrement,
      setQuantity,
      setCartProducts,
      resetCartContext,
    }),
    [
      addToCart,
      removeFromCart,
      clearCart,
      increment,
      decrement,
      setQuantity,
      resetCartContext,
    ],
  );

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}
