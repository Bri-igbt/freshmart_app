"use client";

import { useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const ScrollToTop = () => {
  const pathname = usePathname();
  const query = useSearchParams().toString();

  useLayoutEffect(() => {
    if (window.location.hash) return;

    window.history.scrollRestoration = "manual";
    const root = document.documentElement;
    const previousBehaviour = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehaviour;
  }, [pathname, query]);

  return null;
};

export default ScrollToTop;
