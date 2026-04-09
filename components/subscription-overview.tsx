"use client";

import { useAccount } from "@/components/account-provider";

export function SubscriptionOverview() {
  const { plans, activePlan, changePlan, isAuthenticated } = useAccount();

  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="hero compact-hero">
          <p className="eyebrow">Abonnement</p>
          <h1>Kies het plan dat past bij je recepten</h1>
          <p>
            Begin met een proefperiode en schaal daarna op naar meer generaties per maand zodra je
            vaker recepten wilt maken.
          </p>
        </section>

        <section className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={`panel plan-card${activePlan.id === plan.id ? " is-active" : ""}`}>
              <div className="stack">
                <div className="plan-heading">
                  <div>
                    <h2 className="section-title">{plan.name}</h2>
                    <p className="plan-price">{plan.priceLabel}</p>
                  </div>
                  {plan.badge ? <span className="pill">{plan.badge}</span> : null}
                </div>
                <p className="section-copy">{plan.description}</p>
                <p className="plan-feature">
                  {plan.includesProLayouts
                    ? "Inclusief Pro-layouts"
                    : "Atelier inbegrepen, Pro-layouts vanaf Plus"}
                </p>
                <button
                  type="button"
                  className={activePlan.id === plan.id ? "ghost-button" : "primary-button"}
                  disabled={!isAuthenticated || activePlan.id === plan.id}
                  onClick={() => changePlan(plan.id)}
                >
                  {activePlan.id === plan.id ? "Actief plan" : "Kies dit plan"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
