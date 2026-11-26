"use client";

import { useSearchParams } from "next/navigation";
import Navbar from "./Navbar.js";
import SearchResults from "@/app/components/SearchResult.js";
import HookahPage from "./HookahPage.js";
import Footer from "./Footer.js";

export default function HookahView() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const isSearching = query.trim().length > 0;

  return (
    <div>
      <Navbar />
      {isSearching ? <SearchResults query={query} /> : <HookahPage expanded />}
      <Footer />
    </div>
  );
}
