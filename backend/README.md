# FacilityAI — Multi-Agent Facility Maintenance Decision-Support Backend

**Track B3:** Multi-Agent Orchestration & Decision Support  
**Product Name:** FacilityAI / InfraMind  
**Stack:** Python 3.11+, FastAPI, LangGraph, FAISS, Sentence Transformers, Pydantic, Pandas, Uvicorn

---

## 1. Project Overview

Facility managers often rely on memory or informal notes when equipment breaks down rather than systematically leveraging historical maintenance records.

**FacilityAI** provides an evidence-based multi-agent decision support system. When given an equipment complaint and location, it:
1. Performs semantic similarity retrieval over historical maintenance records via **FAISS** and **Sentence Transformers**.
2. Deploys a **Diagnosis Agent** to infer likely causes grounded strictly in retrieved historical cases.
3. Deploys a **Recommendation Agent** to prescribe actionable fixes, step-by-step repair tasks, estimated cost (INR), repair downtime (hours), and urgency.
4. Deploys an **Explanation Agent** to produce plain-language reasoning citing real historical record IDs.
5. Emits an execution **Agent Trace** displaying the pipeline stages and latency.
6. Completes the learning loop with **Technician Feedback**:
   - **Correct**: Adds the verified resolution as a new confirmed case into the knowledge base and dynamically indexes it in FAISS without restarting the server.
   - **Incorrect**: Preserves the audit trail without contaminating the confirmed knowledge base.

---

## 2. Architecture

```text
               [ React / TypeScript Frontend (Port 5173) ]
                                   │
                              (HTTP / JSON)
                                   ▼
                       [ FastAPI (Port 8000) ]
                                   │
                        LangGraph Orchestrator
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
[Retrieval Agent]          [Diagnosis Agent]         [Recommendation Agent]
      │                            │                            │
 FAISS Vector Store         LLM / Evidence Reasoner      Historical Case Stats
 (all-MiniLM-L6-v2)                │                            │
      │                            ▼                            │
      └──────────────────► [Explanation Agent] ◄────────────────┘
                         Plain-Language Rationale
                         (Citing Real Record IDs)
                                   │
                                   ▼
                      [ Final Decision & Trace ]
                                   │
                                   ▼
                       [ Technician Feedback ]
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
                 [Correct]                  [Incorrect]
                     │                           │
          New Confirmed Case (MR-CONF-xxx)    Logged Only
                     │
            Dynamic FAISS Index
         Update (Searchable Live)
```

---

## 3. Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application & lifespan management
│   ├── config.py                   # Pydantic Settings & environment config
│   ├── models.py                   # Core Pydantic data models
│   ├── schemas.py                  # API request/response validation schemas
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py         # LangGraph StateGraph pipeline & traces
│   │   ├── retrieval_agent.py      # Semantic retrieval via FAISS
│   │   ├── diagnosis_agent.py      # Evidence-grounded root cause diagnosis
│   │   ├── recommendation_agent.py # Evidence-based fix, cost, time, urgency
│   │   └── explanation_agent.py    # Plain-language evidence rationale
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── vector_store.py         # FAISS IndexFlatIP cosine vector store
│   │   ├── embedding_service.py    # SentenceTransformers all-MiniLM-L6-v2
│   │   ├── llm_service.py          # Multi-provider (OpenAI, Gemini, Fallback)
│   │   ├── feedback_service.py     # Technician verification & dynamic update
│   │   └── maintenance_service.py  # Dataset loader, filtering & statistics
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py               # GET /api/health
│   │   ├── maintenance.py          # POST /api/analyze, GET /api/equipment, history
│   │   └── feedback.py             # POST /api/feedback, history, stats
│   │
│   └── utils/
│       ├── __init__.py
│       ├── prompts.py              # System & user prompts (no CoT exposure)
│       └── logging.py              # Structured logging
│
├── data/
│   ├── maintenance_records.csv     # 240 synthetic historical records
│   └── maintenance_records.json    # JSON representation of records
│
├── vector_db/
│   ├── maintenance.index           # Persisted FAISS binary index
│   └── metadata.json               # Record metadata mapping
│
├── tests/
│   ├── conftest.py                 # Pytest environment & truststore setup
│   ├── test_data.py                # Dataset validation (240 records, 12 categories)
│   ├── test_retrieval.py           # Embeddings & FAISS semantic search
│   ├── test_agents.py              # Discrete agent & LangGraph tests
│   └── test_api.py                 # End-to-end API & feedback loop tests
│
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── README.md                       # Comprehensive documentation
└── run.py                          # Application startup entrypoint
```

---

## 4. Dataset Specification

The backend is initialized with **240 synthetic maintenance records** spanning **12 distinct equipment categories** (20 records per category):
- **Categories:** Air Conditioner, Elevator, Generator, Water Pump, Projector, Electrical Panel, CCTV Camera, Wi-Fi Access Point, Refrigerator, Water Cooler, Fire Alarm, Access Control System.
- **Locations:** Block A, Block B, Block C, Block D, Laboratory, Hostel A, Hostel B, Auditorium, Library, Administrative Block.
- **Fields:**
  - `record_id`: Unique identifier (`MR-0001` to `MR-0240`)
  - `equipment_type`: Equipment category
  - `location`: Facility area
  - `complaint`: Reported user problem
  - `symptom`: Observable fault indicator
  - `likely_cause`: Diagnosed root cause
  - `recommended_fix`: Corrective action taken
  - `estimated_cost_inr`: Repair cost in Indian Rupees (INR)
  - `estimated_time_hours`: Repair downtime in hours
  - `urgency`: Low, Medium, High, Critical
  - `status`: Resolved
  - `technician_feedback`: Confirmed

---

## 5. Setup & Installation

### Step 1: Create and activate virtual environment

**On Windows (PowerShell):**
```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

### Step 2: Install dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
APP_NAME=FacilityAI
ENVIRONMENT=development
DEBUG=True

# LLM Provider Options: 'fallback' (works out-of-the-box without keys), 'openai', or 'gemini'
LLM_PROVIDER=fallback
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=
GEMINI_API_KEY=

EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

DATA_PATH=data/maintenance_records.csv
VECTOR_DB_PATH=vector_db

FRONTEND_URL=http://localhost:5173

TOP_K_CASES=5
```

> **Note on LLM Fallback:** If no API keys are provided (`LLM_PROVIDER=fallback`), FacilityAI uses its built-in historical evidence engine to compute root cause probability, consensus ratios, and cost medians directly from retrieved cases. Zero failures occur if offline or unauthenticated.

---

## 6. Running the Backend

Start the FastAPI application:
```powershell
python backend/run.py
```
Or with Uvicorn directly:
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Redoc Alternative Docs: `http://localhost:8000/redoc`

---

## 7. Running the Automated Tests

Run the full automated test suite with pytest:
```powershell
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

All 18 tests pass covering:
1. `test_data.py`: Validates 240 records, required fields, and 12 equipment categories.
2. `test_retrieval.py`: Tests 384-dim normalized embeddings and FAISS search.
3. `test_agents.py`: Tests each agent independently and verifies the 5-stage LangGraph trace.
4. `test_api.py`: Tests health, equipment, history, analyze, and the dynamic feedback loop.

---

## 8. API Reference

### 8.1 Health Check
`GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "FacilityAI Backend",
  "dataset_records": 240,
  "vector_index_loaded": true,
  "llm_configured": false,
  "connected": true,
  "version": "1.0.0",
  "message": "Operational in Evidence-Based Historical Fallback Mode"
}
```

---

### 8.2 Analyze Equipment Complaint
`POST /api/analyze`

**Request:**
```json
{
  "equipment_type": "Air Conditioner",
  "location": "Block A",
  "complaint": "AC is running but the room is not getting cold and airflow is weak."
}
```

**Response:**
```json
{
  "request_id": "REQ-B892F13C",
  "input": {
    "equipment_type": "Air Conditioner",
    "location": "Block A",
    "complaint": "AC is running but the room is not getting cold and airflow is weak."
  },
  "retrieved_cases": [
    {
      "record_id": "MR-0006",
      "similarity_score": 0.7812,
      "record": {
        "record_id": "MR-0006",
        "equipment_type": "Air Conditioner",
        "location": "Block D",
        "complaint": "Air Conditioner at Block D is reporting weak airflow",
        "symptom": "Weak airflow",
        "likely_cause": "Clogged evaporator coil",
        "recommended_fix": "Clean evaporator coil and restore airflow",
        "estimated_cost_inr": 1500.0,
        "estimated_time_hours": 2.0,
        "urgency": "Medium",
        "status": "Resolved",
        "technician_feedback": "Confirmed"
      }
    }
  ],
  "diagnosis": {
    "primary_diagnosis": "Clogged evaporator coil",
    "confidence": 88,
    "alternative_diagnoses": [
      { "cause": "Dirty air filter", "confidence": 54 }
    ],
    "reasoning_summary": "Identified 'Clogged evaporator coil' based on matching historical records displaying weak airflow symptoms.",
    "supporting_case_ids": ["MR-0006", "MR-0013", "MR-0020"]
  },
  "recommendation": {
    "recommended_action": "Clean evaporator coil and restore airflow",
    "steps": [
      "1. Secure and isolate Air Conditioner at Block A.",
      "2. Clean evaporator coil and restore airflow.",
      "3. Verify operational parameters and test under standard load.",
      "4. Document repair completion and update facility maintenance log."
    ],
    "urgency": "Medium",
    "estimated_cost_inr": 1500.0,
    "estimated_time_hours": 2.0,
    "safety_note": "Verify power isolation and wear appropriate PPE before performing maintenance."
  },
  "explanation": {
    "summary": "Diagnosed Clogged evaporator coil for Air Conditioner.",
    "why_this_diagnosis": "Analysis of historical maintenance records indicates that this complaint on Air Conditioner in Block A is characteristic of 'Clogged evaporator coil'. Historical precedents (MR-0006, MR-0013, MR-0020) exhibited nearly identical failure indicators.",
    "evidence_points": [
      "Complaint aligns with historical cases displaying weak airflow for Air Conditioner.",
      "Historical cases MR-0006, MR-0013 were resolved by cleaning the evaporator coil."
    ],
    "similar_case_summary": "5 historical cases evaluated with up to 78% similarity.",
    "supporting_case_ids": ["MR-0006", "MR-0013", "MR-0020"]
  },
  "agent_trace": [
    { "agent_name": "Orchestrator", "status": "completed", "short_description": "Initialized multi-agent maintenance diagnosis workflow", "execution_time_ms": 12 },
    { "agent_name": "Retrieval Agent", "status": "completed", "short_description": "Retrieved 5 similar historical maintenance cases", "execution_time_ms": 42 },
    { "agent_name": "Diagnosis Agent", "status": "completed", "short_description": "Diagnosed: Clogged evaporator coil (Confidence: 88%)", "execution_time_ms": 15 },
    { "agent_name": "Recommendation Agent", "status": "completed", "short_description": "Prescribed: Clean evaporator coil and restore airflow", "execution_time_ms": 8 },
    { "agent_name": "Explanation Agent", "status": "completed", "short_description": "Generated plain-language explanation citing 3 cases", "execution_time_ms": 10 }
  ],
  "errors": []
}
```

---

### 8.3 Technician Feedback & Knowledge Base Update
`POST /api/feedback`

**Request (Confirming Correct Diagnosis):**
```json
{
  "request_id": "REQ-B892F13C",
  "diagnosis": "Clogged evaporator coil",
  "feedback": "correct",
  "resolution": "Technician cleaned the evaporator coil and airflow returned to full capacity."
}
```

**Response:**
```json
{
  "success": true,
  "feedback": "correct",
  "knowledge_base_updated": true,
  "new_record_id": "MR-CONF-001",
  "message": "Feedback recorded. Knowledge base updated."
}
```

*Note: Immediately after this call, `MR-CONF-001` is encoded into a vector and added to the live FAISS index. Subsequent queries can retrieve this confirmed case.*

---

## 9. Live Hackathon Demo Walkthrough

| Step | Action | Expected System Behavior |
|---|---|---|
| **1** | Enter Complaint: *"AC is running but room not cooling and airflow is weak"* | Request dispatched to `POST /api/analyze` |
| **2** | Retrieval Agent executes | FAISS searches 240 cases, retrieves top 5 similar AC records with similarity scores |
| **3** | Diagnosis Agent executes | Identifies *"Clogged evaporator coil"* (88% confidence) citing records `MR-0006`, `MR-0013` |
| **4** | Recommendation Agent executes | Prescribes cleaning fix, ₹1500 estimated cost, 2.0 hours downtime, and safety precautions |
| **5** | Explanation Agent executes | Generates manager-facing explanation referencing supporting record IDs |
| **6** | View Agent Trace | Displays pipeline execution times for all 5 agents |
| **7** | Submit Feedback | Technician clicks **Correct** and enters: *"Cleaned coil, restored airflow"* |
| **8** | Dynamic KB Update | Backend generates `MR-CONF-001`, updates FAISS index without server restart |
| **9** | Re-run Complaint | Subsequent similar complaint now retrieves `MR-CONF-001` in the top results |
