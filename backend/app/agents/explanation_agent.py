import time
from typing import List, Tuple
from app.models import (
    SimilarCaseItem,
    DiagnosisOutput,
    RecommendationOutput,
    ExplanationOutput,
    AgentTraceStep,
)
from app.services.llm_service import llm_service
from app.utils.prompts import EXPLANATION_SYSTEM_PROMPT, EXPLANATION_USER_PROMPT
from app.utils.logging import logger

def _format_cases_for_prompt(cases: List[SimilarCaseItem]) -> str:
    lines = []
    for c in cases:
        rec = c.record
        lines.append(
            f"Record ID: {rec.record_id} | Equipment: {rec.equipment_type} | "
            f"Complaint: {rec.complaint} | Cause: {rec.likely_cause} | Fix: {rec.recommended_fix}"
        )
    return "\n".join(lines)

def _fallback_explanation(
    equipment_type: str,
    location: str,
    complaint: str,
    diagnosis: DiagnosisOutput,
    recommendation: RecommendationOutput,
    cases: List[SimilarCaseItem]
) -> ExplanationOutput:
    """Historical heuristic fallback: constructs plain-language reasoning citing real case IDs."""
    matching_cases = [c for c in cases if c.record.likely_cause.lower() == diagnosis.primary_diagnosis.lower()]
    supporting_ids = [c.record_id for c in matching_cases][:3] if matching_cases else [c.record_id for c in cases[:2]]

    evidence_points = [
        f"Complaint '{complaint}' aligns with {len(matching_cases)} historical cases displaying similar symptoms for {equipment_type}.",
        f"Historical cases {', '.join(supporting_ids)} were successfully resolved with: '{recommendation.recommended_action}'.",
        f"Average historical repair cost is ₹{int(recommendation.estimated_cost_inr)} with an estimated downtime of {recommendation.estimated_time_hours} hours."
    ]

    why_paragraph = (
        f"Analysis of historical maintenance records indicates that this complaint on {equipment_type} in {location} "
        f"is characteristic of '{diagnosis.primary_diagnosis}'. Historical precedents ({', '.join(supporting_ids)}) "
        f"exhibited nearly identical failure indicators and were resolved via '{recommendation.recommended_action}'."
    )

    case_summary = f"{len(cases)} historical cases evaluated from the knowledge base with up to {int(cases[0].similarity_score * 100)}% similarity." if cases else "No historical precedents available."

    return ExplanationOutput(
        summary=f"Diagnosed {diagnosis.primary_diagnosis} for {equipment_type}. Recommended action: {recommendation.recommended_action}.",
        why_this_diagnosis=why_paragraph,
        evidence_points=evidence_points,
        similar_case_summary=case_summary,
        supporting_case_ids=supporting_ids
    )

def run_explanation_agent(
    equipment_type: str,
    location: str,
    complaint: str,
    diagnosis: DiagnosisOutput,
    recommendation: RecommendationOutput,
    cases: List[SimilarCaseItem]
) -> Tuple[ExplanationOutput, AgentTraceStep]:
    """Transforms structured decision into a plain-language explanation referencing real record IDs."""
    start_time = time.perf_counter()

    valid_case_ids = {c.record.record_id for c in cases}
    cases_text = _format_cases_for_prompt(cases)

    user_prompt = EXPLANATION_USER_PROMPT.format(
        equipment_type=equipment_type,
        location=location,
        complaint=complaint,
        primary_diagnosis=diagnosis.primary_diagnosis,
        confidence=diagnosis.confidence,
        recommended_action=recommendation.recommended_action,
        cases_text=cases_text
    )

    llm_output = llm_service.generate_json_response(
        system_prompt=EXPLANATION_SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    explanation: ExplanationOutput
    if llm_output and "why_this_diagnosis" in llm_output:
        try:
            raw_supporting = llm_output.get("supporting_case_ids", [])
            filtered_supporting = [cid for cid in raw_supporting if cid in valid_case_ids]
            if not filtered_supporting and cases:
                filtered_supporting = [cases[0].record_id]

            explanation = ExplanationOutput(
                summary=str(llm_output.get("summary", "")),
                why_this_diagnosis=str(llm_output.get("why_this_diagnosis", "")),
                evidence_points=list(llm_output.get("evidence_points", [])),
                similar_case_summary=str(llm_output.get("similar_case_summary", "")),
                supporting_case_ids=filtered_supporting
            )
        except Exception as e:
            logger.warning(f"Error parsing LLM explanation response: {e}. Using fallback.")
            explanation = _fallback_explanation(equipment_type, location, complaint, diagnosis, recommendation, cases)
    else:
        explanation = _fallback_explanation(equipment_type, location, complaint, diagnosis, recommendation, cases)

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"Explanation Agent generated rationale citing {len(explanation.supporting_case_ids)} records in {duration_ms}ms.")

    trace_step = AgentTraceStep(
        agent_name="Explanation Agent",
        status="completed",
        short_description=f"Generated plain-language explanation citing {len(explanation.supporting_case_ids)} cases",
        execution_time_ms=max(1, duration_ms),
        detail=f"Supporting historical cases: {', '.join(explanation.supporting_case_ids)}",
        agent="explanation",
        label="Explanation Agent",
        description="Explains the evidence supporting the decision.",
        duration_ms=max(1, duration_ms),
    )

    return explanation, trace_step
