from typing import Optional, List, Literal
from pydantic import BaseModel, Field

UrgencyLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL", "Low", "Medium", "High", "Critical"]

class MaintenanceRecord(BaseModel):
    record_id: str = Field(..., description="Unique record identifier, e.g. MR-0001 or FB-001")
    equipment_type: str = Field(..., description="Equipment category")
    location: str = Field(..., description="Facility location or block")
    complaint: str = Field(..., description="Reported problem description")
    symptom: str = Field(..., description="Observable symptoms")
    likely_cause: str = Field(..., description="Root cause identified")
    recommended_fix: str = Field(..., description="Prescribed repair or maintenance action")
    estimated_cost_inr: float = Field(..., description="Estimated repair cost in INR")
    estimated_time_hours: float = Field(..., description="Estimated repair time in hours")
    urgency: str = Field(..., description="Urgency level (Low, Medium, High, Critical)")
    status: str = Field(default="Resolved", description="Current status of the case")
    technician_feedback: Optional[str] = Field(default=None, description="Technician verification feedback")

    # Helper properties for frontend compatibility
    @property
    def cost(self) -> float:
        return self.estimated_cost_inr

    @property
    def repair_time(self) -> str:
        h = self.estimated_time_hours
        if h < 1:
            return f"{int(h * 60)} min"
        elif h == int(h):
            return f"{int(h)} hours" if h > 1 else "1 hour"
        return f"{h} hours"

class SimilarCaseItem(BaseModel):
    record_id: str
    similarity_score: float
    record: MaintenanceRecord

class AlternativeDiagnosis(BaseModel):
    cause: str
    confidence: int

class DiagnosisOutput(BaseModel):
    primary_diagnosis: str
    confidence: int = Field(..., ge=0, le=100)
    alternative_diagnoses: List[AlternativeDiagnosis] = []
    reasoning_summary: str
    supporting_case_ids: List[str] = []

class RecommendationOutput(BaseModel):
    recommended_action: str
    steps: List[str] = []
    urgency: str
    estimated_cost_inr: float
    estimated_time_hours: float
    safety_note: str = ""

class ExplanationOutput(BaseModel):
    summary: str
    why_this_diagnosis: str
    evidence_points: List[str] = []
    similar_case_summary: str
    supporting_case_ids: List[str] = []

class AgentTraceStep(BaseModel):
    agent_name: str
    status: Literal["pending", "running", "completed", "failed"] = "completed"
    short_description: str
    execution_time_ms: int
    detail: Optional[str] = None

    # Frontend compatibility fields
    agent: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    duration_ms: Optional[int] = None
