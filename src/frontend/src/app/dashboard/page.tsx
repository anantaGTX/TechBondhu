import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "./sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="shell">
      <p className="eyebrow">Authenticated</p>
      <h1>Hello, {session.user.name}</h1>
      <p className="intro">Your TechBondhu account is ready.</p>
      <SignOutButton />
    </main>
  );
}

