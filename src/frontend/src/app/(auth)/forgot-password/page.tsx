"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { FiAlertCircle, FiArrowLeft, FiCheck, FiLoader, FiMail } from "react-icons/fi";

import { requestPasswordReset } from "@/lib/auth-client";

import styles from "../recovery.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RequestStatus = "idle" | "submitting" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<RequestStatus>("idle");

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_PATTERN.test(normalizedEmail);
  const emailError = submitted && !emailValid ? "Enter a valid email address." : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!emailValid) return;

    setStatus("submitting");
    const result = await requestPasswordReset({
      email: normalizedEmail,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setStatus(result.error ? "error" : "success");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.aside}>
        <Link className={styles.brand} href="/" aria-label="TechBondhu home">TECHBONDHU<span>.</span></Link>
        <div className={styles.asideContent}>
          <span className={styles.asideIcon}><FiMail /></span>
          <p>ACCOUNT RECOVERY</p>
          <h2>A secure route back to your build.</h2>
          <p className={styles.asideCopy}>We’ll send a one-time link to the email attached to your TechBondhu account.</p>
        </div>
        <span className={styles.asideFoot}>The reset link expires after 60 minutes.</span>
      </aside>

      <section className={styles.panel} aria-labelledby="forgot-title">
        <div className={styles.card}>
          <p className={styles.eyebrow}>FORGOT PASSWORD</p>
          <h1 id="forgot-title">Reset your password</h1>
          <p className={styles.intro}>Enter your account email. If it matches an account, we’ll send a secure reset link.</p>

          <form noValidate onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="recovery-email">Email address</label>
              <div className={`${styles.inputFrame} ${emailError ? styles.inputFrameError : ""}`}>
                <input
                  id="recovery-email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={status === "submitting" || status === "success"}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "recovery-email-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  onBlur={() => setEmail(normalizedEmail)}
                />
              </div>
              {emailError ? <p className={styles.fieldError} id="recovery-email-error">{emailError}</p> : null}
            </div>

            <button className={`${styles.primaryButton} ${status === "submitting" ? styles.loading : ""}`} type="submit" disabled={status === "submitting" || status === "success"}>
              {status === "submitting" ? <><FiLoader /> Sending secure link...</> : "Send reset link"}
            </button>
          </form>

          {status === "success" ? (
            <div className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
              <FiCheck />
              <span><strong>Check your inbox.</strong> If an account exists for that email, its reset link is on the way.</span>
            </div>
          ) : null}

          {status === "error" ? (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              <FiAlertCircle />
              <span>We couldn’t start password recovery right now. Please try again.</span>
            </div>
          ) : null}

          <Link className={styles.backLink} href="/sign-in"><FiArrowLeft /> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
