# InfraMind (FacilityAI)

> **Track B3:** Multi-Agent Orchestration & Decision Support  
> An AI-powered Facility Infrastructure Intelligence & Decision-Support System.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-vvmshdcg)

---

## 📁 Repository Structure

```text
InfraMind/
├── backend/          # Python 3.11+ FastAPI + LangGraph Multi-Agent Backend
│   ├── app/          # Agents (Retrieval, Diagnosis, Recommendation, Explanation)
│   ├── data/         # 240-record synthetic maintenance dataset (CSV & JSON)
│   ├── vector_db/    # FAISS dense vector store
│   ├── tests/        # 18 automated test suites (pytest)
│   ├── requirements.txt
│   ├── run.py
│   └── README.md
│
├── frontend/         # React 18 + TypeScript + Vite + Tailwind CSS Dashboard
│   ├── src/          # Components, Pages, and Multi-Agent Visualizers
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```
- API Server: **http://localhost:8000**
- Interactive Swagger Documentation: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
- Web Application: **http://localhost:5173**

---

## 🤖 Multi-Agent Workflow

$$\text{START} \longrightarrow \text{Retrieval Agent} \longrightarrow \text{Diagnosis Agent} \longrightarrow \text{Recommendation Agent} \longrightarrow \text{Explanation Agent} \longrightarrow \text{END}$$

1. **Retrieval Agent**: Semantic similarity search against FAISS dense vector store.
2. **Diagnosis Agent**: Evidence-based root-cause diagnosis and confidence scoring.
3. **Recommendation Agent**: Actionable repair tasks, estimated cost (INR), downtime, and urgency.
4. **Explanation Agent**: Plain-language rationale referencing real historical record IDs.
5. **Technician Feedback Loop**: Confirmed repairs dynamically update the active FAISS index in real time.
