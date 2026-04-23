# Spec: TV-serie Händelselogg

## Koncept

En statisk webbapp (Astro + Supabase) där en grupp tittar på TV-serier tillsammans och i realtid loggar och räknar roliga/återkommande händelser — t.ex. "Hur många gånger säger Walter White 'I am the danger' i säsong 2?". Gruppen delar ett rum-ID med lösenord. All data sparas permanent i Supabase.

---

## Användare och problem

- **Vem:** En liten grupp (2–10 pers) som tittar på TV-serie tillsammans, fysiskt eller på distans.
- **Problem:** Ingen bra plats att kollektivt räkna/dokumentera återkommande händelser i realtid under tittandet — anteckningsblock och delad Google Sheet är klumpiga.
- **Utfall:** En snabb, gemensam räknare/logg som alla i rummet ser uppdateras direkt.

---

## Mål och framgångskriterier

1. En händelse kan loggas med ett knapptryck under pågående avsnitt.
2. Alla i rummet ser räknare uppdateras utan att ladda om sidan (Supabase Realtime).
3. Data är kopplad till rätt serie → säsong → avsnitt → händelsetyp.
4. Rum skyddas med ett delat lösenord (enkelt, ingen fullständig auth).
5. Appen deployar till GitHub Pages utan server-beroenden (Supabase är extern).

---

## Funktioner — MVP

### Rum & åtkomst
- `[Bekräftat]` Skapa/gå med i rum via rum-ID + lösenord
- `[Rekommenderat]` Rum-ID + lösenordshash lagras i Supabase; klienten jämför vid join
- `[Öppet]` Lösenord i klartext i Supabase vs. bcrypt-hash — bestäm säkerhetsnivå

### Struktur
- `[Bekräftat]` Hierarki: Serie → Säsong → Avsnitt → Händelsetyp
- `[Rekommenderat]` Händelsetyp skapas av användaren (t.ex. "säger 'I am the danger'", "tar av glasögonen")
- `[Rekommenderat]` Händelsetyp är knuten till en serie, återanvänds över avsnitt

### Loggning
- `[Bekräftat]` Klicka "+1" på en händelsetyp i aktivt avsnitt → loggar en händelse med timestamp + (valfritt) vem som loggade
- `[Rekommenderat]` Möjlighet att ångra senaste loggning (soft delete / -1)
- `[Rekommenderat]` Visa räknare live per händelsetyp i pågående avsnitt

### Realtid
- `[Bekräftat]` Supabase Realtime (Postgres Changes) — alla i rummet ser uppdateringar direkt
- `[Öppet]` Hantering av offline/reconnect — visa varning om realtid tappar anslutning?

### Statistik
- `[Rekommenderat]` Per avsnitt: lista händelser med count
- `[Rekommenderat]` Per serie: totalt per händelsetyp över alla säsonger
- `[Öppet]` Graf/visualisering i MVP eller post-MVP?

---

## Funktioner — Post-MVP

- Export till CSV/JSON per serie
- Graf över händelsefrekvens per avsnitt (t.ex. Recharts eller Chart.js)
- Kommentarer på enskilda händelser ("detta var scenen vid 23:14")
- Dela publik statistiksida (read-only länk utan lösenord)
- Stöd för egna ikoner/emojis per händelsetyp

---

## Teknik och arkitektur

| Område | Status | Val | Motivering |
|---|---|---|---|
| Frontend-framework | `[Bekräftat]` | Astro | Statisk output → GitHub Pages, modern DX |
| Reaktivitet | `[Rekommenderat]` | Astro Islands + Svelte | Astro är statisk-first; interaktiva räknare behöver ett island-framework. Svelte är lättviktigt och passar Astro-filosofin. |
| Databas + auth | `[Bekräftat]` | Supabase (Postgres) | Persistent data, inbyggd Realtime |
| Realtid | `[Bekräftat]` | Supabase Realtime (Postgres Changes) | Inga extra WebSocket-tjänster behövs |
| Hosting | `[Bekräftat]` | GitHub Pages | `astro build` → `dist/` → gh-pages branch |
| Deploy | `[Rekommenderat]` | GitHub Actions (`withastro/action`) | Automatisk deploy vid push till `main` |
| Lösenordsskydd | `[Rekommenderat]` | SHA-256-hash av lösenord, jämförs client-side mot Supabase-rad | Enkel, utan full Supabase Auth; acceptabel för låg-stakes bruk |
| Styling | `[Rekommenderat]` | Tailwind CSS (Astro-integration finns) | Snabbt, zero-runtime CSS |

> ⚠️ **Säkerhetsnotering:** Supabase anon-key exponeras i frontend-koden (oundvikligt för statiska appar). Skydda med Supabase Row Level Security (RLS) så att klienter bara kan läsa/skriva data de har rum-ID-token för. Lösenordet ska **aldrig** lagras i klartext.

---

## Datamodell

```jsonc
// rooms
{
  "id": "uuid",
  "room_slug": "string",          // användardefinierat, t.ex. "brba-fredagskväll"
  "password_hash": "string",      // SHA-256 av lösenordet
  "created_at": "timestamp"
}

// series
{
  "id": "uuid",
  "room_id": "uuid",
  "title": "string",              // "Breaking Bad"
  "created_at": "timestamp"
}

// event_types
{
  "id": "uuid",
  "series_id": "uuid",
  "label": "string",              // "Säger 'I am the danger'"
  "emoji": "string|null"          // valfri ikon, post-MVP
}

// episodes
{
  "id": "uuid",
  "series_id": "uuid",
  "season": "integer",
  "episode": "integer",
  "title": "string|null"
}

// events (loggade händelser)
{
  "id": "uuid",
  "episode_id": "uuid",
  "event_type_id": "uuid",
  "room_id": "uuid",
  "logged_by": "string|null",     // visningsnamn, ingen riktig auth
  "deleted": "boolean",           // soft delete för ångra
  "created_at": "timestamp"
}
```

---

## Repo-struktur

```
/
├── .github/workflows/deploy.yml   # GitHub Actions → gh-pages
├── src/
│   ├── components/
│   │   ├── RoomGate.svelte        # Join-formulär med rum-ID + lösenord
│   │   ├── EventCounter.svelte    # +1-knapp, live-räknare (Realtime)
│   │   ├── EpisodeView.svelte     # Aktivt avsnitt + alla händelsetyper
│   │   └── StatsView.svelte       # Statistik per serie/säsong
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro            # Landningssida / room-join
│   │   └── room/[slug].astro      # Dynamisk rumsvy (SSG med fallback)
│   ├── lib/
│   │   ├── supabase.ts            # Supabase-klient + typer
│   │   ├── realtime.ts            # Realtime-prenumerationer
│   │   └── crypto.ts              # SHA-256-hjälpfunktion
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
└── supabase/
    └── migrations/                # SQL-migrationer versionshanterade i repo
```

---

## Risker och öppna frågor

- `[Öppet]` **Lösenordssäkerhet:** SHA-256 client-side är enkel men inte kryptografiskt robust (ingen saltning). Acceptabelt för hobby-bruk — men dokumentera medvetet valet.
- `[Öppet]` **RLS-policy:** Måste designas noggrant så att ett rum-ID inte läcker data från andra rum.
- `[Öppet]` **Offline-hantering:** Vad händer om Realtime-anslutningen bryts mitt i ett avsnitt?
- `[Öppet]` **Graf i MVP eller ej?** Räknare + tabell räcker förmodligen för MVP.
- `[Öppet]` **Astro Island-framework:** Svelte rekommenderas (lättviktigt, passar Astro-filosofin) men React fungerar också — välj nu för att slippa byta senare.

---

## Nästa rekommenderade iteration

**Initiera repo och verifiera deploy-pipeline innan någon appkod skrivs:**

```bash
npm create astro@latest
```

Lägg till Tailwind + Svelte-integration → konfigurera `astro.config.mjs` för statisk output och GitHub Pages base-path → sätt upp GitHub Actions-workflow → verifiera att en tom `index.astro` deployar korrekt till `https://<user>.github.io/<repo>/`.

Först därefter: koppla Supabase och börja med `RoomGate.svelte`.
