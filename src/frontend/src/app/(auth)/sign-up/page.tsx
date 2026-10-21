"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const result = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/",
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to create the account.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
      <p className="eyebrow">Join TechBondhu</p>
      <h1>Create account</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button disabled={submitting} type="submit">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="form-help">
        Already registered? <Link href="/sign-in">Sign in</Link>
      </p>
      </section>
    </main>
  );
}

