"use client";

import { useSearchParams } from "next/navigation";
import Navbar from "./Navbar.js";
import ProductItemsPage from "./ProductItemsPage.js";
import Footer from "./Footer.js";
import SearchResults from "@/app/components/SearchResult.js"

const ProductItemsView = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const isSearching = query.trim().length > 0;

  return (
    <div>
      <Navbar />
      {isSearching ? <SearchResults query={query} /> : <ProductItemsPage />}
      <Footer />
    </div>
  );
};

export default ProductItemsView;
