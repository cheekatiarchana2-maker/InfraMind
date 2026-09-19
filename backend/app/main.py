try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.health import router as health_router
from app.api.maintenance import router as maintenance_router
from app.api.feedback import router as feedback_router
from app.services.maintenance_service import maintenance_service
from app.services.vector_store import vector_store
from app.utils.logging import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup data loading and vector index initialization."""
    logger.info("Initializing FacilityAI Backend Services...")

    # 1. Load maintenance dataset
    try:
        records = maintenance_service.load_maintenance_records()
        logger.info(f"Loaded {len(records)} maintenance records into memory.")
    except Exception as e:
        logger.error(f"Failed to load maintenance records: {e}")
        raise e

    # 2. Initialize or load FAISS Vector Store
    try:
        loaded = vector_store.load_index()
        if not loaded or vector_store.count == 0:
            logger.info("Building fresh FAISS vector index from maintenance records...")
            vector_store.build_index(records)
        else:
            logger.info(f"Loaded existing FAISS vector index with {vector_store.count} records.")
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}")
        raise e

    logger.info("FacilityAI Backend is ready to accept requests.")
    yield
    logger.info("Shutting down FacilityAI Backend.")

app = FastAPI(
    title="FacilityAI - Facility Infrastructure Decision-Support Agent",
    description=(
        "Production-quality backend for Track B3: Multi-Agent Orchestration & Decision Support. "
        "Provides semantic retrieval, root-cause diagnosis, repair recommendation, and plain-language explanation "
        "powered by LangGraph, Sentence Transformers, and FAISS."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(maintenance_router)
app.include_router(feedback_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the request."}
    )

@app.get("/")
async def root():
    return {
        "service": "FacilityAI Multi-Agent Backend",
        "status": "online",
        "documentation": "/docs"
    }
