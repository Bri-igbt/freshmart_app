"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/app/api/api.js";
import { resetPasswordStyles as s } from "@/app/assets/dummyStyles.js";
import { useToast } from "@/app/hooks/useToast";

const MIN_PASSWORD_LENGTH = 8;

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, later } = useToast();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      return showToast("error", "Email not found.");
    }

    if (otp.length !== 6) {
      return showToast(
        "error",
        "Please enter the 6-digit code from your email."
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return showToast(
        "error",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    }

    if (password !== confirmPassword) {
      return showToast("error", "Passwords do not match.");
    }

    try {
      setLoading(true);

      const { data } = await resetPassword({ email, otp, password });
      showToast("success", data.message);
      later(() => router.push("/login"), 1500);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to reset password."
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
        <h1 className={s.heading}>Reset Password</h1>
        <p className={s.subtext}>Reset your account password</p>

        <form onSubmit={handleResetPassword} className={s.form}>
          <input type="email" value={email} readOnly className={s.input} />

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className={s.input}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={s.inputWithIcon}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={s.toggleButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              autoComplete="new-password"
              maxLength={72}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={s.inputWithIcon}
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={s.toggleButton}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className={s.backLinkWrapper}>
          <Link href="/forgot-password" className={s.backLink}>
            Didn&apos;t get a code? Send it again
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <Link href="/login" className={s.backLink}>
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
};

const ResetPasswordPage = () => (
  <Suspense fallback={null}>
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPasswordPage;
