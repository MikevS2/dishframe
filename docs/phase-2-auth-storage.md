# Fase 2: Echte Accounts En Opslag

## Gekozen richting
- Auth: Supabase Auth
- Database: Supabase Postgres
- Bestanden: Supabase Storage
- Betalingen: Stripe

## Waarom deze keuze
- Auth, database en opslag zitten in een platform
- Goede match met een Next.js app
- Makkelijk door te groeien van testomgeving naar echte productie

## Wat eerst gebouwd wordt
1. Echte registratie en inloggen
2. Gebruikersprofiel in database
3. Opgeslagen recepten per gebruiker
4. Categorie, layout en kleur opslaan per recept
5. Generaties per gebruiker bijhouden

## Wat daarna komt
1. Stripe-abonnementen
2. Pro-layouttoegang op basis van abonnement
3. Maandelijkse generatiebundels
4. Receptafbeeldingen opslaan in cloudopslag

## Benodigde tabellen

### profiles
- id
- email
- full_name
- active_plan
- monthly_generation_limit
- generations_used
- period_starts_at

### recipes
- id
- user_id
- title
- category
- tags
- total_time_minutes
- layout_id
- color_theme_id
- image_path
- recipe_json
- created_at
- updated_at

### subscriptions
- id
- user_id
- stripe_customer_id
- stripe_subscription_id
- plan_id
- status
- current_period_start
- current_period_end

## Omgevingsvariabelen die hierna nodig zijn
- NEXT_PUBLIC_BACKEND_PROVIDER
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
