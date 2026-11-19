"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import { adminLoginStyles as s } from "@/app/assets/dummyStyles.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const getRedirectPath = () => {
  const from = new URLSearchParams(window.location.search).get("from");

  const isSafe =
    from &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !from.startsWith("/\\");

  return isSafe ? from : "/dashboard";
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });

      if (data.success) {
        if (data.user?.role !== "admin") {
          setError("This account does not have admin access.");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("freshmart_user", JSON.stringify(data.user));
        router.replace(getRedirectPath());
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.mainContainer}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={s.glow1} />
        <div className={s.glow2} />
        <div className={s.glow3} />
      </div>

      <div className={s.contentWrapper}>
        <div className={s.brandHeader}>
          <div className={s.brandInner}>
            <div className={s.logoWrapper}>
              <Image
                src={freshmartLogo}
                className={s.logoImage}
                alt="logo"
                width={120}
                height={120}
              />
            </div>

            <div className="leading-tight">
              <p className={s.adminLabel}>Admin Panel</p>
              <h1 className={s.brandTitle}>FreshMart</h1>
            </div>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTopLine} />

          <form onSubmit={handleSubmit} className={s.form}>
            {error && (
              <div className={s.errorContainer}>
                <div className={s.errorDot} />
                {error}
              </div>
            )}

            <div className={s.fieldGroup}>
              <label htmlFor="email" className={s.fieldLabel}>
                <span>Email Address</span>
              </label>

              <div className={s.fieldWrapper}>
                <div className={s.fieldGlow} />

                <div className={s.fieldInputContainer}>
                  <Mail className={s.fieldIcon} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className={s.fieldInput}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="password" className={s.fieldLabel}>
                <span>Password</span>
              </label>

              <div className={s.fieldWrapper}>
                <div className={s.fieldGlow} />

                <div className={s.fieldInputContainer}>
                  <Lock className={s.fieldIcon} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    className={s.fieldInputPassword}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={s.toggleButton}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className={s.toggleIcon} />
                    ) : (
                      <Eye className={s.toggleIcon} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={s.submitButton}
            >
              <span className={s.submitInner}>
                {isLoading ? (
                  <>
                    <div className={s.spinner} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className={s.submitIcon} />
                    Sign In
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      <style jsx>
        {`
          @keyframes spin-slow {
            0% {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
