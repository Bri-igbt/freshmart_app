"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  LogIn,
  LogOut,
} from "lucide-react";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import { adminNavbarStyles as s } from "@/app/assets/dummyStyles.js";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Add Items", icon: PlusCircle, href: "/add-item" },
  { name: "Item List", icon: Package, href: "/item-list" },
  { name: "Add Hookah", icon: PlusCircle, href: "/add-hookah" },
  { name: "Hookah List", icon: Package, href: "/hookah-list" },
  { name: "Orders", icon: ShoppingCart, href: "/orders" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const checkUser = () => {
      try {
        const stored = localStorage.getItem("freshmart_user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      setIsNavbarHidden(isScrollingDown && currentScrollY > 120);
      if (isScrollingDown) setOpen(false);
      lastScrollY.current = Math.max(currentScrollY, 0);
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setIsNavbarHidden(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("freshmart_user");
    setUser(null);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <header
      className={`${s.headerBase} ${
        isNavbarHidden ? s.headerHidden : s.headerVisible
      }`}
    >
      <div className="relative">
        <div className={s.innerWrapper}>
          <div className={s.logoWrapper}>
            <div className={s.logoImageWrapper}>
              <Image
                src={freshmartLogo}
                alt="logo"
                width={100}
                height={100}
                className={s.logoImage}
              />
            </div>

            <div className={s.logoTextWrapper}>
              <p className={s.logoLabel}>Admin Panel</p>
              <h1 className={s.logoTitle}>FreshMart</h1>
            </div>
          </div>

          <nav className={s.navLinks}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${s.navLinkBase} ${
                    active ? s.navLinkActive : s.navLinkInactive
                  }`}
                >
                  <Icon
                    className={`${s.navIconBase} ${
                      active ? s.navIconActive : s.navIconInactive
                    }`}
                  />
                  <span className="relative">{item.name}</span>
                  <ChevronRight
                    className={`${s.navChevronBase} ${
                      active ? s.navChevronActive : s.navChevronInactive
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className={s.authButtons}>
            {user ? (
              <button onClick={handleLogout} className={s.logoutButton}>
                <LogOut className={s.authIcon} />
                Logout
              </button>
            ) : (
              <button onClick={handleLogin} className={s.loginButton}>
                <LogIn className={s.authIcon} />
                Login
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={s.mobileToggle}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <X className={s.mobileIcon} />
            ) : (
              <Menu className={s.mobileIcon} />
            )}
          </button>
        </div>

        {open && (
          <div className={s.mobileMenuContainer}>
            <div className={s.mobileMenuGrid}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`${s.mobileNavLinkBase} ${
                      active ? s.mobileNavLinkActive : s.mobileNavLinkInactive
                    }`}
                  >
                    <span className={s.mobileNavLinkLeft}>
                      <Icon
                        className={`${s.mobileNavIcon} ${
                          active
                            ? s.mobileNavIconActive
                            : s.mobileNavIconInactive
                        }`}
                      />
                      {item.name}
                    </span>

                    <ChevronRight className={s.mobileNavChevron} />
                  </Link>
                );
              })}
            </div>

            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
                className={s.mobileLogoutButton}
              >
                <LogOut className={s.mobileAuthIcon} />
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  handleLogin();
                  setOpen(false);
                }}
                className={s.mobileLoginButton}
              >
                <LogIn className={s.mobileAuthIcon} />
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
