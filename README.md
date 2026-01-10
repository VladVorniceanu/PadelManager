# Padel Manager (Full-Stack)

Aplicație full-stack pentru management de meciuri și rezervări de padel: autentificare, locații/terenuri, booking, meciuri (echipe + scor), statistici și zonă de admin.

---

## Tech Stack

- **Backend:** Node.js + Express + Firestore (Firebase Admin)
- **Auth:** Firebase Auth (ID token în `Authorization: Bearer ...`)
- **Frontend:** Vue 3 + Vite + Pinia + Axios

---

## Structură proiect

```text
padelmanager/
  SERVER/        # API Express + Firestore
  CLIENT/CLIENT/ # Vue 3 app
```

---

## Funcționalități

- Autentificare (Firebase)
- Locations + Courts (listare, detalii)
- **Book a match** (sloturi disponibile + creare rezervare/meci)
- Matches: listă, detalii, editare echipe, scor
- Stats: statistici personale
- Admin: users (roluri), locations/courts, tournaments
- Reconciliere status meciuri la `GET /matches` (scheduled/ongoing/completed)

---

## Backend (SERVER)

### Cerințe

- Node.js (LTS recomandat)
- Proiect Firebase cu Firestore activ
- Service account (Firebase Admin) configurat

### Configurare

Setează variabilele de mediu (în funcție de implementarea din `SERVER/src/config/firebase.js`).

Exemplu:
- `PORT=8080`
- `FIREBASE_PROJECT_ID=...`
- `FIREBASE_CLIENT_EMAIL=...`
- `FIREBASE_PRIVATE_KEY=...` (atenție la newline-uri: `\n`)

> Alternativ, poți folosi un fișier de service account printr-o cale, dacă proiectul tău e setat astfel.

### Rulare

```bash
cd SERVER
npm install
npm run dev   # sau: npm start
```

### API (high level)

Base: `/api`

#### Auth
- `POST /auth/me` – returnează profilul userului (bootstrap în Firestore)

#### Locations / Courts
- `GET /locations`
- `GET /locations/:id`
- `POST /locations` *(admin)*
- `PUT /locations/:id` *(admin)*
- `DELETE /locations/:id` *(admin)*
- `POST /locations/:id/courts` *(admin)*
- `PUT /locations/:id/courts/:courtId` *(admin)*
- `DELETE /locations/:id/courts/:courtId` *(admin)*

#### Matches
- `GET /matches`
- `GET /matches/:id`
- `POST /matches`
- `PATCH /matches/:id`
- `DELETE /matches/:id`

#### Reservations
- `GET /reservations`
- `GET /reservations/availability`
- `POST /reservations`

#### Stats
- `GET /stats/me`

#### Live
- `GET /live/:matchId`
- `PUT /live`

#### Tournaments *(admin)*
- `GET /tournaments`
- `POST /tournaments`
- `PUT /tournaments/:id`
- `DELETE /tournaments/:id`

---

## Frontend (CLIENT)

### Configurare

Creează un fișier `.env` în `CLIENT/CLIENT`:

- `VITE_API_BASE_URL=http://localhost:8080/api`
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_PROJECT_ID=...`

### Rulare

```bash
cd CLIENT/CLIENT
npm install
npm run dev
```

---

## Status meciuri (auto la citire)

Statusul este recalculat la `GET /matches` și, dacă diferă, este actualizat în Firestore:

- `scheduled` → `ongoing` dacă acum e între `scheduledAt` și `endAt`
- `scheduled|ongoing` → `completed` dacă `now >= endAt`
- `cancelled` / `draft` nu sunt modificate

---

## Note
- Rutele admin sunt protejate prin rol (server-side).
