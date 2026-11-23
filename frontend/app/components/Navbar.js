"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  LogOut,
  LogIn,
  MapPinPlus,
  PackageCheck,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import { navbarStyles as s } from "@/app/assets/dummyStyles.js";

const SEARCH_DELAY = 400;

const NavbarContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalItems } = useCart();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [accountOpen, setAccountOpen] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const lastScrollY = useRef(0);
  const accountRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(localStorage.getItem("freshmart-auth") === "true");
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("freshmart-auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("freshmart-auth-change", syncAuth);
    };
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setIsNavbarHidden(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      setIsNavbarHidden(isScrollingDown && currentScrollY > 120);
      if (isScrollingDown) setAccountOpen(false);
      lastScrollY.current = Math.max(currentScrollY, 0);
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;

    const handlePointerDown = (e) => {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const goToSearch = (value, { replace }) => {
    const query = value.trim();
    const url = query ? `/?q=${encodeURIComponent(query)}` : "/";

    if (replace) router.replace(url);
    else router.push(url);
  };

  const handleSearchChange = (e) => {
    const nextValue = e.target.value;
    setSearchTerm(nextValue);

    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => goToSearch(nextValue, { replace: true }),
      SEARCH_DELAY
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(searchTimer.current);
    goToSearch(searchTerm, { replace: false });
  };

  const goToOrders = () => {
    if (!isLoggedIn) {
      localStorage.setItem("freshmart-redirect-after-login", "/orders");
      router.push("/login");
      return;
    }
    router.push("/orders");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("freshmart-auth");
    localStorage.removeItem("freshmart-user");
    window.dispatchEvent(new Event("freshmart-auth-change"));
    setAccountOpen(false);
    router.push("/login");
  };

  return (
    <header
      className={`${s.headerBase} ${
        isNavbarHidden ? s.headerHidden : s.headerVisible
      }`}
    >
      <div className={s.container}>
        <Link href="/" className={s.logoLink}>
          <div className={s.logoWrapper}>
            <div className={s.logoImageWrapper}>
              <Image
                src={freshmartLogo}
                alt="FreshMart Grocery logo"
                className={s.logoImage}
                width={100}
                height={100}
              />
            </div>

            <div className={s.logoTextWrapper}>
              <h1 className={s.logoTitle}>FreshMart Grocery</h1>
              <p className={s.logoSubtitle}>Fast Grocery Delivery</p>
            </div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className={s.searchForm}>
          <div className={s.searchContainer}>
            <div className={s.searchInputWrapper}>
              <Search className={s.searchIcon} />
              <input
                type="text"
                placeholder="Search for products, brands, categories..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={s.searchInput}
              />
            </div>

            <button type="submit" className={s.searchButton}>
              Search
            </button>
          </div>
        </form>

        <div className={s.actionsWrapper}>
          <button type="button" onClick={goToOrders} className={s.actionButton}>
            <PackageCheck className={s.actionIcon} />
            <span className="truncate">My Orders</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/cart")}
            className={s.cartButton}
          >
            <ShoppingCart className={s.actionIcon} />
            <span>Cart</span>
            {totalItems > 0 ? (
              <span className={s.cartBadge}>{totalItems}</span>
            ) : null}
          </button>

          {isLoggedIn ? (
            <div ref={accountRef} className={s.accountDropdownWrapper}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={s.actionButton}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <UserRound className={s.actionIcon} />
                <span className="truncate">Account</span>
                <ChevronDown className={s.dropdownChevron} />
              </button>

              <div
                inert={!accountOpen}
                className={`${s.dropdownMenu} ${
                  accountOpen ? s.dropdownOpen : s.dropdownClosed
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    router.push("/address");
                  }}
                  className={s.dropdownItem}
                >
                  <MapPinPlus className={s.dropdownIcon} />
                  Add Address
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={s.dropdownItem}
                >
                  <LogOut className={s.dropdownIcon} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className={s.actionButton}
            >
              <LogIn className={s.actionIcon} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Navbar = () => (
  <Suspense fallback={null}>
    <NavbarContent />
  </Suspense>
);

export default Navbar;
