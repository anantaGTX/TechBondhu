"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiLoader } from "react-icons/fi";

import { signIn } from "@/lib/auth-client";

import styles from "./sign-in.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInStatus = "idle" | "submitting" | "success" | "error";

const buildMessages = [
  "Your build starts here",
  "Motherboard aligned",
  "Core components installed",
  "Graphics ready",
  "System ready to power on",
] as const;

function FieldMessage({ id, children }: { id: string; children: string }) {
  if (!children) return null;
  return <p className={styles.fieldMessage} id={id}>{children}</p>;
}

export default function SignInPage() {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<SignInStatus>("idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email);
  const passwordValid = password.length >= 8;

  const stage = useMemo(() => {
    if (status !== "idle" || passwordValid) return 5;
    if (focused === "password" || password.length > 0) return 4;
    if (emailValid) return 3;
    if (focused === "email" || email.length > 0) return 2;
    return 1;
  }, [email.length, emailValid, focused, password.length, passwordValid, status]);

  const emailError = submitted && !emailValid ? "Enter a valid email address." : "";
  const passwordError = submitted && !passwordValid ? "Use at least 8 characters." : "";
  const formLocked = status === "submitting" || status === "success";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);

    return () => {
      preference.removeEventListener("change", syncPreference);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  function resetAuthState() {
    if (status === "error") setStatus("idle");
    if (authError) setAuthError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError(null);

    if (!emailValid || !passwordValid) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      const result = await signIn.email({ email, password, rememberMe: remember });

      if (result.error) {
        setAuthError("Check your email and password, then try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      redirectTimer.current = setTimeout(() => {
        router.push("/");
        router.refresh();
      }, reducedMotion ? 150 : 850);
    } catch {
      setAuthError("Sign-in is unavailable right now. Please try again.");
      setStatus("error");
    }
  }

  const stageMessage = status === "submitting"
    ? "Checking your system"
    : status === "success"
      ? "Build complete"
      : status === "error"
        ? "Your build is still here"
        : buildMessages[stage - 1];

  return (
    <main className={styles.loginShell}>
      <section className={styles.visualPanel} aria-labelledby="build-title">
        <Link className={styles.brand} href="/" aria-label="TechBondhu home">
          TECHBONDHU<span>.</span>
        </Link>

        <div className={styles.visualIntro}>
          <p>BUILD WHILE YOU SIGN IN</p>
          <h2 id="build-title">Your PC comes together with you.</h2>
        </div>

        <div
          className={`${styles.pcStage} ${styles[`stage${stage}`]} ${styles[`status${status}`]}`}
          aria-hidden="true"
        >
          {[
            "/auth/pc/case.webp",
            "/auth/pc/build-stage-2-motherboard.png",
            "/auth/pc/build-stage-3-core.png",
            "/auth/pc/build-stage-4-gpu.png",
            "/auth/pc/build-stage-5-complete.png",
          ].map((source, index) => (
            <img
              key={source}
              className={`${styles.buildFrame} ${stage === index + 1 ? styles.frameActive : ""}`}
              src={source}
              alt=""
            />
          ))}
        </div>

        <div className={styles.buildCaption} aria-live="polite">
          <span className={styles.captionIcon}>
            {status === "submitting" ? <FiLoader /> : status === "error" ? <FiAlertCircle /> : <FiCheck />}
          </span>
          <span>
            <strong>{stageMessage}</strong>
            <small>{status === "error" ? "Fix the details and try once more." : `${stage} of 5 components installed`}</small>
          </span>
        </div>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.formWrap}>
          <header className={styles.formHeader}>
            <p>WELCOME BACK</p>
            <h1 id="login-title">Sign in to TechBondhu</h1>
            <span>Continue comparing products, finding offers and planning your next PC.</span>
          </header>

          {status === "error" && authError ? (
            <div className={`${styles.formAlert} ${styles.errorAlert}`} role="alert">
              <FiAlertCircle />
              <span><strong>We could not sign you in.</strong> {authError}</span>
            </div>
          ) : null}

          {status === "success" ? (
            <div className={`${styles.formAlert} ${styles.successAlert}`} role="status">
              <FiCheck />
              <span><strong>You are signed in.</strong> Taking you back to TechBondhu.</span>
            </div>
          ) : null}

          <form noValidate onSubmit={handleSubmit} onChange={resetAuthState}>
            <div className={styles.fieldGroup}>
              <label htmlFor="email">Email address</label>
              <div className={`${styles.inputFrame} ${emailError ? styles.hasError : ""}`}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={formLocked}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
                {emailValid ? <FiCheck className={styles.validMark} aria-label="Valid email" /> : null}
              </div>
              <FieldMessage id="email-error">{emailError}</FieldMessage>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password">Password</label>
              <div className={`${styles.inputFrame} ${passwordError ? styles.hasError : ""}`}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={formLocked}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                {passwordValid ? <FiCheck className={styles.validMark} aria-label="Valid password" /> : null}
                <button
                  className={styles.revealButton}
                  type="button"
                  disabled={formLocked}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <FieldMessage id="password-error">{passwordError}</FieldMessage>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.rememberControl}>
                <input
                  type="checkbox"
                  checked={remember}
                  disabled={formLocked}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className={styles.customCheck}><FiCheck /></span>
                Keep me signed in
              </label>
              <button className={styles.forgotButton} type="button" disabled title="Password reset is coming soon">
                Forgot password?
              </button>
            </div>

            <button
              className={`${styles.signInButton} ${status === "submitting" ? styles.buttonLoading : ""}`}
              type="submit"
              disabled={formLocked}
            >
              {status === "submitting" ? <><FiLoader /> Signing in...</> : status === "success" ? <><FiCheck /> Signed in</> : "Sign in"}
            </button>
          </form>

          <p className={styles.signUpCopy}>
            New to TechBondhu? <Link href="/sign-up">Create an account</Link>
          </p>
        </div>

        <footer className={styles.formFooter}>
          <span>© {new Date().getFullYear()} TechBondhu</span>
          <Link href="/">Back to home</Link>
        </footer>
      </section>
    </main>
  );
}
