"use client";

import Link from "next/link";
import { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "@/components/account-provider";
import { BrandMark } from "@/components/brand-mark";
import { useNavigationGuard } from "@/components/navigation-guard-provider";

const NAV_ITEMS = [
  { href: "/", label: "Studio" },
  { href: "/account", label: "Mijn account" },
  { href: "/contact", label: "Contact" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user, activePlan, signOut } = useAccount();
  const {
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
    isConfirmingNavigation
  } = useNavigationGuard();

  function handleGuardedNavigation(event: MouseEvent<HTMLElement>, href: string) {
    if (!requestNavigation(href)) {
      event.preventDefault();
      return;
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link
            href="/"
            className="brand-lockup"
            onClick={(event) => handleGuardedNavigation(event, "/")}
          >
            <BrandMark />
          </Link>

          <nav className="app-nav" aria-label="Hoofdnavigatie">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-link${pathname === item.href ? " is-active" : ""}`}
                onClick={(event) => handleGuardedNavigation(event, item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="account-chip-row">
            {isAuthenticated ? (
              <>
                <div className="account-chip">
                  <strong>{user?.name}</strong>
                  <span>{activePlan.name}</span>
                </div>
                <button type="button" className="ghost-button small-button" onClick={signOut}>
                  Uitloggen
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="primary-button small-button"
                onClick={(event) => handleGuardedNavigation(event, "/login")}
              >
                Inloggen
              </Link>
            )}
          </div>
        </div>
      </header>

      {children}

      {isConfirmingNavigation ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="nav-confirm-title">
          <div className="confirm-modal">
            <h2 id="nav-confirm-title">Ontwerp verlaten?</h2>
            <p>
              Weet je zeker dat je deze pagina wilt verlaten? Sla je ontwerp eerst op als je deze
              versie wilt bewaren.
            </p>
            <div className="actions">
              <button type="button" className="primary-button" onClick={confirmNavigation}>
                Ja, verlaten
              </button>
              <button type="button" className="ghost-button" onClick={cancelNavigation}>
                Nee, blijf hier
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
