import { useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiGithub,
  FiLoader,
  FiMail,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildSteps = [
  ["case", "Case"],
  ["motherboard", "Motherboard"],
  ["core", "CPU + RAM"],
  ["gpu", "Graphics"],
  ["cooling", "Cooling"],
];

function FieldMessage({ id, children }) {
  if (!children) return null;
  return <p className="field-message" id={id}>{children}</p>;
}

export function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const submitTimer = useRef(null);

  const emailValid = EMAIL_PATTERN.test(email);
  const passwordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  const stage = useMemo(() => {
    if (status === "success" || status === "error" || status === "submitting") return 5;
    if (passwordValid) return 5;
    if (focused === "password" || password.length > 0) return 4;
    if (emailValid) return 3;
    if (focused === "email" || email.length > 0) return 2;
    return 1;
  }, [email.length, emailValid, focused, password.length, passwordValid, status]);

  const emailError = submitted && !emailValid ? "Enter a valid email address." : "";
  const passwordError = submitted && !passwordValid
    ? "Use at least 8 characters, including a letter and a number."
    : "";

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!emailValid || !passwordValid) {
      setStatus("idle");
      return;
    }

    window.clearTimeout(submitTimer.current);
    setStatus("submitting");
    submitTimer.current = window.setTimeout(() => {
      setStatus(email.toLowerCase().includes("error") ? "error" : "success");
    }, reducedMotion ? 450 : 1500);
  };

  const resetStatus = () => {
    if (status === "error" || status === "success") setStatus("idle");
  };

  return (
    <main className={`login-shell ${reducedMotion ? "force-reduced-motion" : ""}`}>
      <section className="build-panel" aria-labelledby="build-title">
        <div className="brand brand-mobile" aria-label="TechBondhu home">
          TechBondhu<span>.</span>
        </div>

        <div className="build-kicker">
          <span>ASSEMBLY / AUTH-01</span>
          <button
            className="motion-toggle"
            type="button"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            Motion: {reducedMotion ? "reduced" : "full"}
          </button>
        </div>

        <div className="build-copy">
          <p className="eyebrow">YOUR BUILD, READY WHEN YOU ARE</p>
          <h2 id="build-title">Sign in. Power up.</h2>
          <p>Complete your details while your system comes together.</p>
        </div>

        <div className={`pc-stage stage-${stage} is-${status}`} aria-hidden="true">
          <span className="stage-cross cross-a">+</span>
          <span className="stage-cross cross-b">+</span>
          <div className="pc-light" />
          <img className="pc-layer layer-case" src="/assets/pc/case.png" alt="" />
          <img className="pc-layer layer-motherboard" src="/assets/pc/motherboard.png" alt="" />
          <img className="pc-layer layer-core" src="/assets/pc/cpu-ram.png" alt="" />
          <img className="pc-layer layer-gpu" src="/assets/pc/gpu.png" alt="" />
          <img className="pc-layer layer-cooling" src="/assets/pc/cooler-fans.png" alt="" />
          <img className="fan-rotor rotor-cpu" src="/assets/pc/fan-rotor.png" alt="" />
          <img className="fan-rotor rotor-front-a" src="/assets/pc/fan-rotor.png" alt="" />
          <img className="fan-rotor rotor-front-b" src="/assets/pc/fan-rotor.png" alt="" />
          <img className="fan-rotor rotor-front-c" src="/assets/pc/fan-rotor.png" alt="" />
          <span className="diagnostic-light" />
          <div className="product-line" />
        </div>

        <ol className="build-progress" aria-label="PC assembly progress">
          {buildSteps.map(([key, label], index) => {
            const active = stage >= index + 1;
            return (
              <li key={key} className={active ? "is-installed" : ""}>
                <span className="step-node">{active ? <FiCheck /> : index + 1}</span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="build-status" aria-live="polite">
          {status === "success" ? (
            <><FiCheck /><span><strong>Build complete</strong> · System ready</span></>
          ) : status === "error" ? (
            <><FiAlertCircle /><span><strong>Diagnostic alert</strong> · Check sign-in details</span></>
          ) : status === "submitting" ? (
            <><FiLoader className="status-spinner" /><span><strong>Running checks</strong> · Cooling online</span></>
          ) : (
            <><span className="status-dot" /><span><strong>{stage} / 5 installed</strong> · Awaiting input</span></>
          )}
        </div>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <div className="form-wrap">
          <a className="brand brand-desktop" href="#" aria-label="TechBondhu home">
            TechBondhu<span>.</span>
          </a>

          <header className="form-header">
            <p className="eyebrow">MEMBER ACCESS</p>
            <h1 id="login-title">Welcome back</h1>
            <p>Compare smarter, find better offers, and continue your next PC build.</p>
          </header>

          <form noValidate onSubmit={handleSubmit} onChange={resetStatus}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <div className={`input-frame ${emailError ? "has-error" : ""}`}>
                <FiMail aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
                {emailValid && <FiCheck className="valid-mark" aria-label="Valid email" />}
              </div>
              <FieldMessage id="email-error">{emailError}</FieldMessage>
            </div>

            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#forgot">Forgot password?</a>
              </div>
              <div className={`input-frame ${passwordError ? "has-error" : ""}`}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="At least 8 characters"
                  autoComplete="current-password"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : "password-hint"}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <button
                  className="reveal-button"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                {passwordValid && <FiCheck className="valid-mark password-valid" aria-label="Valid password" />}
              </div>
              <p className="password-hint" id="password-hint">8+ characters with a letter and a number.</p>
              <FieldMessage id="password-error">{passwordError}</FieldMessage>
            </div>

            <label className="remember-control">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span className="custom-check"><FiCheck /></span>
              Remember me
            </label>

            {status === "error" && (
              <div className="form-alert error-alert" role="alert">
                <FiAlertCircle />
                <span><strong>We couldn’t sign you in.</strong> Check your details and try again.</span>
              </div>
            )}
            {status === "success" && (
              <div className="form-alert success-alert" role="status">
                <FiCheck />
                <span><strong>Build complete.</strong> Your workspace is ready.</span>
              </div>
            )}

            <button className="sign-in-button" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? <><FiLoader /> Building session…</> : status === "success" ? <><FiCheck /> Signed in</> : "Sign in"}
            </button>
          </form>

          <div className="divider"><span>or continue with</span></div>

          <div className="social-row">
            <button type="button" onClick={() => setStatus("success")}><FcGoogle /> Google</button>
            <button type="button" onClick={() => setStatus("success")}><FiGithub /> GitHub</button>
          </div>

          <p className="sign-up-copy">New to TechBondhu? <a href="#signup">Create an account</a></p>
          <p className="legal-copy">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </div>
      </section>
    </main>
  );
}
