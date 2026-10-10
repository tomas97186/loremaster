# Loremaster

Campaign manager e assistente AI per il Dungeon Master: campagne, luoghi, NPC,
personaggi, fazioni, quest, oggetti, sessioni e note, tutto in un'unica app
web utilizzabile da qualsiasi dispositivo della rete locale.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind v4)
- PostgreSQL 16 (container) — dati, utenti e sessioni di login
- Immagini caricate su un volume Docker (`/data/uploads`)
- Gemini API (free tier, default) / Claude API (opzionale) per l'assistente AI

## Avvio con Docker

1. Copia `.env.example` in `.env` e imposta almeno `POSTGRES_PASSWORD`
   (e `GEMINI_API_KEY` se vuoi l'assistente AI).
2. Avvia:

   ```bash
   docker compose up -d --build
   ```

3. Apri `http://<ip-del-computer>:3000` da qualsiasi dispositivo della rete
   locale e crea il tuo account dalla schermata di login.

Al primo avvio l'app crea da sola le tabelle (`db/migrations`). I dati vivono
nei volumi `pgdata` (database) e `uploads` (immagini): sopravvivono a
`docker compose down` e agli aggiornamenti. Per fare un backup:

```bash
docker compose exec db pg_dump -U loremaster loremaster > backup.sql
docker run --rm -v loremaster_uploads:/data -v "$PWD":/out alpine tar czf /out/uploads.tgz -C /data .
```

> Il servizio gira in HTTP sulla rete locale. Se lo metti dietro HTTPS
> imposta `COOKIE_SECURE=true`.

## Sviluppo locale

Serve un Postgres raggiungibile (per esempio `docker compose up -d db` dopo
aver pubblicato la porta 5432, oppure un'istanza locale). In `.env.local`:

```
DATABASE_URL=postgres://loremaster:<password>@localhost:5432/loremaster
UPLOAD_DIR=./data/uploads
GEMINI_API_KEY=...
```

```bash
npm install
npm run dev
```

Per aprire l'app in dev da un altro dispositivo, l'IP deve rientrare in
`allowedDevOrigins` di `next.config.ts` (con Docker non serve).

## Struttura

```
app/                 Route Next.js (auth, app, API upload/file)
components/          Componenti UI condivisi
lib/db/              Accesso ai dati (pg), auth a sessioni, migrazioni
lib/ai/              Provider AI
db/migrations/       Schema SQL, applicato all'avvio
```
