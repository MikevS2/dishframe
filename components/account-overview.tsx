"use client";

import Link from "next/link";
import { useAccount } from "@/components/account-provider";

export function AccountOverview() {
  const { user, activePlan, remainingGenerationsLabel, recipes } = useAccount();

  return (
    <main className="page-shell">
      <div className="page-grid narrow-grid">
        <section className="panel account-panel">
          {user ? (
            <div className="stack">
              <div>
                <p className="eyebrow">Mijn account</p>
                <h1 className="section-title section-title-large">{user.name}</h1>
                <p className="section-copy">{user.email}</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Actief plan</span>
                  <strong>{activePlan.name}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Beschikbaar</span>
                  <strong>{remainingGenerationsLabel}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Opgeslagen recepten</span>
                  <strong>{recipes.length}</strong>
                </div>
              </div>

              <div className="actions">
                <Link href="/mijn-recepten" className="ghost-button">
                  Mijn recepten
                </Link>
                <Link href="/abonnement" className="ghost-button">
                  Abonnement
                </Link>
              </div>
            </div>
          ) : (
            <div className="stack">
              <p className="eyebrow">Mijn account</p>
              <h1 className="section-title section-title-large">Nog niet ingelogd</h1>
              <p className="section-copy">
                Log in om generaties te maken, recepten op te slaan en bewaarde recepten in te zien.
              </p>
              <Link href="/login" className="primary-button small-button inline-button">
                Inloggen
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
