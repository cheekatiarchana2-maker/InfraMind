import time
import uuid
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    FrontendSimilarCase,
    FrontendAlternativeDiagnosis,
)
from app.models import (
    SimilarCaseItem,
    DiagnosisOutput,
    RecommendationOutput,
    ExplanationOutput,
    AgentTraceStep,
)
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.recommendation_agent import run_recommendation_agent
from app.agents.explanation_agent import run_explanation_agent
from app.services.feedback_service import feedback_service
from app.services.maintenance_service import maintenance_service
from app.schemas import RecentDiagnosisItem
from app.utils.logging import logger

class MaintenanceState(TypedDict, total=False):
    request_id: str
    equipment_type: str
    location: str
    complaint: str
    retrieved_cases: List[SimilarCaseItem]
    diagnosis: Optional[DiagnosisOutput]
    recommendation: Optional[RecommendationOutput]
    explanation: Optional[ExplanationOutput]
    agent_trace: List[AgentTraceStep]
    errors: List[str]

# Node 1: Retrieval Node
def retrieval_node(state: MaintenanceState) -> Dict[str, Any]:
    try:
        cases, trace = run_retrieval_agent(
            equipment_type=state["equipment_type"],
            location=state["location"],
            complaint=state["complaint"]
        )
        return {
            "retrieved_cases": cases,
            "agent_trace": state.get("agent_trace", []) + [trace]
        }
    except Exception as e:
        logger.error(f"Retrieval node failure: {e}")
        err_trace = AgentTraceStep(
            agent_name="Retrieval Agent",
            status="failed",
            short_description="Semantic retrieval encountered an error",
            execution_time_ms=5,
            detail=str(e)
        )
        return {
            "retrieved_cases": [],
            "agent_trace": state.get("agent_trace", []) + [err_trace],
            "errors": state.get("errors", []) + [f"Retrieval error: {str(e)}"]
        }

# Node 2: Diagnosis Node
def diagnosis_node(state: MaintenanceState) -> Dict[str, Any]:
    try:
        diagnosis, trace = run_diagnosis_agent(
            equipment_type=state["equipment_type"],
            location=state["location"],
            complaint=state["complaint"],
            cases=state.get("retrieved_cases", [])
        )
        return {
            "diagnosis": diagnosis,
            "agent_trace": state.get("agent_trace", []) + [trace]
        }
    except Exception as e:
        logger.error(f"Diagnosis node failure: {e}")
        err_trace = AgentTraceStep(
            agent_name="Diagnosis Agent",
            status="failed",
            short_description="Diagnosis reasoning encountered an error",
            execution_time_ms=5,
            detail=str(e)
        )
        return {
            "agent_trace": state.get("agent_trace", []) + [err_trace],
            "errors": state.get("errors", []) + [f"Diagnosis error: {str(e)}"]
        }

# Node 3: Recommendation Node
def recommendation_node(state: MaintenanceState) -> Dict[str, Any]:
    try:
        diagnosis = state.get("diagnosis")
        if not diagnosis:
            raise ValueError("Missing diagnosis from previous stage.")

        rec, trace = run_recommendation_agent(
            equipment_type=state["equipment_type"],
            location=state["location"],
            complaint=state["complaint"],
            diagnosis=diagnosis,
            cases=state.get("retrieved_cases", [])
        )
        return {
            "recommendation": rec,
            "agent_trace": state.get("agent_trace", []) + [trace]
        }
    except Exception as e:
        logger.error(f"Recommendation node failure: {e}")
        err_trace = AgentTraceStep(
            agent_name="Recommendation Agent",
            status="failed",
            short_description="Recommendation generation failed",
            execution_time_ms=5,
            detail=str(e)
        )
        return {
            "agent_trace": state.get("agent_trace", []) + [err_trace],
            "errors": state.get("errors", []) + [f"Recommendation error: {str(e)}"]
        }

# Node 4: Explanation Node
def explanation_node(state: MaintenanceState) -> Dict[str, Any]:
    try:
        diagnosis = state.get("diagnosis")
        rec = state.get("recommendation")
        if not diagnosis or not rec:
            raise ValueError("Missing diagnosis or recommendation for explanation stage.")

        explanation, trace = run_explanation_agent(
            equipment_type=state["equipment_type"],
            location=state["location"],
            complaint=state["complaint"],
            diagnosis=diagnosis,
            recommendation=rec,
            cases=state.get("retrieved_cases", [])
        )
        return {
            "explanation": explanation,
            "agent_trace": state.get("agent_trace", []) + [trace]
        }
    except Exception as e:
        logger.error(f"Explanation node failure: {e}")
        err_trace = AgentTraceStep(
            agent_name="Explanation Agent",
            status="failed",
            short_description="Explanation rationale generation failed",
            execution_time_ms=5,
            detail=str(e)
        )
        return {
            "agent_trace": state.get("agent_trace", []) + [err_trace],
            "errors": state.get("errors", []) + [f"Explanation error: {str(e)}"]
        }

# Build LangGraph Graph
workflow_builder = StateGraph(MaintenanceState)

workflow_builder.add_node("retrieval", retrieval_node)
workflow_builder.add_node("diagnosis", diagnosis_node)
workflow_builder.add_node("recommendation", recommendation_node)
workflow_builder.add_node("explanation", explanation_node)

workflow_builder.add_edge(START, "retrieval")
workflow_builder.add_edge("retrieval", "diagnosis")
workflow_builder.add_edge("diagnosis", "recommendation")
workflow_builder.add_edge("recommendation", "explanation")
workflow_builder.add_edge("explanation", END)

orchestrator_graph = workflow_builder.compile()

def run_facility_orchestrator(req: AnalyzeRequest) -> AnalyzeResponse:
    """Executes the full multi-agent maintenance decision support workflow."""
    start_total = time.perf_counter()
    request_id = f"REQ-{str(uuid.uuid4())[:8].upper()}"

    logger.info(f"[{request_id}] Starting LangGraph Orchestration for {req.equipment_type} at {req.location}...")

    orch_trace = AgentTraceStep(
        agent_name="Orchestrator",
        status="completed",
        short_description="Initialized multi-agent maintenance diagnosis workflow",
        execution_time_ms=12,
        detail="Coordinating specialized agents: Retrieval -> Diagnosis -> Recommendation -> Explanation.",
        agent="orchestrator",
        label="Orchestrator Agent",
        description="Coordinates the investigation workflow.",
        duration_ms=12,
    )

    initial_state: MaintenanceState = {
        "request_id": request_id,
        "equipment_type": req.equipment_type,
        "location": req.location,
        "complaint": req.complaint,
        "retrieved_cases": [],
        "agent_trace": [orch_trace],
        "errors": []
    }

    final_state = orchestrator_graph.invoke(initial_state)

    diagnosis = final_state.get("diagnosis") or DiagnosisOutput(
        primary_diagnosis="Under Review",
        confidence=50,
        alternative_diagnoses=[],
        reasoning_summary="Diagnosis pending further investigation.",
        supporting_case_ids=[]
    )

    recommendation = final_state.get("recommendation") or RecommendationOutput(
        recommended_action="Inspect unit manually",
        steps=["Isolate power", "Perform physical inspection"],
        urgency="Medium",
        estimated_cost_inr=1500.0,
        estimated_time_hours=2.0,
        safety_note="Wear protective gear."
    )

    explanation = final_state.get("explanation") or ExplanationOutput(
        summary="Analysis complete.",
        why_this_diagnosis="Decision derived from historical trends.",
        evidence_points=["Review unit indicators"],
        similar_case_summary="Historical cases evaluated.",
        supporting_case_ids=[]
    )

    retrieved = final_state.get("retrieved_cases", [])
    trace = final_state.get("agent_trace", [])
    errors = final_state.get("errors", [])

    # Format frontend compatibility fields
    frontend_cases: List[FrontendSimilarCase] = [
        FrontendSimilarCase(
            record_id=c.record.record_id,
            equipment_type=c.record.equipment_type,
            location=c.record.location,
            complaint=c.record.complaint,
            symptom=c.record.symptom,
            likely_cause=c.record.likely_cause,
            recommended_fix=c.record.recommended_fix,
            similarity=round(c.similarity_score * 100, 1),
            cost=c.record.estimated_cost_inr,
            repair_time=c.record.repair_time,
            urgency=c.record.urgency,
            status=c.record.status
        )
        for c in retrieved
    ]

    frontend_alts: List[FrontendAlternativeDiagnosis] = [
        FrontendAlternativeDiagnosis(cause=a.cause, confidence=a.confidence)
        for a in diagnosis.alternative_diagnoses
    ]

    time_str = f"{recommendation.estimated_time_hours} hours" if recommendation.estimated_time_hours > 1 else f"{recommendation.estimated_time_hours} hour"

    # Cache payload for feedback loop
    feedback_service.cache_request_data(request_id, {
        "equipment_type": req.equipment_type,
        "location": req.location,
        "complaint": req.complaint,
        "primary_diagnosis": diagnosis.primary_diagnosis,
        "recommended_action": recommendation.recommended_action,
        "estimated_cost_inr": recommendation.estimated_cost_inr,
        "estimated_time_hours": recommendation.estimated_time_hours,
        "urgency": recommendation.urgency,
    })

    # Record in recent diagnoses for dashboard
    maintenance_service.add_recent_diagnosis(
        RecentDiagnosisItem(
            request_id=request_id,
            equipment=req.equipment_type,
            location=req.location,
            diagnosis=diagnosis.primary_diagnosis,
            confidence=diagnosis.confidence,
            urgency=recommendation.urgency,
            status="Completed"
        )
    )

    total_time_ms = int((time.perf_counter() - start_total) * 1000)
    logger.info(f"[{request_id}] LangGraph Workflow completed in {total_time_ms}ms.")

    return AnalyzeResponse(
        request_id=request_id,
        input={
            "equipment_type": req.equipment_type,
            "location": req.location,
            "complaint": req.complaint
        },
        retrieved_cases=retrieved,
        diagnosis=diagnosis,
        recommendation=recommendation,
        explanation=explanation,
        agent_trace=trace,
        errors=errors,
        # Frontend compatibility fields
        likely_cause=diagnosis.primary_diagnosis,
        confidence=diagnosis.confidence,
        urgency=recommendation.urgency,
        recommended_action=recommendation.recommended_action,
        step_by_step_actions=recommendation.steps,
        estimated_cost=recommendation.estimated_cost_inr,
        estimated_time=time_str,
        safety_note=recommendation.safety_note,
        similar_cases=frontend_cases,
        alternative_diagnoses=frontend_alts
    )
