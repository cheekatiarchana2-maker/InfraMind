from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse
from app.services.maintenance_service import maintenance_service
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse, summary="System Health & Readiness")
async def get_health():
    """Returns the operational status, dataset record count, FAISS index status, and LLM configuration."""
    records_count = len(maintenance_service.get_all_records())
    index_loaded = vector_store.is_loaded
    llm_ok = settings.is_llm_configured

    msg = "All systems operational (LLM connected)" if llm_ok else "Operational in Evidence-Based Historical Fallback Mode"

    return HealthResponse(
        status="healthy",
        service="FacilityAI Backend",
        dataset_records=records_count,
        vector_index_loaded=index_loaded,
        llm_configured=llm_ok,
        connected=True,
        version="1.0.0",
        message=msg
    )
