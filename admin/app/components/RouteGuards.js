"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export const hasAdminSession = () => {
  try {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("freshmart_user");

    if (!token || !savedUser) return false;

    return JSON.parse(savedUser).role === "admin";
  } catch {
    return false;
  }
};

const useAdminSession = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsAdmin(hasAdminSession());
  }, [pathname]);

  return isAdmin;
};

export const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = useAdminSession();

  useEffect(() => {
    if (isAdmin === false) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isAdmin, pathname, router]);

  return isAdmin ? children : null;
};

export const PublicOnlyRoute = ({ children }) => {
  const router = useRouter();
  const isAdmin = useAdminSession();

  useEffect(() => {
    if (isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  return isAdmin === false ? children : null;
};
