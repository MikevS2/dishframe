# Recept Layout Studio

Een Nederlandstalige Next.js-webapp die losse receptdata omzet naar een vaste, stijlvolle receptkaart.

## Functionaliteit

- invoer via formulier of ruwe tekst
- AI-normalisatie van ingredienten en bereidingsstappen
- AI-generatie van een gerechtfoto of eigen foto-upload
- live preview in een vaste layout
- export naar PNG
- accountomgeving met opgeslagen recepten en abonnementenstructuur

## Starten

1. Installeer Node.js 20 of nieuwer.
2. Voer `npm install` uit.
3. Maak een `.env.local` op basis van `.env.example`.
4. Start met `npm run dev`.

## Omgevingsvariabelen

- `OPENAI_API_KEY`: vereist voor AI-tekstverwerking en beeldgeneratie
- `OPENAI_TEXT_MODEL`: optioneel, standaard `gpt-4.1-mini`
- `OPENAI_IMAGE_MODEL`: optioneel, standaard `gpt-image-1-mini`
- `NEXT_PUBLIC_BACKEND_PROVIDER`: `local` of later `supabase`
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publieke sleutel voor auth en clientgebruik
- `SUPABASE_SERVICE_ROLE_KEY`: server key voor beschermde backend-acties
- `STRIPE_SECRET_KEY`: Stripe server key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Fallbackgedrag

Wanneer er geen `OPENAI_API_KEY` aanwezig is, gebruikt de app ingebouwde fallbacklogica voor tekstnormalisatie en een SVG-placeholder voor de gerechtfoto.

## Volgende productiestap

De app gebruikt nu nog lokale opslag voor accounts en recepten. De codebase is voorbereid om daarna over te stappen naar:

- `Supabase Auth` voor echte accounts
- `Supabase Postgres` voor recepten en gebruikersdata
- `Supabase Storage` voor afbeeldingen
- `Stripe` voor abonnementen en generatiebundels
