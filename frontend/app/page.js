"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Banner from "@/app/components/Banner/Banner";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SearchResult from "@/app/components/SearchResult";
import HookahPage from "@/app/components/HookahPage";
import ProductPage from "@/app/components/ProductPage";
import ScrollToTop from "@/app/components/ScrollToTop";

const HomeContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const isSearching = query.trim().length > 0;

  return (
    <div>
      <ScrollToTop />
      <Navbar />
      {isSearching ? (
        <SearchResult query={query} />
      ) : (
        <>
          <Banner />
          <ProductPage />
          <HookahPage />
        </>
      )}
      <Footer />
    </div>
  );
};

const HomePage = () => (
  <Suspense fallback={null}>
    <HomeContent />
  </Suspense>
);

export default HomePage;
