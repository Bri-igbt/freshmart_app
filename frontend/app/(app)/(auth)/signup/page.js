"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "@/app/api/api.js";
import { signupPageStyles as s } from "@/app/assets/dummyStyles.js";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShoppingBasket,
  Sparkles,
  UserRound,
  Zap,
  XCircle,
} from "lucide-react";

const NIGERIAN_PHONE = /^(\+234|234|0)[789][01]\d{8}$/;

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

  const handleSignUp = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const phone = String(formData.get("phone")).replace(/[\s()-]/g, "");

    if (!NIGERIAN_PHONE.test(phone)) {
      return showError("Enter a valid Nigerian phone number, e.g. 08012345678");
    }

    try {
      setIsSubmitting(true);
      await registerUser({ name, email, phone, password });

      setToastVisible(true);
      redirectTimer.current = setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 950);
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);

      if (!error.response) {
        return showError("Can't reach the server. Check your connection.");
      }

      showError(
        error.response.data?.message || "Signup failed. Please try again"
      );
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
          <span className={s.toastTitle}>Signup successful</span>
          <span className={s.toastSubtext}>
            Check your email for the verification code...
          </span>
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
        <div>
          <form onSubmit={handleSignUp} className={s.formWrapper}>
            <div className={s.formHeader}>
              <p className={s.formLabel}>Signup</p>
              <h1 className={s.formTitle}>Create your account</h1>
              <p className={s.formSubtext}>
                Join FreshMart and start shopping your daily essentials faster.
              </p>
            </div>

            <div className={s.formFields}>
              <label className="block">
                <span className={s.inputLabel}>Full name</span>
                <span className={s.inputWrapper}>
                  <UserRound className={s.inputIcon} />
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className={s.inputField}
                  />
                </span>
              </label>

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
                <span className={s.inputLabel}>Phone number</span>
                <span className={s.inputWrapper}>
                  <Phone className={s.inputIcon} />
                  <input
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="0801 234 5678"
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
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className={s.submitButton}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              <ArrowRight className={s.iconMd} />
            </button>

            <p className={s.signupPrompt}>
              Already have an account?{" "}
              <Link href="/login" className={s.loginLink}>
                Login
              </Link>
            </p>
          </form>
        </div>

        <div className={s.rightColumn}>
          <Link href="/" className={s.logoLink}>
            <span className={s.logoWrapper}>
              <Image
                src={freshmartLogo}
                alt="FreshMart Grocery logo"
                className={s.logoImage}
                width={80}
                height={80}
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
              Fresh starts here
            </div>

            <h2 className={s.heroHeading}>
              Build your basket
              <span className={s.heroHighlight}>in minutes.</span>
            </h2>

            <p className={s.heroDescription}>
              Save your details once, then move through FreshMart with quick
              ordering, cleaner checkout, and bright daily deals.
            </p>
          </div>

          <div className={s.featureGrid}>
            {[
              {
                icon: ShoppingBasket,
                title: "One-tap essentials",
                text: "Daily grocery items ready when you are.",
              },
              {
                icon: Zap,
                title: "Fast checkout",
                text: "Verify your email with a quick code, then start shopping.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className={s.featureCard}>
                  <Icon className={s.featureIcon} />
                  <h3 className={s.featureTitle}>{item.title}</h3>
                  <p className={s.featureText}>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default page;
