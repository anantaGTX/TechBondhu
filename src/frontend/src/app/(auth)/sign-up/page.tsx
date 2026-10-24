"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiShield,
} from "react-icons/fi";

import { signIn, signUp } from "@/lib/auth-client";

import styles from "./sign-up.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 1 | 2 | 3;
type SignUpStatus = "idle" | "submitting" | "success" | "error";
type SocialProvider = "google" | "github";

const steps = [
  { id: 1, label: "Account" },
  { id: 2, label: "Security" },
  { id: 3, label: "Review" },
] as const;

function FieldMessage({ id, children }: { id: string; children: string }) {
  if (!children) return null;
  return <p className={styles.fieldMessage} id={id}>{children}</p>;
}

function readableSignUpError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("already") || normalized.includes("exist") || normalized.includes("taken")) {
    return "An account already exists for this email. Try signing in instead.";
  }
  if (normalized.includes("password")) {
    return "That password could not be accepted. Review the requirements and try again.";
  }
  return "Account creation is unavailable right now. Please try again.";
}

export default function SignUpPage() {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [attemptedStep, setAttemptedStep] = useState<Step | null>(null);
  const [status, setStatus] = useState<SignUpStatus>("idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<SocialProvider | null>(null);

  const fullNameValid = name.trim().length >= 2;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordRules = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  const passwordValid = Object.values(passwordRules).every(Boolean);
  const confirmationValid = confirmPassword.length > 0 && confirmPassword === password;
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

  useEffect(() => {
    if (step > 1) stepHeadingRef.current?.focus();
  }, [step]);

  const visualStage = status === "submitting" || status === "success"
    ? 5
    : step === 3
      ? 4
      : step === 2
        ? passwordValid && confirmationValid ? 3 : 2
        : fullNameValid && emailValid ? 2 : 1;

  const nameError = attemptedStep === 1 && !fullNameValid
    ? "Enter your name."
    : "";
  const emailError = attemptedStep === 1 && !emailValid
    ? "Enter a valid email address."
    : "";
  const passwordError = attemptedStep === 2 && !passwordValid
    ? "Complete all four password requirements."
    : "";
  const confirmationError = attemptedStep === 2 && !confirmationValid
    ? "Passwords must match."
    : "";
  const termsError = attemptedStep === 3 && !acceptedTerms
    ? "Accept the Terms and Privacy Policy to continue."
    : "";

  function resetErrorState() {
    if (status === "error") setStatus("idle");
    if (authError) setAuthError(null);
  }

  function goBack() {
    resetErrorState();
    setAttemptedStep(null);
    setStep((current) => Math.max(1, current - 1) as Step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetErrorState();
    setAttemptedStep(step);

    if (step === 1) {
      if (!fullNameValid || !emailValid) return;
      setAttemptedStep(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!passwordValid || !confirmationValid) return;
      setAttemptedStep(null);
      setStep(3);
      return;
    }

    if (!acceptedTerms) return;

    setStatus("submitting");

    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        callbackURL: "/",
      });

      if (result.error) {
        setAuthError(readableSignUpError(result.error.message));
        setStatus("error");
        return;
      }

      setStatus("success");
      redirectTimer.current = setTimeout(() => {
        router.push("/");
        router.refresh();
      }, reducedMotion ? 150 : 950);
    } catch {
      setAuthError("Account creation is unavailable right now. Please try again.");
      setStatus("error");
    }
  }

  async function handleSocialSignUp(provider: SocialProvider) {
    setAuthError(null);
    setSocialSubmitting(provider);
    setStatus("submitting");

    try {
      const result = await signIn.social({
        provider,
        callbackURL: "/",
      });

      if (result.error) {
        if (process.env.NODE_ENV === "development") {
          console.error(`Better Auth ${provider} sign-up rejected`, {
            code: result.error.code,
            message: result.error.message,
          });
        }
        const providerName = provider === "google" ? "Google" : "GitHub";
        setAuthError(`${providerName} sign-up is unavailable. Check the OAuth configuration and try again.`);
        setStatus("error");
        setSocialSubmitting(null);
      }
    } catch {
      const providerName = provider === "google" ? "Google" : "GitHub";
      setAuthError(`${providerName} sign-up is unavailable right now. Please try again.`);
      setStatus("error");
      setSocialSubmitting(null);
    }
  }

  const stageMessage = status === "submitting"
    ? "Final system check"
    : status === "success"
      ? "Account ready"
      : status === "error"
        ? "Your progress is saved"
          : visualStage === 1
            ? "Start with your details"
            : visualStage === 2
              ? "Account details aligned"
              : visualStage === 3
                ? "Security installed"
                : "Ready for review";

  return (
    <main className={styles.signupShell}>
      <section className={styles.visualPanel} aria-labelledby="signup-build-title">
        <Link className={styles.brand} href="/" aria-label="TechBondhu home">
          TECHBONDHU<span>.</span>
        </Link>

        <div className={styles.visualIntro}>
          <p>BUILD YOUR ACCOUNT</p>
          <h2 id="signup-build-title">Three clear steps. One smarter tech companion.</h2>
        </div>

        <div
          className={`${styles.pcStage} ${styles[`stage${visualStage}`]} ${styles[`status${status}`]}`}
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
              className={`${styles.buildFrame} ${visualStage === index + 1 ? styles.frameActive : ""}`}
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
            <small>{status === "error" ? "Review the message and try again." : `Registration step ${step} of 3`}</small>
          </span>
        </div>
      </section>

      <section className={styles.formPanel} aria-labelledby="signup-title">
        <div className={styles.formWrap}>
          <nav className={styles.stepper} aria-label="Account creation progress">
            {steps.map((item) => {
              const complete = item.id < step || status === "success";
              const current = item.id === step && status !== "success";
              return (
                <div
                  key={item.id}
                  className={`${styles.stepItem} ${complete ? styles.stepComplete : ""} ${current ? styles.stepCurrent : ""}`}
                  aria-current={current ? "step" : undefined}
                >
                  <span>{complete ? <FiCheck /> : item.id}</span>
                  <small>{item.label}</small>
                </div>
              );
            })}
          </nav>

          <header className={styles.formHeader}>
            <p>CREATE YOUR ACCOUNT</p>
            <h1 id="signup-title">Join TechBondhu</h1>
            <span>Save comparisons, track offers and keep every PC build in one place.</span>
          </header>

          {status === "error" && authError ? (
            <div className={`${styles.formAlert} ${styles.errorAlert}`} role="alert">
              <FiAlertCircle />
              <span><strong>We could not create your account.</strong> {authError}</span>
            </div>
          ) : null}

          {status === "success" ? (
            <div className={styles.successState} role="status">
              <span className={styles.successIcon}><FiCheck /></span>
              <h2>Account created</h2>
              <p>Your TechBondhu workspace is ready. Taking you home now.</p>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} onChange={resetErrorState}>
              <div className={styles.stepContent} key={step}>
                {step === 1 ? (
                  <>
                    <div className={styles.stepHeading}>
                      <span>STEP 1 OF 3</span>
                      <h2 ref={stepHeadingRef} tabIndex={-1}>Tell us who you are</h2>
                      <p>Use the email you want associated with saved builds and offer alerts.</p>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="name">Full name</label>
                      <div className={`${styles.inputFrame} ${nameError ? styles.hasError : ""}`}>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={name}
                          placeholder="First and last name"
                          autoComplete="name"
                          disabled={formLocked}
                          aria-invalid={Boolean(nameError)}
                          aria-describedby={nameError ? "name-error" : undefined}
                          onChange={(event) => setName(event.target.value)}
                        />
                        {fullNameValid ? <FiCheck className={styles.validMark} aria-label="Valid name" /> : null}
                      </div>
                      <FieldMessage id="name-error">{nameError}</FieldMessage>
                    </div>

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
                          inputMode="email"
                          disabled={formLocked}
                          aria-invalid={Boolean(emailError)}
                          aria-describedby={emailError ? "email-error" : undefined}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                        {emailValid ? <FiCheck className={styles.validMark} aria-label="Valid email" /> : null}
                      </div>
                      <FieldMessage id="email-error">{emailError}</FieldMessage>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <div className={styles.stepHeading}>
                      <span>STEP 2 OF 3</span>
                      <h2 ref={stepHeadingRef} tabIndex={-1}>Secure your account</h2>
                      <p>Create a strong password you do not use on another service.</p>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="password">Password</label>
                      <div className={`${styles.inputFrame} ${passwordError ? styles.hasError : ""}`}>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          disabled={formLocked}
                          aria-invalid={Boolean(passwordError)}
                          aria-describedby={passwordError ? "password-requirements password-error" : "password-requirements"}
                          onChange={(event) => setPassword(event.target.value)}
                        />
                        <button
                          className={styles.revealButton}
                          type="button"
                          disabled={formLocked}
                          aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      <FieldMessage id="password-error">{passwordError}</FieldMessage>
                    </div>

                    <ul className={styles.passwordRules} id="password-requirements" aria-label="Password requirements">
                      <li className={passwordRules.length ? styles.ruleMet : ""}><FiCheck /> 8 or more characters</li>
                      <li className={passwordRules.upper ? styles.ruleMet : ""}><FiCheck /> One uppercase letter</li>
                      <li className={passwordRules.lower ? styles.ruleMet : ""}><FiCheck /> One lowercase letter</li>
                      <li className={passwordRules.number ? styles.ruleMet : ""}><FiCheck /> One number</li>
                    </ul>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="confirm-password">Confirm password</label>
                      <div className={`${styles.inputFrame} ${confirmationError ? styles.hasError : ""}`}>
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          disabled={formLocked}
                          aria-invalid={Boolean(confirmationError)}
                          aria-describedby={confirmationError ? "confirmation-error" : undefined}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        {confirmationValid ? <FiCheck className={styles.validMark} aria-label="Passwords match" /> : null}
                      </div>
                      <FieldMessage id="confirmation-error">{confirmationError}</FieldMessage>
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <div className={styles.stepHeading}>
                      <span>STEP 3 OF 3</span>
                      <h2 ref={stepHeadingRef} tabIndex={-1}>Review and create</h2>
                      <p>Check your details before TechBondhu creates your account.</p>
                    </div>

                    <dl className={styles.reviewList}>
                      <div><dt>Name</dt><dd>{name.trim()}</dd></div>
                      <div><dt>Email</dt><dd>{email.trim().toLowerCase()}</dd></div>
                      <div><dt>Password</dt><dd><FiShield /> Protected</dd></div>
                    </dl>

                    <label className={styles.termsControl}>
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        disabled={formLocked}
                        aria-invalid={Boolean(termsError)}
                        aria-describedby={termsError ? "terms-error" : undefined}
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                      />
                      <span className={styles.customCheck}><FiCheck /></span>
                      <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span>
                    </label>
                    <FieldMessage id="terms-error">{termsError}</FieldMessage>
                  </>
                ) : null}
              </div>

              <div className={styles.formActions}>
                {step > 1 ? (
                  <button className={styles.backButton} type="button" disabled={formLocked} onClick={goBack}>
                    <FiArrowLeft /> Back
                  </button>
                ) : <span />}
                <button
                  className={`${styles.primaryButton} ${status === "submitting" ? styles.buttonLoading : ""}`}
                  type="submit"
                  disabled={formLocked}
                >
                  {status === "submitting"
                    ? <><FiLoader /> Creating account...</>
                    : step === 3
                      ? "Create account"
                      : <>Continue <FiArrowRight /></>}
                </button>
              </div>
            </form>
          )}

          {step === 1 && status !== "success" ? (
            <>
              <div className={styles.formDivider}><span>or continue with</span></div>
              <div className={styles.socialButtons} aria-label="Social sign up options">
                <button
                  className={`${styles.socialButton} ${socialSubmitting === "google" ? styles.socialButtonLoading : ""}`}
                  type="button"
                  disabled={formLocked}
                  onClick={() => handleSocialSignUp("google")}
                  aria-busy={socialSubmitting === "google"}
                >
                  {socialSubmitting === "google" ? <FiLoader /> : <FcGoogle />}
                  {socialSubmitting === "google" ? "Connecting..." : "Continue with Google"}
                </button>
                <button
                  className={`${styles.socialButton} ${socialSubmitting === "github" ? styles.socialButtonLoading : ""}`}
                  type="button"
                  disabled={formLocked}
                  onClick={() => handleSocialSignUp("github")}
                  aria-busy={socialSubmitting === "github"}
                >
                  {socialSubmitting === "github" ? <FiLoader /> : <FaGithub />}
                  {socialSubmitting === "github" ? "Connecting..." : "Continue with GitHub"}
                </button>
              </div>
            </>
          ) : null}

          <p className={styles.signInCopy}>
            Already have an account? <Link href="/sign-in">Sign in</Link>
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
