"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!name.trim() || !email.trim() || !topic.trim() || !message.trim()) {
      setError("Vul alle velden in voordat je het formulier verstuurt.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic: topic.trim(),
          message: message.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Je bericht kon niet worden verstuurd.");
      }

      setStatus("Je bericht is verstuurd. We hebben het goed ontvangen.");
      setName("");
      setEmail("");
      setTopic("");
      setMessage("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Je bericht kon niet worden verstuurd."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Formulier</p>
        <h2 className="section-title section-title-large">Stuur je bericht of suggestie</h2>
        <p className="section-copy">
          Heb je een vraag, loop je ergens op vast of wil je iets voorstellen? Laat het ons gerust
          weten.
        </p>
      </div>

      <div className="contact-form-grid">
        <div className="field">
          <label htmlFor="contact-name">Naam</label>
          <input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="contact-email">E-mailadres</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-topic">Onderwerp</label>
        <input id="contact-topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="contact-message">Bericht of suggestie</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Vertel ons waarmee we je kunnen helpen of welke verbetering je graag zou zien."
        />
      </div>

      {error ? <p className="status error">{error}</p> : null}
      {status ? <p className="status success">{status}</p> : null}

      <div className="actions">
        <button type="submit" className="primary-button compact-button" disabled={isSubmitting}>
          {isSubmitting ? "Bericht versturen..." : "Bericht versturen"}
        </button>
      </div>
    </form>
  );
}
