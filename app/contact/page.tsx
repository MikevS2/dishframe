import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <main className="page-shell">
      <div className="page-grid">
        <section className="hero compact-hero">
          <p className="eyebrow">Contact</p>
          <h1>We helpen je graag verder</h1>
          <p>
            Heb je een vraag, loop je ergens vast of heb je een idee voor een nieuwe functie? Laat het gerust weten.
          </p>
        </section>

        <section className="contact-grid">
          <section className="panel contact-card">
            <div className="stack">
              <div>
                <h2 className="section-title">Neem contact op</h2>
                <p className="section-copy">
                  Heb je een vraag over je account, je abonnement of een opgeslagen recept? Dan kun je ons direct
                  bereiken via e-mail.
                </p>
              </div>

              <div className="stat-card">
                <span className="stat-label">E-mail</span>
                <strong>info@dishframe.nl</strong>
              </div>

            </div>
          </section>

          <section className="panel contact-card">
            <div className="stack">
              <div>
                <h2 className="section-title">Suggesties en feedback</h2>
                <p className="section-copy">
                  We horen ook graag welke layouts, filters of functies je nog mist. Suggesties helpen ons om DishFrame
                  verder te verbeteren.
                </p>
              </div>

            </div>
          </section>
        </section>

        <section className="panel contact-form-panel">
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
