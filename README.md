# teunpass

Zero-knowledge password manager built with **FastAPI** (backend) and **React + Tailwind CSS** (frontend).

## Project structure

```
teunpass/
├── backend/          # FastAPI application
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routers/
│   │   ├── auth.py   # register / login endpoints
│   │   └── vault.py  # CRUD vault endpoints
│   ├── schemas/
│   │   ├── auth.py
│   │   └── vault.py
│   └── models/
├── frontend/         # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── lib/api.js          # API client
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Vault.jsx
│   │   └── components/
│   │       └── ItemForm.jsx
│   ├── Dockerfile
│   └── vite.config.js
└── docker-compose.yml
```

## Quick start (Docker)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or use uv
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/auth`, `/vault`, and `/health` requests to the backend at `http://localhost:8000`.

## Architecture notes

- Passwords are stored as **encrypted blobs** — the server only ever sees ciphertext.
- The master password is never sent to the server; only a derived authentication hash is used.
- JWT tokens are used for session management.
