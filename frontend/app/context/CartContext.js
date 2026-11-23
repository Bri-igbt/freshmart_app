"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_STORAGE_KEY = "freshmart-cart";
const MAX_QUANTITY = 100; 

const CartContext = createContext(null);
const parseCart = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        item.cartId &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setCartItems(parseCart(localStorage.getItem(CART_STORAGE_KEY)));
    setIsReady(true);

    const handleStorage = (event) => {
      if (event.key === CART_STORAGE_KEY) {
        setCartItems(parseCart(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!isReady) return; 

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {

    }
  }, [cartItems, isReady]);

  const addItem = useCallback((item) => {
    if (!item?.cartId) return;

    setCartItems((current) => {
      const existingItem = current.find(
        (cartItem) => cartItem.cartId === item.cartId
      );

      if (existingItem) {
        return current.map((cartItem) =>
          cartItem.cartId === item.cartId
            ? {
                ...cartItem,
                quantity: Math.min(cartItem.quantity + 1, MAX_QUANTITY),
              }
            : cartItem
        );
      }

      return [{ ...item, quantity: 1 }, ...current];
    });
  }, []);

  const decreaseItem = useCallback((cartId) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((cartId) => {
    setCartItems((current) => current.filter((item) => item.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getQuantity = useCallback(
    (cartId) => cartItems.find((item) => item.cartId === cartId)?.quantity || 0,
    [cartItems]
  );

  const value = useMemo(() => {
    const totalItems = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const subTotal = cartItems.reduce(
      (total, item) => total + (Number(item.price) || 0) * item.quantity,
      0
    );

    return {
      cartItems,
      isReady,
      totalItems,
      subTotal,
      addItem,
      decreaseItem,
      removeItem,
      clearCart,
      getQuantity,
    };
  }, [
    cartItems,
    isReady,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
    getQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
