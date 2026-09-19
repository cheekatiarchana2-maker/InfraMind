from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HistoryResponse,
    DashboardStatsResponse,
    KnowledgeStatsResponse,
    RecentDiagnosisItem,
)
from app.models import MaintenanceRecord
from app.services.maintenance_service import maintenance_service
from app.agents.orchestrator import run_facility_orchestrator
from app.utils.logging import logger

router = APIRouter(prefix="/api", tags=["Maintenance"])

@router.post("/analyze", response_model=AnalyzeResponse, summary="Analyze Equipment Complaint")
async def analyze_complaint(req: AnalyzeRequest):
    """Executes the multi-agent decision support workflow (Retrieval -> Diagnosis -> Recommendation -> Explanation)."""
    try:
        response = run_facility_orchestrator(req)
        return response
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.get("/equipment", response_model=List[str], summary="Get Equipment Categories")
async def get_equipment():
    """Returns the distinct equipment types present in the maintenance knowledge base."""
    return maintenance_service.get_equipment_types()

@router.get("/history", summary="Get Maintenance Records History")
async def get_history(
    equipment_type: Optional[str] = Query(None, description="Filter by equipment category"),
    location: Optional[str] = Query(None, description="Filter by location"),
    urgency: Optional[str] = Query(None, description="Filter by urgency"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
):
    """Returns paginated and filterable historical maintenance records."""
    items, total = maintenance_service.get_history(
        equipment_type=equipment_type,
        location=location,
        urgency=urgency,
        status=status,
        page=page,
        page_size=page_size
    )
    # Return both flat list or structured object compatible with frontend
    return items

@router.get("/dashboard/stats", response_model=DashboardStatsResponse, summary="Dashboard KPI Metrics")
async def get_dashboard_stats():
    """Returns high-level statistics for dashboard KPI cards."""
    return maintenance_service.get_dashboard_stats()

@router.get("/knowledge/stats", response_model=KnowledgeStatsResponse, summary="Knowledge Base Metrics")
async def get_knowledge_stats():
    """Returns category distribution and case statistics for the knowledge base."""
    return maintenance_service.get_knowledge_stats()

@router.get("/diagnoses/recent", response_model=List[RecentDiagnosisItem], summary="Recent AI Diagnoses")
async def get_recent_diagnoses():
    """Returns the most recent AI diagnosis records."""
    return maintenance_service.get_recent_diagnoses()
