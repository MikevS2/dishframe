"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "@/components/account-provider";

function isStrongEnoughPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function LoginPanel() {
  const router = useRouter();
  const { signIn, signUp, sendMagicLink, isAuthenticated, isAuthLoading } = useAccount();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod] = useState<"password" | "magic">("password");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (mode === "signup" && !name.trim()) {
      setError("Vul ook je naam in.");
      return;
    }

    if (!email.trim()) {
      setError("Vul je e-mailadres in.");
      return;
    }

    if (mode === "login" && loginMethod === "magic") {
      setIsSubmitting(true);
      const result = await sendMagicLink(email);
      setIsSubmitting(false);

      if (result) {
        setError(result);
        return;
      }

      setSuccess("We hebben een inloglink naar je e-mailadres gestuurd.");
      return;
    }

    if (!password.trim()) {
      setError("Vul je wachtwoord in.");
      return;
    }

    if (mode === "signup" && !isStrongEnoughPassword(password)) {
      setError("Gebruik minimaal 8 tekens met ten minste 1 letter en 1 cijfer.");
      return;
    }

    setIsSubmitting(true);

    const result =
      mode === "signup"
        ? await signUp(name, email, password)
        : await signIn(name, email, password);

    setIsSubmitting(false);

    if (result) {
      setError(result);
      return;
    }

    router.push("/");
  }

  if (isAuthLoading) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="page-grid narrow-grid">
          <section className="panel account-panel">
            <h1 className="section-title">Je bent al ingelogd</h1>
            <p className="section-copy">
              Je account staat klaar. Ga verder naar je studio of bekijk je opgeslagen recepten.
            </p>
            <div className="actions">
              <Link href="/" className="primary-button">
                Naar studio
              </Link>
              <Link href="/mijn-recepten" className="ghost-button">
                Mijn recepten
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-grid narrow-grid">
        <section className="panel auth-panel">
          <div className="stack">
            <div>
              <p className="eyebrow">Account</p>
              <h1 className="section-title section-title-large">
                {mode === "signup" ? "Maak je account aan" : "Log in en bewaar je recepten"}
              </h1>
              <p className="section-copy">
                Start met 5 gratis generaties, bewaar je ontwerpen per categorie en houd je
                generaties overzichtelijk bij.
              </p>
            </div>

            <div className="segmented auth-segmented" role="tablist" aria-label="Accountmodus">
              <button
                type="button"
                className={mode === "login" ? "is-active" : ""}
                onClick={() => {
                  setMode("login");
                  setLoginMethod("password");
                  setError("");
                  setSuccess("");
                }}
              >
                Inloggen
              </button>
              <button
                type="button"
                className={mode === "signup" ? "is-active" : ""}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccess("");
                }}
              >
                Registreren
              </button>
            </div>

            {mode === "login" ? (
              <div className="segmented auth-segmented" role="tablist" aria-label="Inlogmethode">
                <button
                  type="button"
                  className={loginMethod === "password" ? "is-active" : ""}
                  onClick={() => {
                    setLoginMethod("password");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Met wachtwoord
                </button>
                <button
                  type="button"
                  className={loginMethod === "magic" ? "is-active" : ""}
                  onClick={() => {
                    setLoginMethod("magic");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Via e-mail link
                </button>
              </div>
            ) : null}

            {mode === "signup" ? (
              <div className="field">
                <label htmlFor="login-name">Naam</label>
                <input
                  id="login-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="login-email">E-mailadres</label>
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete={mode === "login" ? "email" : "username"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {mode === "signup" || loginMethod === "password" ? (
              <div className="field">
                <label htmlFor="login-password">Wachtwoord</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                />
              </div>
            ) : null}

            {error ? <p className="status error">{error}</p> : null}
            {success ? <p className="status success">{success}</p> : null}

            <div className="actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? "Even bezig..."
                  : mode === "signup"
                    ? "Account aanmaken"
                    : loginMethod === "magic"
                      ? "Inloglink versturen"
                      : "Inloggen"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
