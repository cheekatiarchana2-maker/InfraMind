from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    FeedbackEntry,
    FeedbackHistoryResponse,
    FeedbackStatsResponse,
)
from app.services.feedback_service import feedback_service
from app.utils.logging import logger

router = APIRouter(prefix="/api", tags=["Technician Feedback"])

@router.post("/feedback", response_model=FeedbackResponse, summary="Submit Technician Feedback")
async def submit_feedback(req: FeedbackRequest):
    """
    Submits technician feedback on a diagnosis.
    - If 'correct': A new confirmed record is created, embedded, and added to the FAISS knowledge base immediately.
    - If 'incorrect': Feedback is preserved for quality auditing without altering confirmed knowledge.
    """
    try:
        response = feedback_service.submit_feedback(req)
        return response
    except Exception as e:
        logger.error(f"Failed to record feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Feedback processing error: {str(e)}")

@router.get("/feedback/history", summary="Feedback History")
async def get_feedback_history():
    """Returns the log of technician feedback submissions."""
    # Return list of items for frontend compatibility
    return feedback_service.get_history().items

@router.get("/feedback/stats", response_model=FeedbackStatsResponse, summary="Feedback Statistics")
async def get_feedback_stats():
    """Returns aggregated accuracy statistics from technician verification."""
    return feedback_service.get_stats()
