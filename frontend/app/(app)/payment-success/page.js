"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyPayment } from "@/app/api/api.js";
import { useCart } from "@/app/context/CartContext";
import Navbar from "@/app/components/Navbar";

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, isReady } = useCart();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    if (!sessionId) {
      router.replace("/cart");
      return;
    }

    if (!localStorage.getItem("token")) {
      localStorage.setItem(
        "freshmart-redirect-after-login",
        `/payment-success?session_id=${encodeURIComponent(sessionId)}`
      );
      router.replace("/login");
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    const verify = async () => {
      try {
        await verifyPayment(sessionId);
        clearCart();
        localStorage.removeItem("freshmart-pending-online-order");
        setStatus("success");
      } catch (error) {
        console.log(error);
        setMessage(
          error.response?.data?.message ||
            "We couldn't confirm your payment. If money left your account, check My Orders or contact support."
        );
        setStatus("error");
      }
    };

    verify();
  }, [isReady, sessionId, router, clearCart]);

  useEffect(() => {
    if (status !== "success") return undefined;

    const timer = setTimeout(() => router.push("/orders"), 2500);
    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-lg">
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-yellow-500" />
              <h1 className="mt-4 text-2xl font-bold">
                Confirming your payment
              </h1>
              <p className="mt-2 text-black/60">
                Please wait, this only takes a moment. Don&apos;t close this
                page.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="mt-4 text-2xl font-bold">Payment successful</h1>
              <p className="mt-2 text-black/60">
                Your order has been placed. Taking you to your orders...
              </p>
              <Link
                href="/orders"
                className="mt-6 inline-block rounded-full bg-yellow-300 px-6 py-3 font-semibold text-black"
              >
                View my orders
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
              <p className="mt-2 text-black/60">{message}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/orders"
                  className="rounded-full bg-yellow-300 px-6 py-3 font-semibold text-black"
                >
                  My orders
                </Link>
                <Link
                  href="/cart"
                  className="rounded-full border border-black/15 px-6 py-3 font-semibold"
                >
                  Back to cart
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

const page = () => (
  <Suspense fallback={null}>
    <PaymentSuccessContent />
  </Suspense>
);

export default page;
