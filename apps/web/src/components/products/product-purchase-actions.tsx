"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "@/components/imported/design-icons";
import { useAuth } from "@/components/auth/auth-provider";
import { addCartItem } from "@/lib/cart";

export function ProductPurchaseActions({
  productId,
  stockQuantity,
}: {
  productId: string;
  stockQuantity: number;
}) {
  const { accessToken, isLoading } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canBuy = stockQuantity > 0;

  const handleAddToCart = async () => {
    if (!accessToken || !canBuy || isAdding) {
      return;
    }

    setIsAdding(true);
    setMessage(null);
    setError(null);

    try {
      await addCartItem(accessToken, productId, 1);
      setMessage("Added to cart.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not add product to cart.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <button
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-stone-200 px-5 text-sm font-extrabold text-stone-500"
        disabled
        type="button"
      >
        Checking session...
      </button>
    );
  }

  if (!accessToken) {
    return (
      <Link
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700"
        href="/login"
      >
        Sign in to buy
        <ShoppingBag className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
        disabled={!canBuy || isAdding}
        onClick={() => void handleAddToCart()}
        type="button"
      >
        {isAdding ? "Adding..." : canBuy ? "Add to cart" : "Out of stock"}
        <ShoppingBag className="h-4 w-4" />
      </button>
      {message ? (
        <p className="text-xs font-bold text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
