"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import { loginUser, resendOtp } from "@/app/api/api.js";
import { loginPageStyles as s } from "@/app/assets/dummyStyles.js";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  XCircle,
} from "lucide-react";

const getRedirectPath = () => {
  const saved = localStorage.getItem("freshmart-redirect-after-login");
  localStorage.removeItem("freshmart-redirect-after-login");

  const isSafe =
    saved &&
    saved.startsWith("/") &&
    !saved.startsWith("//") &&
    !saved.startsWith("/\\");

  return isSafe ? saved : "/";
};

const page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const errorTimer = useRef(null);
  const redirectTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(errorTimer.current);
      clearTimeout(redirectTimer.current);
    };
  }, []);

  const showError = (message) => {
    clearTimeout(errorTimer.current);
    setErrorMessage(message);
    setErrorToastVisible(true);
    errorTimer.current = setTimeout(() => setErrorToastVisible(false), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));

    try {
      setIsSubmitting(true);
      const { data } = await loginUser({ email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("freshmart-user", JSON.stringify(data.user));
      localStorage.setItem("freshmart-auth", "true");
      window.dispatchEvent(new Event("freshmart-auth-change"));

      setToastVisible(true);
      redirectTimer.current = setTimeout(() => {
        router.push(getRedirectPath());
      }, 700);

    } catch (error) {
      console.log(error);

      if (!error.response) {
        setIsSubmitting(false);
        return showError("Can't reach the server. Check your connection.");
      }

      const message =
        error.response.data?.message || "Login failed. Please try again";

      if (error.response.status === 403 && /verify/i.test(message)) {
        try {
          await resendOtp({ email });
        } catch {
          null
        }
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      setIsSubmitting(false);
      showError(message);
    }
  };

  return (
    <main className={s.mainContainer}>
      <div
        className={`${s.toastBase} ${s.toastSuccess} ${
          toastVisible ? s.toastVisible : s.toastHidden
        }`}
        role="status"
        aria-live="polite"
      >
        <span className={s.toastIconWrapperSuccess}>
          <CheckCircle2 className={s.iconMd} />
        </span>
        <span>
          <span className={s.toastTitle}>Login successful</span>
          <span className={s.toastSubtext}>Redirecting...</span>
        </span>
      </div>

      <div
        className={`${s.toastBase} ${s.toastError} ${
          errorToastVisible ? s.toastVisible : s.toastHidden
        }`}
        role="alert"
        aria-live="assertive"
      >
        <span className={s.toastIconWrapperError}>
          <XCircle className={s.iconMd} />
        </span>
        <span>
          <span className={s.toastTitle}>{errorMessage}</span>
          <span className={s.toastSubtext}>Please try again</span>
        </span>
      </div>

      <div className="pointer-events-none fixed inset-0">
        <div className={s.decorBg} style={s.decorGradients} />
        <div className={s.decorLine} />
      </div>

      <section className={s.section}>
        <div className={s.leftColumn}>
          <Link href="/" className={s.logoLink}>
            <span className={s.logoWrapper}>
              <Image
                src={freshmartLogo}
                alt="FreshMart Grocery logo"
                className={s.logoImage}
                width={100}
                height={100}
              />
            </span>
            <span>
              <span className={s.logoText}>FreshMart</span>
              <span className={s.logoSubtext}>Grocery delivery</span>
            </span>
          </Link>

          <div className={s.heroWrapper}>
            <div className={s.heroBadge}>
              <Sparkles className={s.iconSm} />
              Welcome back
            </div>

            <h1 className={s.heroHeading}>
              Sign in for your
              <span className={s.heroHighlight}>fresh grocery run.</span>
            </h1>

            <p className={s.heroDescription}>
              Continue shopping fresh essentials, snacks, drinks, and hookah
              products with a faster checkout experience.
            </p>
          </div>

          <div className={s.featureGrid}>
            {[
              { icon: ShoppingBag, label: "Easy cart" },
              { icon: ShieldCheck, label: "Secure login" },
              { icon: Sparkles, label: "Fresh offers" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className={s.featureCard}>
                  <Icon className={s.featureIcon} />
                  <p className={s.featureLabel}>{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.rightColumn}>
          <form onSubmit={handleLogin} className={s.form}>
            <div className={s.formHeader}>
              <p className={s.formLabel}>Login</p>
              <h2 className={s.formTitle}>Access your account</h2>
            </div>

            <div className={s.formFields}>
              <label className="block">
                <span className={s.inputLabel}>Email address</span>
                <span className={s.inputWrapper}>
                  <Mail className={s.inputIcon} />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={s.inputField}
                  />
                </span>
              </label>

              <label className="block">
                <span className={s.inputLabel}>Password</span>
                <span className={s.inputWrapper}>
                  <LockKeyhole className={s.inputIcon} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className={s.inputField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className={s.togglePasswordButton}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className={s.iconMd} />
                    ) : (
                      <Eye className={s.iconMd} />
                    )}
                  </button>
                </span>
              </label>
            </div>

            <div className={s.forgotPasswordWrapper}>
              <Link href="/forgot-password" className={s.forgotPasswordLink}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={s.submitButton}
            >
              {isSubmitting ? "Signing in..." : "Login now"}
              <ArrowRight className={s.iconMd} />
            </button>

            <p className={s.signupPrompt}>
              New to FreshMart?{" "}
              <Link href="/signup" className={s.signupLink}>
                Create account
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default page;
