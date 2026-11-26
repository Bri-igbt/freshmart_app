"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, resendOtp } from "@/app/api/api.js";
import { verifyEmailStyles as s } from "@/app/assets/dummyStyles.js";
import { useToast } from "@/app/hooks/useToast";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, later } = useToast();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) router.replace("/signup");
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      return showToast("error", "Please enter a valid 6-digit OTP.");
    }

    try {
      setLoading(true);
      const { data } = await verifyEmail({ email, otp });
      showToast("success", data.message);
      later(() => router.push("/login"), 1500);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "OTP verification failed."
      );
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      const { data } = await resendOtp({ email });
      showToast("success", data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to resend OTP."
      );
      if (error.response?.status === 429) setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResendLoading(false);
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
        <h1 className={s.heading}>Verify Email</h1>
        <p className={s.subtext}>OTP sent to</p>
        <p className={s.emailDisplay}>{email}</p>

        <form onSubmit={handleVerify} className={s.form}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter OTP"
            className={s.otpInput}
            required
          />
          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className={s.resendWrapper}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
            className={s.resendButton}
          >
            {resendLoading
              ? "Sending..."
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend OTP"}
          </button>
        </div>
      </div>
    </main>
  );
};

const VerifyEmailPage = () => (
  <Suspense fallback={null}>
    <VerifyEmailContent />
  </Suspense>
);

export default VerifyEmailPage;
