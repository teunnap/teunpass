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

## Lokaal draaien

**Backend:**
```bash
python -m pip install -r requirements.txt
python -m uvicorn backend.src.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Tests:**
```bash
pytest tests/
```
