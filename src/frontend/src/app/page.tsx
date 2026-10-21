import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <p className="eyebrow">TechBondhu foundation</p>
      <h1>Find the right tech before you buy it.</h1>
      <p className="intro">
        The project structure is ready for catalog search, merchant price
        comparison, PC compatibility, deals, and nearby stores.
      </p>
      <div className="status" role="status">
        Frontend scaffold is running.
      </div>
      <div className="home-actions">
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up">Create account</Link>
      </div>
    </main>
  );
}

