"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/app/api/api.js";
import { forgotPasswordStyles as s } from "@/app/assets/dummyStyles.js";
import { useToast } from "@/app/hooks/useToast";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const { toast, showToast, later } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    try {
      setLoading(true);

      const { data } = await forgotPassword({ email: trimmedEmail });
      showToast("success", data.message);
      later(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(trimmedEmail)}`
        );
      }, 1500);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to send OTP."
      );
      setLoading(false);
    }
  };

  return (
    <main className={s.main}>
      <div
        role="status"
        className={`${s.toastBase} ${
          toast.show ? s.toastVisible : s.toastHidden
        } ${toast.type === "success" ? s.toastSuccess : s.toastError}`}
      >
        {toast.message}
      </div>

      <div className={s.card}>
        <h1 className={s.heading}>Forgot Password</h1>
        <p className={s.subtext}>Enter your registered email</p>

        <form onSubmit={handleForgotPassword} className={s.form}>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={s.input}
          />

          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className={s.backLinkWrapper}>
          <Link href="/login" className={s.backLink}>
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
