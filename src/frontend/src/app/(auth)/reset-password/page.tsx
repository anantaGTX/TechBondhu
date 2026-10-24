"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useMemo, useState } from "react";
import { FiAlertCircle, FiArrowLeft, FiCheck, FiEye, FiEyeOff, FiLoader, FiLock } from "react-icons/fi";

import { resetPassword } from "@/lib/auth-client";

import styles from "../recovery.module.css";

type ResetStatus = "idle" | "submitting" | "success" | "error";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<ResetStatus>("idle");

  const rules = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  const passwordValid = Object.values(rules).every(Boolean);
  const confirmationValid = confirmation.length > 0 && confirmation === password;
  const invalidLink = Boolean(linkError) || !token;
  const passwordError = submitted && !passwordValid ? "Complete all four password requirements." : "";
  const confirmationError = submitted && !confirmationValid ? "Passwords must match." : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (invalidLink || !passwordValid || !confirmationValid || !token) return;

    setStatus("submitting");
    const result = await resetPassword({ newPassword: password, token });
    setStatus(result.error ? "error" : "success");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.aside}>
        <Link className={styles.brand} href="/" aria-label="TechBondhu home">TECHBONDHU<span>.</span></Link>
        <div className={styles.asideContent}>
          <span className={styles.asideIcon}><FiLock /></span>
          <p>SECURE YOUR ACCOUNT</p>
          <h2>Set a stronger password.</h2>
          <p className={styles.asideCopy}>Your old sessions will be closed after the password changes, keeping the account protected.</p>
        </div>
        <span className={styles.asideFoot}>Use a password you don’t use on another service.</span>
      </aside>

      <section className={styles.panel} aria-labelledby="reset-title">
        <div className={styles.card}>
          <p className={styles.eyebrow}>NEW PASSWORD</p>
          <h1 id="reset-title">Choose a new password</h1>
          <p className={styles.intro}>Create a strong password for your TechBondhu account.</p>

          {invalidLink ? (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              <FiAlertCircle />
              <span><strong>This reset link is invalid or expired.</strong> Request a new link to continue.</span>
            </div>
          ) : status === "success" ? (
            <div className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
              <FiCheck />
              <span><strong>Password updated.</strong> You can now sign in with your new password.</span>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <label htmlFor="new-password">New password</label>
                <div className={`${styles.inputFrame} ${passwordError ? styles.inputFrameError : ""}`}>
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    disabled={status === "submitting"}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby="new-password-rules"
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                  />
                  <button className={styles.revealButton} type="button" disabled={status === "submitting"} aria-label={showPassword ? "Hide passwords" : "Show passwords"} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {passwordError ? <p className={styles.fieldError}>{passwordError}</p> : null}
              </div>

              <ul className={styles.passwordRules} id="new-password-rules" aria-label="Password requirements">
                <li className={rules.length ? styles.ruleMet : ""}><FiCheck /> 8 or more characters</li>
                <li className={rules.upper ? styles.ruleMet : ""}><FiCheck /> One uppercase letter</li>
                <li className={rules.lower ? styles.ruleMet : ""}><FiCheck /> One lowercase letter</li>
                <li className={rules.number ? styles.ruleMet : ""}><FiCheck /> One number</li>
              </ul>

              <div className={styles.fieldGroup}>
                <label htmlFor="confirm-new-password">Confirm new password</label>
                <div className={`${styles.inputFrame} ${confirmationError ? styles.inputFrameError : ""}`}>
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmation}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    disabled={status === "submitting"}
                    aria-invalid={Boolean(confirmationError)}
                    onChange={(event) => {
                      setConfirmation(event.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                  />
                </div>
                {confirmationError ? <p className={styles.fieldError}>{confirmationError}</p> : null}
              </div>

              <button className={`${styles.primaryButton} ${status === "submitting" ? styles.loading : ""}`} type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? <><FiLoader /> Updating password...</> : "Update password"}
              </button>

              {status === "error" ? (
                <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
                  <FiAlertCircle />
                  <span>The reset link could not be used. It may have expired; request a new one.</span>
                </div>
              ) : null}
            </form>
          )}

          <Link className={styles.backLink} href={invalidLink ? "/forgot-password" : "/sign-in"}><FiArrowLeft /> {invalidLink ? "Request a new link" : "Back to sign in"}</Link>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
