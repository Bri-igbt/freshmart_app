import Link from "next/link";
import { XCircle } from "lucide-react";
import Navbar from "@/app/components/Navbar";

const page = () => (
  <>
    <Navbar />
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-lg">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Payment cancelled</h1>
        <p className="mt-2 text-black/60">
          You haven&apos;t been charged, and your cart is still saved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/cart"
            className="rounded-full bg-yellow-300 px-6 py-3 font-semibold text-black"
          >
            Back to cart
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-6 py-3 font-semibold"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </main>
  </>
);

export default page;
