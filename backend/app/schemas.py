from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.models import (
    MaintenanceRecord,
    SimilarCaseItem,
    DiagnosisOutput,
    RecommendationOutput,
    ExplanationOutput,
    AgentTraceStep,
)

class AnalyzeRequest(BaseModel):
    equipment_type: str = Field(..., min_length=1, description="Equipment category, e.g. Air Conditioner")
    location: str = Field(..., min_length=1, description="Facility location, e.g. Block A")
    complaint: str = Field(..., min_length=5, description="Issue description")

class FrontendSimilarCase(BaseModel):
    record_id: str
    equipment_type: str
    location: str
    complaint: str
    symptom: str
    likely_cause: str
    recommended_fix: str
    similarity: float
    cost: float
    repair_time: str
    urgency: str
    status: Optional[str] = "Resolved"

class FrontendExplanation(BaseModel):
    why_this_diagnosis: str
    evidence_points: List[str] = []

class FrontendAlternativeDiagnosis(BaseModel):
    cause: str
    confidence: int

class AnalyzeResponse(BaseModel):
    request_id: str
    input: Dict[str, str]
    retrieved_cases: List[SimilarCaseItem]
    diagnosis: DiagnosisOutput
    recommendation: RecommendationOutput
    explanation: ExplanationOutput
    agent_trace: List[AgentTraceStep]
    errors: List[str] = []

    # Frontend backward-compatibility fields
    likely_cause: str = ""
    confidence: int = 0
    urgency: str = "Medium"
    recommended_action: str = ""
    step_by_step_actions: List[str] = []
    estimated_cost: float = 0.0
    estimated_time: str = ""
    safety_note: str = ""
    similar_cases: List[FrontendSimilarCase] = []
    alternative_diagnoses: List[FrontendAlternativeDiagnosis] = []

class HealthResponse(BaseModel):
    status: str
    service: str
    dataset_records: int
    vector_index_loaded: bool
    llm_configured: bool
    connected: bool = True
    version: str = "1.0.0"
    message: Optional[str] = None

class HistoryResponse(BaseModel):
    items: List[MaintenanceRecord]
    total: int
    page: int = 1
    page_size: int = 20

class FeedbackRequest(BaseModel):
    request_id: str
    diagnosis: Optional[str] = None
    feedback: Literal["correct", "incorrect"]
    resolution: Optional[str] = None
    # Support alternate frontend parameter names
    record_id: Optional[str] = None
    actual_resolution: Optional[str] = None

class FeedbackResponse(BaseModel):
    success: bool
    feedback: str
    knowledge_base_updated: bool
    new_record_id: Optional[str] = None
    message: Optional[str] = None

class FeedbackEntry(BaseModel):
    id: str
    request_id: str
    record_id: str
    feedback: str
    actual_resolution: str
    timestamp: str
    equipment_type: Optional[str] = None

class FeedbackHistoryResponse(BaseModel):
    total: int
    correct: int
    incorrect: int
    confirmed_added: int
    items: List[FeedbackEntry]

class FeedbackStatsResponse(BaseModel):
    total_feedback: int
    correct: int
    incorrect: int
    confirmed_cases: int

class KnowledgeDistributionItem(BaseModel):
    equipment: str
    count: int

class KnowledgeStatsResponse(BaseModel):
    total_records: int
    equipment_categories: int
    recent_additions: int
    confirmed_cases: int
    equipment_distribution: List[KnowledgeDistributionItem]

class DashboardStatsResponse(BaseModel):
    total_cases: int
    ai_diagnoses: int
    confirmed_diagnoses: int
    knowledge_base: int

class RecentDiagnosisItem(BaseModel):
    request_id: str
    equipment: str
    location: str
    diagnosis: str
    confidence: int
    urgency: str
    status: str
