# Teunpass
Zero-knowledge password manager

---

## Security Mitigations

### Mitigatie: Ontbrekende HTTP-beveiligingsheaders

**Bedreiging-ID (uit threat model):** `V3.4.1`  
**Categorie:** Browser Security Mechanism Headers

#### Beschrijving van de bedreiging
Zonder expliciete HTTP-beveiligingsheaders kan een browser de API-respons op een onveilige manier interpreteren of weergeven. Concrete risico's zijn:

- **Clickjacking** — Een aanvaller kan de applicatie in een onzichtbaar `<iframe>` laden en de gebruiker misleiden om acties uit te voeren zonder dat ze het weten.
- **MIME-sniffing** — Browsers kunnen een respons als uitvoerbare code interpreteren ook al geeft de `Content-Type` header iets anders aan, wat tot XSS kan leiden.
- **Protocol downgrade** — Zonder een HSTS-header kan een MITM-aanval een HTTPS-verbinding terugzetten naar HTTP, waardoor verkeer in plaintext leesbaar wordt.

#### Getroffen maatregel

De mitigatie is aangebracht in:

```
backend/src/middleware/security_headers.py
```

Er is een custom Starlette-middleware klasse (`SecurityHeadersMiddleware`) aangemaakt die automatisch op **elke** HTTP-respons de volgende headers toevoegt:

| Header | Waarde | Bescherming |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Dwingt HTTPS af voor 1 jaar, ook voor subdomeinen (mitigeert protocol downgrade) |
| `X-Content-Type-Options` | `nosniff` | Voorkomt MIME-sniffing door de browser |
| `X-Frame-Options` | `DENY` | Blokkeert embedding in een iframe (mitigeert clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Beperkt het lekken van referer-informatie naar externe partijen |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Schakelt browser-API's die de applicatie niet gebruikt expliciet uit |

De middleware wordt geregistreerd in `backend/src/main.py` via:

```python
from backend.src.middleware.security_headers import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)
```

Doordat de middleware op elke respons werkt, hoeven individuele routes hier geen rekening mee te houden.

---

## Setup & Lokaal draaien

Volg de onderstaande stappen om het project op een nieuw systeem op te zetten.

### 1. Environment Variables instellen

Maak in de hoofdmap van het project een `.env`-bestand aan (je kunt .env.example als uitgangspunt gebruiken):

```bash
copy .env.example .env
```

Pas de waarden in het `.env`-bestand aan:
*   **DATABASE_URL**: De connection string naar de PostgreSQL-database. Bijvoorbeeld: `postgresql://gebruiker:wachtwoord@localhost:5432/teunpass`
*   **SECRET_KEY**: Een willekeurige geheime sleutel voor het ondertekenen van JWT-tokens. Je kunt deze genereren via:
    ```bash
    python -c "import secrets; print(secrets.token_hex(32))"
    ```

*(Optioneel)* Als de frontend met een andere API-URL moet communiceren dan `http://localhost:8000`, maak dan in de map `frontend/` een `.env`-bestand aan op basis van `frontend/.env.example` en vul daar de `VITE_API_URL` in.

### 2. Database en migraties opzetten

Het project gebruikt Alembic voor het beheren van de database-schema's. Voordat je de applicatie start, moet je de database-tabellen aanmaken met:

```bash
# Installeer de backend dependencies
python -m pip install -r requirements.txt

# Voer de migraties uit om de tabellen aan te maken
alembic upgrade head
```

### 3. Backend starten

Start de FastAPI-backend met Uvicorn:

```bash
python -m uvicorn backend.src.main:app --reload
```

De backend draait nu standaard op `http://localhost:8000`. Bij het opstarten wordt er automatisch een testgebruiker aangemaakt (`test@example.com`).

### 4. Frontend starten

Open een nieuwe terminal, ga naar de frontend-map en start de ontwikkelserver:

```bash
cd frontend
npm install
npm run dev
```

De frontend start standaard op `http://localhost:5173`. Open deze URL in je browser om Teunpass te gebruiken.

### 5. Tests draaien

De applicatie bevat tests voor zowel de backend als de frontend.

**Backend tests (Pytest):**
Zorg dat je in de hoofdmap zit en voer uit:
```bash
pytest tests/
```

**Frontend unit & component tests (Vitest):**
Ga naar de frontend map en start de test runner:
```bash
cd frontend
npm run test
```

**Frontend end-to-end tests (Playwright):**
Voor het uitvoeren van de browser tests:
```bash
cd frontend
npx playwright test
```

