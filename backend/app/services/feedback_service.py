from datetime import datetime, timezone
from typing import List, Dict, Optional
from app.models import MaintenanceRecord
from app.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    FeedbackEntry,
    FeedbackHistoryResponse,
    FeedbackStatsResponse,
)
from app.services.maintenance_service import maintenance_service
from app.services.vector_store import vector_store
from app.utils.logging import logger

class FeedbackService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FeedbackService, cls).__new__(cls)
            cls._instance.feedback_history: List[FeedbackEntry] = []
            cls._instance.request_cache: Dict[str, Dict] = {}
            cls._instance.fb_counter: int = 0
            cls._instance._init_default_history()
        return cls._instance

    def _init_default_history(self):
        sample_entries = [
            FeedbackEntry(
                id="FB-0001",
                request_id="REQ-1001",
                record_id="MR-0002",
                feedback="correct",
                actual_resolution="Cleaned air filter and restored full airflow cooling.",
                timestamp="2026-09-18T10:30:00Z",
                equipment_type="Air Conditioner",
            ),
            FeedbackEntry(
                id="FB-0002",
                request_id="REQ-1002",
                record_id="MR-0021",
                feedback="correct",
                actual_resolution="Realigned elevator optical door sensors.",
                timestamp="2026-09-18T14:15:00Z",
                equipment_type="Elevator",
            ),
            FeedbackEntry(
                id="FB-0003",
                request_id="REQ-1003",
                record_id="MR-0043",
                feedback="incorrect",
                actual_resolution="Actual issue was a severed coolant sensor wire, not coolant level.",
                timestamp="2026-09-19T09:00:00Z",
                equipment_type="Generator",
            ),
        ]
        self.feedback_history.extend(sample_entries)
        self.fb_counter = len(sample_entries)

    def cache_request_data(self, request_id: str, data: Dict):
        """Caches analysis payload and result so feedback can construct a complete confirmed case."""
        self.request_cache[request_id] = data

    def submit_feedback(self, req: FeedbackRequest) -> FeedbackResponse:
        """Processes technician feedback. If correct, adds new case to knowledge base and FAISS."""
        self.fb_counter += 1
        fb_id = f"FB-{str(self.fb_counter).padStart(4, '0') if hasattr(str, 'padStart') else str(self.fb_counter).zfill(4)}"

        # Resolve resolution text from possible fields
        resolution_text = req.resolution or req.actual_resolution or "Confirmed by technician."
        cached = self.request_cache.get(req.request_id, {})

        eq_type = cached.get("equipment_type", "General Equipment")
        location = cached.get("location", "Facility")
        complaint = cached.get("complaint", "Reported equipment issue")
        diag_cause = req.diagnosis or cached.get("primary_diagnosis", "Diagnosed Issue")
        rec_action = cached.get("recommended_action", resolution_text)
        cost = cached.get("estimated_cost_inr", 1500.0)
        time_hours = cached.get("estimated_time_hours", 2.0)
        urgency = cached.get("urgency", "High")

        is_correct = req.feedback.lower() == "correct"
        new_record_id: Optional[str] = None

        if is_correct:
            new_record_id = f"MR-CONF-{str(self.fb_counter).zfill(3)}"
            new_record = MaintenanceRecord(
                record_id=new_record_id,
                equipment_type=eq_type,
                location=location,
                complaint=complaint,
                symptom=f"{complaint} (Technician confirmed)",
                likely_cause=diag_cause,
                recommended_fix=resolution_text or rec_action,
                estimated_cost_inr=float(cost),
                estimated_time_hours=float(time_hours),
                urgency=urgency,
                status="Resolved",
                technician_feedback="Confirmed",
            )

            # Update in-memory and CSV dataset
            maintenance_service.add_record(new_record)
            # Update FAISS vector store
            vector_store.add_record(new_record)

            logger.info(f"Feedback CONFIRMED: Knowledge base updated with new record {new_record_id}.")

        entry = FeedbackEntry(
            id=fb_id,
            request_id=req.request_id,
            record_id=new_record_id or req.record_id or req.request_id,
            feedback=req.feedback.lower(),
            actual_resolution=resolution_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
            equipment_type=eq_type,
        )
        self.feedback_history.insert(0, entry)

        return FeedbackResponse(
            success=True,
            feedback=req.feedback.lower(),
            knowledge_base_updated=is_correct,
            new_record_id=new_record_id,
            message="Feedback recorded. Knowledge base updated." if is_correct else "Feedback recorded. Case preserved without knowledge base update."
        )

    def get_history(self) -> FeedbackHistoryResponse:
        total = len(self.feedback_history)
        correct_count = sum(1 for f in self.feedback_history if f.feedback == "correct")
        incorrect_count = sum(1 for f in self.feedback_history if f.feedback == "incorrect")

        return FeedbackHistoryResponse(
            total=total,
            correct=correct_count,
            incorrect=incorrect_count,
            confirmed_added=correct_count,
            items=self.feedback_history,
        )

    def get_stats(self) -> FeedbackStatsResponse:
        total = len(self.feedback_history)
        correct_count = sum(1 for f in self.feedback_history if f.feedback == "correct")
        incorrect_count = sum(1 for f in self.feedback_history if f.feedback == "incorrect")
        return FeedbackStatsResponse(
            total_feedback=total,
            correct=correct_count,
            incorrect=incorrect_count,
            confirmed_cases=correct_count,
        )

feedback_service = FeedbackService()
