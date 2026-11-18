import brevo from "../config/brevo.js";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendOTPEmail = async ({ email, name, otp, subject, heading }) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    },
    to: [{ email, name }],
    subject,
    htmlContent: `
      <h2>${heading}</h2>
      <p>Hello ${escapeHtml(name)},</p>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};

export const sendVerificationOTP = (email, name, otp) =>
  sendOTPEmail({
    email,
    name,
    otp,
    subject: "Verify Your Email",
    heading: "Email Verification",
  });

export const sendResetOTP = (email, name, otp) =>
  sendOTPEmail({
    email,
    name,
    otp,
    subject: "Reset Password",
    heading: "Reset Password",
  });
