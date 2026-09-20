# FacilityAI (InfraMind) Deployment Guide

This guide details how to deploy both the **Backend** (FastAPI, FAISS, LangGraph) and the **Frontend** (React, Vite, Tailwind CSS).

---

## 🚀 Option 1: Free Cloud Deployment (Recommended for Hackathons)

### Part A: Deploy Backend on Render.com

1. Sign up/Log in at [render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `https://github.com/cheekatiarchana2-maker/InfraMind`.
4. Configure the service:
   - **Name**: `facilityai-backend`
   - **Language / Runtime**: `Python 3`
   - **Root Directory**: *(leave blank or enter `.`)
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Free or Starter
5. Under **Environment Variables**, add:
   - `LLM_PROVIDER`: `fallback` (or `openai` / `gemini` if you have API keys)
   - `OPENAI_API_KEY`: *(Optional)*
   - `FRONTEND_URL`: `*` (or your Vercel URL once created)
6. Click **Deploy Web Service**.
7. Copy your backend URL: e.g. `https://facilityai-backend.onrender.com`.

---

### Part B: Deploy Frontend on Vercel.com

1. Sign up/Log in at [vercel.com](https://vercel.com).
2. Click **Add New…** $\rightarrow$ **Project**.
3. Import your GitHub repository (`InfraMind`).
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: Paste your Render backend URL (e.g. `https://facilityai-backend.onrender.com`)
6. Click **Deploy**.
7. Your app is live! (e.g. `https://inframind.vercel.app`).

---

## 🐳 Option 2: Docker Compose (Any Cloud VPS / AWS / DigitalOcean / Local)

If you have a Linux/Windows server with Docker and Docker Compose installed:

### Step 1: Clone the repository
```bash
git clone https://github.com/cheekatiarchana2-maker/InfraMind.git
cd InfraMind
```

### Step 2: Run with 1 command
```bash
docker compose up -d --build
```

- **Frontend**: Accessible at `http://<YOUR_SERVER_IP>:5173`
- **Backend API**: Accessible at `http://<YOUR_SERVER_IP>:8000`
- **Swagger Docs**: Accessible at `http://<YOUR_SERVER_IP>:8000/docs`

To stop:
```bash
docker compose down
```

---

## ⚡ Option 3: Railway.app (One-Click Docker Deployment)

1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose `InfraMind`.
3. Railway will automatically detect the `docker-compose.yml` or Dockerfiles.
4. Set the port to `8000` for backend, and expose the domain.

---

## 🔑 Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `LLM_PROVIDER` | LLM reasoning engine (`fallback`, `openai`, `gemini`) | `fallback` |
| `OPENAI_API_KEY` | OpenAI API Key (optional) | *empty* |
| `GEMINI_API_KEY` | Google Gemini API Key (optional) | *empty* |
| `EMBEDDING_MODEL`| HuggingFace embedding model | `sentence-transformers/all-MiniLM-L6-v2` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `VITE_API_BASE_URL` | Frontend URL pointing to backend API | `http://localhost:8000` |
